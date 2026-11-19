#!/usr/bin/env node
// Render one event from a JSON file:
//   npm run event -- events/2026-11-12-italie-france.json
//
// Produces
//   out/<slug>.mp4            1080×1920 with sound  → Instagram / Facebook / TikTok
//   ../videos/<slug>.mp4      720×1280, muted, light → the website
//   ../videos/<slug>-poster.jpg  576×1024             → the website poster
// and prints the « À l'affiche » HTML block to paste into index.html.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = resolve(root, "..");
const POSTER_FRAME = 200; // keep in sync with src/schema.ts
const manifest = join(root, "events", "rendered.txt");

const file = process.argv[2];
if (file === "--sync") {
  syncFootage();
  console.log("Footage synced to public/footage");
  process.exit(0);
}
if (!file) {
  console.error("Usage: npm run event -- events/<event>.json");
  process.exit(1);
}
const ev = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8"));
const slug = ev.slug || basename(file, ".json").replace(/^\d{4}-\d{2}-\d{2}-/, "");
const skipSite = process.argv.includes("--no-site");
const fail = (message) => { console.error(`Invalid event: ${message}`); process.exit(1); };
if (!["match", "live", "soiree"].includes(ev.type)) fail("type must be match, live or soiree");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("slug must use lowercase letters, numbers and hyphens");
function validDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
if (typeof ev.date !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(ev.date) || !validDay(ev.date.slice(0, 10))) fail("date must be a real Paris date: YYYY-MM-DDTHH:mm");
if (ev.type === "match" && (![ev.home, ev.away].every(v => typeof v === "string" && v.trim() && v.length <= 40))) fail("provide two team names (maximum 40 characters each)");
if (ev.type !== "match" && (typeof ev.title !== "string" || !ev.title.trim() || ev.title.split("\n").length > 3 || ev.title.length > 100)) fail("provide a title of up to three lines and 100 characters");
for (const key of ["kicker", "subtitle", "dayLabel", "timeLabel", "footage"]) {
  if (ev[key] !== undefined && typeof ev[key] !== "string") fail(`${key} must be text`);
}
if ((ev.kicker?.length || 0) > 40 || (ev.subtitle?.length || 0) > 70 || (ev.dayLabel?.length || 0) > 30 || (ev.timeLabel?.length || 0) > 10) fail("shorten the ribbon, subtitle, date or time label");
if (ev.footage && (basename(ev.footage) !== ev.footage || !ev.footage.endsWith(".mp4"))) fail("footage must be an MP4 filename");
if (ev.footageStart !== undefined && (!Number.isFinite(ev.footageStart) || ev.footageStart < 0)) fail("footageStart must be zero or positive");
if (ev.music !== undefined && typeof ev.music !== "boolean") fail("music must be true or false");
if (ev.logo !== undefined && !["neon", "card"].includes(ev.logo)) fail('logo must be "neon" or "card"');
if (ev.until !== undefined && (!validDay(ev.until) || ev.until < ev.date.slice(0, 10))) fail("until must be a real date on or after the event");
if (ev.expires !== undefined && (typeof ev.expires !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(ev.expires) || Number.isNaN(Date.parse(ev.expires)))) fail("expires must be a date and time with an explicit timezone");
if (process.argv.includes("--check")) { console.log("Event details are valid."); process.exit(0); }


// The site's own clips (sport.mp4, live.mp4…) must never be overwritten:
// only slugs this script rendered before (listed in events/rendered.txt) may be replaced.
if (!skipSite && existsSync(join(site, "videos", `${slug}.mp4`)) && !rendered().has(slug)) {
  console.error(`videos/${slug}.mp4 already exists and is not an event video. Rename the JSON file or set a "slug".`);
  process.exit(1);
}

// ---- 1. Footage: mirror the site's videos into public/footage ----
syncFootage();

// ---- 2. Labels from the ISO date ("2026-11-12T20:45") ----
const [d, hm = "20:00"] = String(ev.date).split("T");
const when = new Date(`${d}T12:00:00`);
const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(when);
const day = when.getDate();
const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(when); // "nov."
const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(when);
const [hh, mm] = hm.split(":");
const timeLabel = ev.timeLabel || `${Number(hh)}h${mm}`;
const dayLabel = ev.dayLabel || `${cap(weekday)} ${day} ${monthShort}`;

