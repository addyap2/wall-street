import { Audio, Video } from "@remotion/media";
import { loadFont as loadLocalFont } from "@remotion/fonts";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DEFAULT_KICKER, EventProps } from "./schema";

// ---- Brand (same tokens as the site's styles.css) ----
const C = {
  blue: "#7B93D4",
  ink: "#223163",
  red: "#E85466",
  cream: "#F4ECDD",
};

loadLocalFont({ family: "Anton", url: staticFile("fonts/Anton-Regular.ttf") });
loadLocalFont({
  family: "Kaushan Script",
  url: staticFile("fonts/KaushanScript-Regular.ttf"),
});
const { fontFamily: OSWALD } = loadOswald("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
const ANTON = "Anton";
const SCRIPT = "Kaushan Script";

/** Frames in brand/neon-intro.mp4 (the flicker-on); neon-loop.mp4 follows it seamlessly. */
const NEON_INTRO = 90;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/** Measure the rendered uppercase glyphs rather than estimating character widths. */
const fitText = (text: string, width: number, max: number, family = ANTON) => {
  if (typeof document === "undefined") return max;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return max;
  context.font = `100px "${family}"`;
  const measured = context.measureText(text.toUpperCase()).width;
  return Math.min(max, Math.floor((width / Math.max(measured, 1)) * 100));
};
const fitAnton = (text: string, width: number, max: number) => fitText(text, width, max);

/** A word that slams in: big → normal size, with a quick fade. */
const Slam: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, mass: 0.7 } });
  return (
    <div
      style={{
        opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
        scale: String(interpolate(s, [0, 1], [1.7, 1])),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const EventPromo: React.FC<EventProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { type, home, away, subtitle, dayLabel, timeLabel, footage, footageStart, music } =
    props;
  const kicker = props.kicker.trim() || DEFAULT_KICKER[type];
  const isMatch = type === "match";
  const titleLines = isMatch
    ? []
    : (props.title.trim() || kicker).split("\n").map((l) => l.trim()).filter(Boolean);

  // ---- Timeline (frames) ----
  const T = {
    logo: 6,
    ribbon: 18,
    title: 32,
    // when the last title piece lands (drives the boom)
    titleDone: isMatch ? 56 : 32 + Math.max(titleLines.length - 1, 0) * 12,
    sub: 66,
    card: 80,
    time: 94,
    footer: 112,
  };

  const logoIn = spring({ frame: frame - T.logo, fps, config: { damping: 12 } });
  const cardIn = spring({ frame: frame - T.card, fps, config: { damping: 16 } });
  const timeIn = spring({ frame: frame - T.time, fps, config: { damping: 9, mass: 0.6 } });

  const textShadow = "0 8px 30px rgba(0,0,0,.35)";

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      {/* ---------- Footage ---------- */}
      <AbsoluteFill
        style={{
          opacity: interpolate(frame, [0, 18], [0, 1], clamp),
          scale: String(interpolate(frame, [0, durationInFrames], [1.08, 1.18])),
        }}
      >
        <Video
          src={staticFile(`footage/${footage}`)}
          trimBefore={Math.round(footageStart * fps)}
          loop
          muted
          objectFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(34,49,99,.88) 0%, rgba(34,49,99,.35) 26%, rgba(34,49,99,.40) 52%, rgba(34,49,99,.94) 78%, ${C.ink} 100%)`,
        }}
      />

      <div style={{ position: "absolute", left: 80, top: 170, color: C.cream,
        fontFamily: OSWALD, fontSize: 24, letterSpacing: ".22em" }}>
        FRÉJUS / LIVE MUSIC & SPORTS
      </div>
      <div style={{ position: "absolute", left: 80, top: 411, width: 800, height: 2,
        backgroundColor: C.blue, transformOrigin: "left", scale: `${interpolate(frame, [4, 26], [0, 1], clamp)} 1` }} />
      <div style={{ position: "absolute", left: 80, top: 1625, color: C.blue,
        fontFamily: OSWALD, fontSize: 24, letterSpacing: ".18em" }}>
        GOOD FOOD · GOOD DRINKS · GOOD PEOPLE
      </div>

      {/* ---------- Logo ---------- */}
      {props.logo === "neon" ? (
        // Blender render on black: "screen" drops the black and keeps only the glow.
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 80,
            right: 160,
            height: 250,
            display: "flex",
            justifyContent: "center",
            mixBlendMode: "screen",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 250,
              height: 250,
              // the wall in the render isn't pure black: fade it out before the square edge
              maskImage: "radial-gradient(circle closest-side, #000 86%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(circle closest-side, #000 86%, transparent 100%)",
            }}
          >
            <Sequence from={T.logo} durationInFrames={NEON_INTRO} layout="none">
              <Video src={staticFile("brand/neon-intro.mp4")} muted style={{ position: "absolute", inset: 0, width: 250, height: 250 }} />
            </Sequence>
            <Sequence from={T.logo + NEON_INTRO} layout="none">
              <Video src={staticFile("brand/neon-loop.mp4")} muted loop style={{ position: "absolute", inset: 0, width: 250, height: 250 }} />
            </Sequence>
          </div>
        </div>
      ) : (
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 80,
          right: 160,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [T.logo, T.logo + 6], [0, 1], clamp),
          translate: `0px ${interpolate(logoIn, [0, 1], [-60, 0])}px`,
        }}
      >
        <Img
          src={staticFile("brand/logo-card.png")}
          style={{
            width: 164,
            borderRadius: 16,
            border: `5px solid ${C.cream}`,
            boxShadow: "0 18px 50px rgba(0,0,0,.45)",
            rotate: "0deg",
          }}
        />
      </div>
      )}

      {/* ---------- Title block ---------- */}
      <div
        style={{
          position: "absolute",
          top: 490,
          left: 80,
          right: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Coral ribbon */}
        <div
          style={{
            rotate: "0deg",
            clipPath: `inset(0 ${interpolate(frame, [T.ribbon, T.ribbon + 12], [100, 0], { ...clamp, easing: outExpo })}% 0 0)`,
            backgroundColor: C.red,
            color: C.cream,
            fontFamily: OSWALD,
            fontWeight: 700,
            fontSize: fitText(kicker, 620, 46, OSWALD),
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "10px 40px 14px",
            boxShadow: `0 10px 0 ${C.ink}`,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: C.cream,
              opacity: frame < T.footer ? 1 : 0.35 + 0.65 * Math.abs(Math.cos((frame - T.footer) / 9)),
            }}
          />
          {kicker}
        </div>

        <div style={{ marginTop: 42, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {isMatch ? (
            <>
              <Slam
                at={T.title}
                style={{
                  fontFamily: ANTON,
                  fontSize: fitAnton(home, 800, 195),
                  lineHeight: 1,
                  color: C.cream,
                  textTransform: "uppercase",
                  textShadow,
                }}
              >
                {home}
              </Slam>
              <Slam
                at={T.title + 12}
                style={{
                  fontFamily: SCRIPT,
                  fontSize: 100,
                  lineHeight: 1.05,
                  color: C.red,
                  rotate: "-6deg",
                  textShadow: `0 6px 0 ${C.ink}`,
                  margin: "-6px 0 4px",
                }}
              >
                vs
              </Slam>
              <Slam
                at={T.title + 24}
                style={{
                  fontFamily: ANTON,
                  fontSize: fitAnton(away, 800, 195),
                  lineHeight: 1,
                  color: C.cream,
                  textTransform: "uppercase",
                  textShadow,
                }}
              >
                {away}
              </Slam>
            </>
          ) : (
            titleLines.map((line, i) => (
              <Slam
                key={i}
                at={T.title + i * 12}
                style={{
                  fontFamily: ANTON,
                  fontSize: fitAnton(line, 800, titleLines.length > 2 ? 145 : 190),
                  lineHeight: 1.04,
                  color: i % 2 === 1 ? C.blue : C.cream,
                  textTransform: "uppercase",
                  textShadow,
                }}
              >
                {line}
              </Slam>
            ))
          )}
        </div>

        {subtitle.trim() ? (
          <div
            style={{
              marginTop: 34,
              fontFamily: SCRIPT,
              fontSize: fitText(subtitle, 760, 48, SCRIPT),
              color: C.cream,
              textShadow: `0 4px 18px rgba(0,0,0,.6)`,
              opacity: interpolate(frame, [T.sub, T.sub + 10], [0, 1], clamp),
              translate: `0px ${interpolate(frame, [T.sub, T.sub + 14], [24, 0], { ...clamp, easing: outExpo })}px`,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* ---------- Date + time card ---------- */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 160,
          top: 1250,
          height: 118,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [T.card, T.card + 6], [0, 1], clamp),
          translate: `0px ${interpolate(cardIn, [0, 1], [140, 0])}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            rotate: "0deg",
            boxShadow: `0 12px 0 ${C.ink}, 0 30px 60px rgba(0,0,0,.4)`,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: C.cream,
              color: C.ink,
              fontFamily: OSWALD,
              fontWeight: 700,
              fontSize: fitText(dayLabel, 390, 48, OSWALD),
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              padding: "18px 36px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {dayLabel}
          </div>
          <div
            style={{
              backgroundColor: C.red,
              color: C.cream,
              fontFamily: ANTON,
              fontSize: fitAnton(timeLabel, 240, 82),
              lineHeight: 1,
              padding: "16px 34px 20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ display: "inline-block", scale: String(interpolate(timeIn, [0, 1], [0.3, 1])) }}>
              {timeLabel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 160,
          top: 1430,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: interpolate(frame, [T.footer, T.footer + 12], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [T.footer, T.footer + 16], [30, 0], { ...clamp, easing: outExpo })}px`,
        }}
      >
        <div
          style={{
            fontFamily: OSWALD,
            fontWeight: 600,
            fontSize: 36,
            color: C.cream,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          36 rue de l'Intendance · Fréjus
        </div>
        <div
          style={{
            fontFamily: OSWALD,
            fontWeight: 500,
            fontSize: 38,
            color: C.cream,
            border: `3px solid ${C.blue}`,
            borderRadius: 999,
            padding: "8px 36px 10px",
          }}
        >
          Réservez au <b style={{ fontWeight: 700 }}>04 98 13 54 45</b>
        </div>
      </div>

      {/* The brand-colour shutter opens onto the real pub, driven only by frame. */}
      <AbsoluteFill style={{ pointerEvents: "none", backgroundColor: C.blue,
        transform: `translateX(${interpolate(frame, [0, 18], [0, -140], { ...clamp, easing: outExpo })}%) skewX(-12deg)`,
        transformOrigin: "bottom", opacity: frame >= 18 ? 0 : 1 }} />

      {/* ---------- Sound ---------- */}
      {music ? (
        <>
          <Audio
            src={staticFile("audio/funky-pop-120.mp3")}
            volume={(f) =>
              interpolate(f, [0, 10, durationInFrames - 24, durationInFrames], [0, 0.55, 0.55, 0], clamp)
            }
          />
          <Sequence from={T.ribbon - 4} durationInFrames={40} layout="none">
            <Audio src={staticFile("audio/whoosh-swish.mp3")} volume={0.6} />
          </Sequence>
          <Sequence from={T.titleDone} durationInFrames={60} layout="none">
            <Audio src={staticFile("audio/boom-impact.mp3")} volume={0.7} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
