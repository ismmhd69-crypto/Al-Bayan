import React from "react";
import { Composition, Folder, Still } from "remotion";
import { LogoReveal } from "./LogoReveal";
import { Horizontal, MarkOnly, Stacked } from "./Layouts";
import { dark, light, transparentDark, transparentLight } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Animation">
        <Composition
          id="LogoReveal"
          component={LogoReveal}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ theme: light, markSize: 360 }}
        />
        <Composition
          id="LogoRevealSquareDark"
          component={LogoReveal}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1080}
          defaultProps={{ theme: dark, markSize: 380 }}
        />
      </Folder>
      <Folder name="Stills">
        {/* Profile picture (Buy Me a Coffee, social): safe inside a circle crop. */}
        <Still id="Avatar" component={Stacked} width={1024} height={1024} defaultProps={{ theme: dark, markSize: 400 }} />
        <Still id="AvatarLight" component={Stacked} width={1024} height={1024} defaultProps={{ theme: light, markSize: 400 }} />
        <Still id="Mark" component={MarkOnly} width={1024} height={1024} defaultProps={{ theme: transparentLight, markSize: 1000 }} />
        <Still id="MarkLightOnDark" component={MarkOnly} width={1024} height={1024} defaultProps={{ theme: transparentDark, markSize: 1000 }} />
        <Still id="Stacked" component={Stacked} width={1600} height={1600} defaultProps={{ theme: transparentLight, markSize: 640 }} />
        <Still id="Horizontal" component={Horizontal} width={2400} height={800} defaultProps={{ theme: transparentLight, markSize: 520 }} />
        <Still id="HorizontalDark" component={Horizontal} width={2400} height={800} defaultProps={{ theme: dark, markSize: 520 }} />
        {/* Website files: app/apple-icon.png and app/[lang]/opengraph-image.png */}
        <Still id="AppleIcon" component={MarkOnly} width={180} height={180} defaultProps={{ theme: dark, markSize: 132 }} />
        <Still id="OgImage" component={Horizontal} width={1200} height={630} defaultProps={{ theme: light, markSize: 300 }} />
      </Folder>
    </>
  );
};
