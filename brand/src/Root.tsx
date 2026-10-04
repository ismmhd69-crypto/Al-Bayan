import React from "react";
import { Composition, Folder, Still } from "remotion";
import { LogoReveal } from "./LogoReveal";
import { Horizontal, MarkOnly, Stacked } from "./Layouts";
import { HadithReel, calculateHadithMetadata } from "./HadithReel";
import { bukhari1De, bukhari1En } from "./hadith/bukhari-1";
import { PuppetSheet } from "./motion/PuppetSheet";
import { ReelCover } from "./ReelCover";
import { AngerMotion, calculateAngerMetadata } from "./AngerMotion";
import { angerMotion } from "./hadith/anger-motion";
import { IntentionMotion, calculateIntentionMetadata } from "./IntentionMotion";
import { bukhari1Motion } from "./hadith/bukhari-1-motion";
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
      <Folder name="Social">
        {/* Vertical hadith teaching reels with voiceover, no music. Length follows the voice clips. */}
        <Composition id="HadithReel" component={HadithReel} calculateMetadata={calculateHadithMetadata} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={bukhari1En} />
        <Composition id="HadithReelDE" component={HadithReel} calculateMetadata={calculateHadithMetadata} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={bukhari1De} />
        {/* Motion-design pilot: rigged characters, moving camera, sound effects, voice-synced captions. */}
        <Composition id="IntentionMotion" component={IntentionMotion} calculateMetadata={calculateIntentionMetadata} durationInFrames={1500} fps={30} width={1080} height={1920} defaultProps={bukhari1Motion} />
        <Composition id="AngerMotion" component={AngerMotion} calculateMetadata={calculateAngerMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={angerMotion} />
      </Folder>
      <Folder name="Covers">
        {/* One cover per reel. Key content stays inside the 3:4 grid crop (y 240 to 1680). */}
        <Still id="Cover-01-Intentions" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "INTENTIONS", arabicTitle: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "Sahih al-Bukhari 1", art: "intention" as const }} />
        <Still id="Cover-02-TrueStrength" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "TRUE STRENGTH", titleSize: 128, arabicTitle: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ", source: "Sahih al-Bukhari 6114", art: "anger" as const }} />
      </Folder>
      <Folder name="Dev">
        <Still id="PuppetSheet" component={PuppetSheet} width={2400} height={1500} />
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
        {/* Social media profile picture (Instagram, TikTok, YouTube, X): star only, sized to sit inside the round crop. */}
        <Still id="SocialProfile" component={MarkOnly} width={2048} height={2048} defaultProps={{ theme: dark, markSize: 1340 }} />
        <Still id="AppleIcon" component={MarkOnly} width={180} height={180} defaultProps={{ theme: dark, markSize: 132 }} />
        <Still id="OgImage" component={Horizontal} width={1200} height={630} defaultProps={{ theme: light, markSize: 300 }} />
      </Folder>
    </>
  );
};