const props = {
  type: ev.type,
  kicker: ev.kicker ?? "",
  home: ev.home ?? "",
  away: ev.away ?? "",
  title: ev.title ?? "",
  subtitle: ev.subtitle ?? "",
  dayLabel,
  timeLabel,
  footage: ev.footage || { match: "sport.mp4", live: "live.mp4", soiree: "ambiance.mp4" }[ev.type],
  footageStart: ev.footageStart ?? 0,
  music: ev.music ?? true,
  logo: ev.logo ?? "neon",
};
if (!existsSync(join(root, "public/footage", props.footage))) {
  console.error(`Footage "${props.footage}" not found in public/footage. Available:\n  ${readdirSync(join(root, "public/footage")).join("\n  ")}`);
  process.exit(1);
}

mkdirSync(join(root, "out"), { recursive: true });
const propsFile = join(root, "out", `${slug}.props.json`);
writeFileSync(propsFile, JSON.stringify(props, null, 2));

// ---- 3. Render ----
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
const social = join(root, "out", `${slug}.mp4`);
const still = join(root, "out", `${slug}-poster.png`);
run("npx", ["remotion", "render", "EventPromo", social, `--props=${propsFile}`, "--codec=h264", "--crf=18"]);
run("npx", ["remotion", "still", "EventPromo", still, `--props=${propsFile}`, `--frame=${POSTER_FRAME}`]);

// ---- 4. Website versions ----
if (!skipSite) {
  const siteVideo = join(site, "videos", `${slug}.mp4`);
  const sitePoster = join(site, "videos", `${slug}-poster.jpg`);
  run("ffmpeg", ["-v", "error", "-y", "-i", social, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", siteVideo]);
  run("ffmpeg", ["-v", "error", "-y", "-i", still, "-vf", "scale=576:1024", "-q:v", "4", sitePoster]);
  if (!rendered().has(slug)) writeFileSync(manifest, [...rendered(), slug].join("\n") + "\n");
  const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;
  console.log(`\n✔ Website video  videos/${slug}.mp4 (${kb(siteVideo)})`);
  console.log(`✔ Website poster videos/${slug}-poster.jpg (${kb(sitePoster)})`);
}
console.log(`✔ Social video   event-video/out/${slug}.mp4\n`);

// ---- 5. HTML block for index.html ----
const name = ev.type === "match" ? `${ev.home} – ${ev.away}` : (ev.title || props.kicker).replace(/\n/g, " ");
const until = ev.until || d;
const nextDay = new Date(`${until}T12:00:00`);
nextDay.setDate(nextDay.getDate() + 1);
const nextIso = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;
const expires = ev.expires || `${nextIso}T01:00:00${parisOffset(new Date(`${nextIso}T00:00:00Z`))}`;
const [badge, badgeEn] = { match: ["En direct", "Live"], live: ["Live", "Live"], soiree: ["Soirée", "Party"] }[ev.type];
console.log(`<!-- À L'AFFICHE: paste over the existing <section class="affiche"> opening + <figure> -->
<section class="affiche" id="affiche" data-date="${d}T${hm}" data-until="${until}" data-expires="${expires}">
  <div class="affiche__grid">
    <figure class="affiche__poster affiche__poster--video">
      <img class="events__poster" src="videos/${slug}-poster.jpg" alt="Annonce ${esc(name)} au Wall Street à Fréjus, ${weekday} ${day} ${monthLong} à ${esc(timeLabel)}" width="576" height="1024" loading="lazy" decoding="async" />
      <video class="events__video js-ambient-video" src="videos/${slug}.mp4" muted loop playsinline preload="none" width="576" height="1024" aria-label="Annonce vidéo ${esc(name)} au Wall Street à Fréjus"></video>
      <span class="events__video-badge"><span class="events__video-dot"></span><span data-en="${badgeEn}">${badge}</span></span>
    </figure>`);

/** "+01:00" in winter, "+02:00" in summer (Europe/Paris). */
function parisOffset(date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "shortOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName").value; // "GMT+1"
  return `+${String(name.replace("GMT+", "")).padStart(2, "0")}:00`;
}
function rendered() {
  return new Set(existsSync(manifest) ? readFileSync(manifest, "utf8").split("\n").filter(Boolean) : []);
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function syncFootage() {
  const dest = join(root, "public/footage");
  mkdirSync(dest, { recursive: true });
  const ownOutputs = rendered();
  const sources = [
    ...readdirSync(join(site, "videos")).filter((f) => f.endsWith(".mp4")).map((f) => join(site, "videos", f)),
    join(site, "images/live.mp4"),
  ];
  for (const src of sources) {
    const to = join(dest, basename(src));
    if (ownOutputs.has(basename(src, ".mp4"))) continue; // never reuse an event video as footage
    if (!existsSync(to) || statSync(to).mtimeMs < statSync(src).mtimeMs) copyFileSync(src, to);
  }
}
