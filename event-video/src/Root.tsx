import { Composition } from "remotion";
import { EventPromo } from "./EventPromo";
import { defaultProps, DURATION, eventSchema, FPS } from "./schema";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EventPromo"
      component={EventPromo}
      schema={eventSchema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
