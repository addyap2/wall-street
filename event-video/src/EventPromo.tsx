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

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/** Anton is condensed: ~0.46em per capital. Fit a line into `width` px. */
const fitAnton = (text: string, width: number, max: number) =>
  Math.min(max, Math.round(width / (Math.max(text.length, 1) * 0.46)));

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

  const textShadow = `0 6px 0 ${C.ink}, 0 14px 40px rgba(0,0,0,.45)`;

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

      {/* ---------- Logo ---------- */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [T.logo, T.logo + 6], [0, 1], clamp),
          translate: `0px ${interpolate(logoIn, [0, 1], [-60, 0])}px`,
        }}
      >
        <Img
          src={staticFile("brand/logo-card.png")}
          style={{
            width: 250,
            borderRadius: 26,
            border: `5px solid ${C.cream}`,
            boxShadow: "0 18px 50px rgba(0,0,0,.45)",
            rotate: "-3deg",
          }}
        />
      </div>

      {/* ---------- Title block ---------- */}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Coral ribbon */}
        <div
          style={{
            rotate: "-3deg",
            clipPath: `inset(0 ${interpolate(frame, [T.ribbon, T.ribbon + 12], [100, 0], { ...clamp, easing: outExpo })}% 0 0)`,
            backgroundColor: C.red,
            color: C.cream,
            fontFamily: OSWALD,
            fontWeight: 700,
            fontSize: 58,
            letterSpacing: "0.08em",
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

        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {isMatch ? (
            <>
              <Slam
                at={T.title}
                style={{
                  fontFamily: ANTON,
                  fontSize: fitAnton(home, 920, 230),
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
                  fontSize: 150,
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
                  fontSize: fitAnton(away, 920, 230),
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
                  fontSize: fitAnton(line, 920, titleLines.length > 2 ? 190 : 230),
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
              fontSize: 66,
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
          left: 0,
          right: 0,
          bottom: 360,
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
            rotate: "-2deg",
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
              fontSize: 66,
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
              fontSize: 110,
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
          right: 80,
          bottom: 120,
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
            fontSize: 50,
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
            fontSize: 44,
            color: C.cream,
            border: `3px solid ${C.blue}`,
            borderRadius: 999,
            padding: "8px 36px 10px",
          }}
        >
          Réservez au <b style={{ fontWeight: 700 }}>04 98 13 54 45</b>
        </div>
      </div>

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
