import { z } from "zod";

/**
 * Everything an event video needs. The render script fills `dayLabel` and
 * `timeLabel` from the event's ISO date, so an event JSON only has to say
 * what is on and when (see events/*.json and README.md).
 */
export const eventSchema = z.object({
  /** match = a game on the big screen · live = concert / DJ · soiree = theme night */
  type: z.enum(["match", "live", "soiree"]),
  /** Ribbon above the title. Empty = the type's default ("Match en direct"…). */
  kicker: z.string(),
  /** Match only: the two teams, as they should read (home first). */
  home: z.string(),
  away: z.string(),
  /** Live / soirée: the big title. Use "\n" to force a line break. */
  title: z.string(),
  /** Small line under the title: competition, artist style, dress code… */
  subtitle: z.string(),
  /** e.g. "Jeudi 12 nov." */
  dayLabel: z.string(),
  /** e.g. "20h45" */
  timeLabel: z.string(),
  /** A file in public/footage/ (copied from the site's videos/ by the script). */
  footage: z.string(),
  /** Seconds to skip at the start of the footage. */
  footageStart: z.number().min(0),
  /** Background music + sound effects (the website copy is muted anyway). */
  music: z.boolean(),
});

export type EventProps = z.infer<typeof eventSchema>;

export const FPS = 30;
export const DURATION = 10 * FPS;
/** The frame used for the poster image: everything is on screen by then. */
export const POSTER_FRAME = 200;

export const DEFAULT_KICKER: Record<EventProps["type"], string> = {
  match: "Match en direct",
  live: "Live music",
  soiree: "Soirée spéciale",
};

export const defaultProps: EventProps = {
  type: "match",
  kicker: "",
  home: "Italie",
  away: "France",
  title: "",
  subtitle: "Ligue des Nations",
  dayLabel: "Jeudi 12 nov.",
  timeLabel: "20h45",
  footage: "sport.mp4",
  footageStart: 2,
  music: true,
};
