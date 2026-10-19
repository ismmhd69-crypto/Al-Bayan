import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { BayanMark } from "./BayanMark";
import { Latin } from "./Wordmark";
import { StarPattern } from "./StarPattern";
import { dark as theme } from "./theme";
import { MAN_GREY, MAN_STRONG, MAN_WHITE, Man, POSES } from "./motion/Man";
import { AngerMeter, CrossBadge, Masjid, CrowdFigure, Heart, Quran, Rays, SpeechBubbleDark, SpeechBubbleGold, Star, Steam } from "./motion/Props";
import { Animal, BODY_POINTS, Balance, GiftBox, Camel, LightOrb, Mest, MotherFigure, Road, Sandal, ThornBranch, Tree, Well } from "./motion/Props2";

const { fontFamily: amiri } = loadAmiri("normal", { weights: ["700"], subsets: ["arabic"] });
const { fontFamily: sans } = loadInter("normal", { weights: ["800"], subsets: ["latin"] });
const { fontFamily: serif } = loadNewsreader("normal", { weights: ["500"], subsets: ["latin"] });

// Cover (thumbnail) for every Al-Bayan reel. 1080x1920.
// Instagram's profile grid crops covers to 3:4 (the middle 1080x1440, y 240..1680),
// so the title, art and source all sit inside that band. Brand tag sits just
// inside it at the top; nothing important outside it.

export type ReelCoverProps = {
  title: string; // big English word, e.g. "INTENTIONS"
  arabicTitle: string; // short Arabic line, e.g. the hadith opening
  source: string; // e.g. "Sahih al-Bukhari 1"
  art: "intention" | "anger" | "speak" | "mother" | "quran" | "onebody" | "salam" | "brother" | "tree" | "dog" | "thorn" | "five" | "night" | "patience" | "truth" | "twowords" | "tawba" | "gheeba" | "three" | "near" | "easy"; // which illustration to draw (add more per video)
  titleSize?: number; // shrink long titles so they fit one line (default 168)
};

const Art: React.FC<{ kind: ReelCoverProps["art"] }> = ({ kind }) => {
  if (kind === "intention") {
    // Man raising his hands for prayer, heart glowing gold, rays behind.
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", left: "50%", top: 395, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 395, width: 520, height: 520, transform: "translate(-50%, -50%)", borderRadius: 999, background: "radial-gradient(circle, rgba(255,226,150,0.55) 0%, rgba(212,168,82,0.18) 45%, transparent 70%)" }} />
        {/* Positioned so it paints above the rays and glow. */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.takbir} size={760} heart={{ color: theme.gold, glow: 1.1, scale: 1.55 }} />
        </div>
      </div>
    );
  }
  if (kind === "anger") {
    // Calm man glowing gold; red steam of anger blows away behind him; meter low.
    const puffs = [
      { x: 250, y: 150, s: 170, p: 0.45, o: 0.9 },
      { x: 170, y: 300, s: 130, p: 0.6, o: 0.7 },
      { x: 830, y: 140, s: 160, p: 0.5, o: 0.85 },
      { x: 920, y: 290, s: 120, p: 0.65, o: 0.65 },
      { x: 110, y: 120, s: 90, p: 0.75, o: 0.5 },
      { x: 980, y: 110, s: 90, p: 0.75, o: 0.5 },
    ];
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        {puffs.map((q, i) => (
          <div key={i} style={{ position: "absolute", left: q.x, top: q.y, transform: "translate(-50%, -50%)", opacity: q.o, filter: "drop-shadow(0 0 18px rgba(224,50,43,0.6))" }}>
            <Steam size={q.s} p={q.p} color="#e0322b" />
          </div>
        ))}
        <div style={{ position: "absolute", left: "50%", top: 395, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 395, width: 520, height: 520, transform: "translate(-50%, -50%)", borderRadius: 999, background: "radial-gradient(circle, rgba(255,226,150,0.5) 0%, rgba(212,168,82,0.16) 45%, transparent 70%)" }} />
        <div style={{ position: "absolute", left: 120, bottom: 40 }}>
          <AngerMeter height={300} level={0.12} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.calm} size={760} heart={{ color: theme.gold, glow: 1, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  if (kind === "mother") {
    // Son with a gift before his glowing mother.
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10 }}>
        <div style={{ position: "absolute", left: "58%", top: 380, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "relative", zIndex: 1, transform: "translateX(-40px)" }}>
          <Man pose={POSES.give} size={640} rightItem={<g transform="translate(-36 -14)"><GiftBox size={72} /></g>} />
        </div>
        <div style={{ position: "relative", zIndex: 1, transform: "translateX(-60px)" }}>
          <MotherFigure size={620} glow={1.2} armUp={0.5} />
        </div>
      </div>
    );
  }
  if (kind === "quran") {
    // Man holding a glowing Quran, two learners beside him.
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 0 }}>
        <div style={{ position: "absolute", left: "50%", top: 360, transform: "translate(-50%, -50%)" }}>
          <Rays size={800} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.stand} style={MAN_GREY} size={430} heart={{ color: theme.gold, glow: 1, scale: 1 }} />
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <Man pose={POSES.give} size={700} heart={{ color: theme.gold, glow: 1.2, scale: 1.3 }} />
          <div style={{ position: "absolute", left: 360, top: 230, transform: "rotate(-8deg)" }}>
            <Quran width={200} glow={1.4} />
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.stand} style={MAN_GREY} size={400} heart={{ color: theme.gold, glow: 1, scale: 1 }} />
        </div>
      </div>
    );
  }
  if (kind === "onebody") {
    // Many small people forming one body, glowing.
    const cols = ["#9aa6c4", "#c9733a", "#2f8f6b", "#5f79c4", "#e9ecf3", "#b88660"];
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)" }}>
          <Rays size={820} spin={8} opacity={0.6} />
        </div>
        {BODY_POINTS.map(([nx, ny], i) => (
          <div key={i} style={{ position: "absolute", left: 540 + nx * 420 - 21, top: 30 + ny * 760 - 70 }}>
            <CrowdFigure size={70} color={i === 12 ? theme.gold : cols[i % cols.length]} arm={0.4} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "salam") {
    // Two men greeting each other, gold salam bubble, hearts rising between them.
    const greet = { ...POSES.stand, right: { out: 138, bend: 32 }, headTilt: -3 };
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 430, transform: "translate(-50%, -50%)" }}>
          <Rays size={800} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 240, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={greet} style={MAN_WHITE} size={600} heart={{ color: theme.gold, glow: 1, scale: 1.1 }} />
        </div>
        <div style={{ position: "absolute", left: 840, bottom: 0, transform: "translateX(-50%) scaleX(-1)", zIndex: 1 }}>
          <Man pose={greet} style={MAN_GREY} size={580} />
        </div>
        {[{ x: 540, y: 420, s: 90 }, { x: 490, y: 300, s: 64 }, { x: 600, y: 230, s: 54 }].map((h, i) => (
          <div key={i} style={{ position: "absolute", left: h.x, top: h.y, transform: "translate(-50%, -50%)", zIndex: 2 }}>
            <Heart size={h.s} color={theme.gold} glow={0.8} />
          </div>
        ))}
        <div style={{ position: "absolute", left: "50%", top: 30, transform: "translateX(-50%)", zIndex: 3 }}>
          <SpeechBubbleGold width={420} glow={1.2} tail="bottom">
            <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 60, color: "#8a5a12", lineHeight: 1.5 }}>السَّلَامُ عَلَيْكُمْ</div>
          </SpeechBubbleGold>
        </div>
      </div>
    );
  }
  if (kind === "brother") {
    // Two brothers, each holding the same gift; both hearts glow gold.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)" }}>
          <Rays size={820} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 250, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={POSES.carry} style={MAN_WHITE} size={620} heart={{ color: theme.gold, glow: 1.1, scale: 1.2 }} rightItem={<g transform="translate(-34 -14)"><GiftBox size={76} /></g>} />
        </div>
        <div style={{ position: "absolute", left: 830, bottom: 0, transform: "translateX(-50%) scaleX(-1)", zIndex: 1 }}>
          <Man pose={POSES.carry} style={MAN_GREY} size={600} heart={{ color: theme.gold, glow: 1.1, scale: 1.2 }} rightItem={<g transform="translate(-34 -14)"><GiftBox size={76} /></g>} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 260, transform: "translateX(-50%)", fontFamily: sans, fontWeight: 800, fontSize: 190, color: theme.gold, textShadow: "0 8px 30px rgba(0,0,0,0.5)", zIndex: 2 }}>=</div>
      </div>
    );
  }
  if (kind === "tree") {
    // A fruit tree glowing gold; a man who planted it, a bird and a sheep sharing its fruit.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 380, transform: "translate(-50%, -50%)" }}>
          <Rays size={860} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 560, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Tree size={780} grow={1} fruit={1} glow={1} />
        </div>
        <div style={{ position: "absolute", left: 190, bottom: 0, transform: "translateX(-50%)", zIndex: 2 }}>
          <Man pose={POSES.give} style={MAN_WHITE} size={540} heart={{ color: theme.gold, glow: 1, scale: 1.1 }} />
        </div>
        <div style={{ position: "absolute", left: 900, bottom: 0, transform: "translateX(-50%) scaleX(-1)", zIndex: 2 }}>
          <Animal size={150} kind="sheep" />
        </div>
        {[{ x: 380, y: 140 }, { x: 760, y: 120 }].map((o, i) => (
          <div key={i} style={{ position: "absolute", left: o.x, top: o.y, transform: "translate(-50%, -50%)", zIndex: 2 }}>
            <LightOrb size={90} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "dog") {
    // A man pours water from his leather sock for a thirsty dog, beside the well.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: 560, top: 420, transform: "translate(-50%, -50%)" }}>
          <Rays size={820} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 150, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Well size={230} />
        </div>
        <div style={{ position: "absolute", left: 420, bottom: 0, transform: "translateX(-50%)", zIndex: 2 }}>
          <Man pose={{ ...POSES.give, lean: 6 }} style={MAN_WHITE} size={620} heart={{ color: theme.gold, glow: 1.1, scale: 1.2 }} />
        </div>
        <div style={{ position: "absolute", left: 660, top: 470, transform: "translate(-50%, -50%) rotate(60deg)", zIndex: 3 }}>
          <Mest size={110} water={1} />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 700 + i * 8, top: 540 + i * 50, width: 16, height: 26, borderRadius: "50%", background: "#7fc4f0", zIndex: 3 }} />
        ))}
        <div style={{ position: "absolute", left: 820, bottom: 0, transform: "translateX(-50%) scaleX(-1)", zIndex: 2 }}>
          <Animal size={210} kind="dog" pant={1} />
        </div>
      </div>
    );
  }
  if (kind === "thorn") {
    // A man lifts a thorny branch off the road, glowing.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 380, transform: "translate(-50%, -50%)" }}>
          <Rays size={840} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: -60, bottom: -50 }}>
          <Road w={1200} h={110} />
        </div>
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={POSES.lift} style={MAN_WHITE} size={680} heart={{ color: theme.gold, glow: 1.1, scale: 1.3 }} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 70, transform: "translate(-50%, -50%) rotate(-6deg)", zIndex: 2 }}>
          <ThornBranch size={460} />
        </div>
      </div>
    );
  }
  if (kind === "five") {
    // A clean, glowing man in prayer above a river; five gold circles for the five prayers.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 430, transform: "translate(-50%, -50%)" }}>
          <Rays size={800} spin={8} opacity={0.6} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = Math.PI * (1 - i / 4);
          return (
            <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * 400, top: 330 - Math.sin(a) * 250, transform: "translate(-50%, -50%)", width: 96, height: 96, borderRadius: 99, background: theme.gold, color: "#1b2d66", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 800, fontSize: 48, boxShadow: "0 0 30px rgba(212,168,82,0.8)", zIndex: 2 }}>
              {i + 1}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 40, right: 40, bottom: -30, height: 80, borderRadius: 30, background: "#2f6fae", zIndex: 0 }} />
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={POSES.takbir} style={MAN_WHITE} size={600} heart={{ color: theme.gold, glow: 1.1, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  if (kind === "night") {
    // Night sky, crescent moon; a man standing in dua, his heart glowing.
    const dua = { ...POSES.stand, left: { out: 34, bend: 118 }, right: { out: 34, bend: 118 }, headTilt: 4 };
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: (i * 397) % 1040 + 20, top: (i * 233) % 560 + 20, width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, borderRadius: 99, background: "#f4efe3", opacity: 0.5 + (i % 2) * 0.4 }} />
        ))}
        <svg width={220} height={220} viewBox="-50 -50 100 100" style={{ position: "absolute", left: 760, top: 30 }}>
          <circle r={46} fill="#f4e3b5" opacity={0.15} />
          <path d="M 6 -40 A 40 40 0 1 0 6 40 A 60 60 0 0 1 6 -40 Z" fill="#f4e3b5" />
        </svg>
        <div style={{ position: "absolute", left: "50%", top: 430, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.5} />
        </div>
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={dua} style={MAN_WHITE} size={660} heart={{ color: theme.gold, glow: 1.2, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  if (kind === "patience") {
    // Red shock rings of a calamity; the man stands calm, his heart glowing gold.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        {[300, 520, 740].map((d, i) => (
          <div key={i} style={{ position: "absolute", left: 540 - d / 2, top: 400 - d / 2, width: d, height: d, borderRadius: 999, border: `${10 - i * 3}px solid #e0322b`, opacity: 0.8 - i * 0.22 }} />
        ))}
        <div style={{ position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)" }}>
          <Rays size={700} spin={8} opacity={0.55} />
        </div>
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={POSES.calm} style={MAN_WHITE} size={680} heart={{ color: theme.gold, glow: 1.3, scale: 1.5 }} />
        </div>
      </div>
    );
  }
  if (kind === "truth") {
    // A man walking up golden steps to a gate of light; dark steps fall away below.
    const step = (i: number, gold: boolean, dir: number) => (
      <div key={`${gold}${i}`} style={{ position: "absolute", left: 300 + i * 110, top: (gold ? 650 : 690) + dir * i * 64, width: 120, height: 30, borderRadius: 8, background: gold ? `linear-gradient(180deg, #f2d39a, ${theme.gold})` : "linear-gradient(180deg, #4a3e4e, #2a2430)", boxShadow: gold ? "0 0 24px rgba(212,168,82,0.6)" : undefined }} />
    );
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: 880, top: 220, transform: "translate(-50%, -50%)" }}>
          <Rays size={640} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 800, top: 70, width: 170, height: 230, borderRadius: "85px 85px 10px 10px", border: `9px solid ${theme.gold}`, background: "rgba(255,240,200,0.85)", boxShadow: "0 0 80px rgba(255,226,150,0.8)" }} />
        {[0, 1, 2, 3, 4].map((i) => step(i, true, -1))}
        {[0, 1].map((i) => step(i, false, 1))}
        <div style={{ position: "absolute", left: 250, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={{ ...POSES.stand, stepR: 0.6 }} style={MAN_WHITE} size={600} heart={{ color: theme.gold, glow: 1.1, scale: 1.3 }} />
        </div>
      </div>
    );
  }
  if (kind === "twowords") {
    // A golden scale; the two phrases weigh the right pan down.
    const card = (text: string) => (
      <div lang="ar" dir="rtl" style={{ padding: "4px 18px", borderRadius: 16, background: "linear-gradient(180deg, #fffcf4, #f7e8c3)", border: `3px solid ${theme.gold}`, boxShadow: "0 0 30px rgba(212,168,82,0.7)", fontFamily: amiri, fontWeight: 700, fontSize: 40, color: "#8a5a12", whiteSpace: "nowrap", lineHeight: 1.6 }}>{text}</div>
    );
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 380, transform: "translate(-50%, -50%)" }}>
          <Rays size={820} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)" }}>
          <Balance width={960} tilt={20} right={<div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", transform: "scale(0.7)", transformOrigin: "50% 100%" }}>{card("سُبْحَانَ اللَّهِ الْعَظِيمِ")}{card("سُبْحَانَ اللَّهِ وَبِحَمْدِهِ")}</div>} />
        </div>
      </div>
    );
  }
  if (kind === "tawba") {
    // A man turning to Allah in dua, heart glowing; the dark cloud over him drifts away.
    const dua = { ...POSES.stand, left: { out: 34, bend: 118 }, right: { out: 34, bend: 118 }, headTilt: 4 };
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 420, transform: "translate(-50%, -50%)" }}>
          <Rays size={800} spin={8} opacity={0.6} />
        </div>
        <svg width={300} height={150} viewBox="0 0 260 130" style={{ position: "absolute", left: 30, top: 20, opacity: 0.45 }}>
          <ellipse cx={80} cy={80} rx={70} ry={45} fill="#4a5168" />
          <ellipse cx={160} cy={66} rx={80} ry={56} fill="#4a5168" />
          <ellipse cx={205} cy={92} rx={50} ry={36} fill="#4a5168" />
        </svg>
        <div style={{ position: "absolute", left: 860, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Camel size={250} />
        </div>
        <div style={{ position: "absolute", left: 430, bottom: 0, transform: "translateX(-50%)", zIndex: 2 }}>
          <Man pose={dua} style={MAN_WHITE} size={660} heart={{ color: theme.gold, glow: 1.2, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  if (kind === "gheeba") {
    // A man holds back his tongue: the gossip bubble is crossed out; the absent brother walks away.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: 400, top: 420, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.55} />
        </div>
        <div style={{ position: "absolute", left: 860, bottom: 70, transform: "translateX(-50%)", opacity: 0.7 }}>
          <Man pose={POSES.stand} style={MAN_STRONG} size={400} />
        </div>
        <div style={{ position: "absolute", left: 380, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={POSES.quiet} style={MAN_WHITE} size={640} heart={{ color: theme.gold, glow: 1.1, scale: 1.3 }} />
        </div>
        <div style={{ position: "absolute", left: 640, top: 40, transform: "rotate(5deg)", zIndex: 2 }}>
          <SpeechBubbleDark width={300} tail="bottom">
            <svg width={210} height={56} viewBox="0 0 180 50">
              <path d="M 6 25 l 16 -14 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 18 -14" stroke="#ff8a7f" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SpeechBubbleDark>
          <div style={{ position: "absolute", right: -30, top: -30, zIndex: 3 }}>
            <CrossBadge size={110} p={1} />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "three") {
    // Three lasting deeds, each glowing: a mosque (ongoing charity), a book (knowledge), a child in dua.
    const badge = (node: React.ReactNode, label: string) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 250, height: 250, borderRadius: 999, background: "rgba(251,243,223,0.95)", border: `6px solid ${theme.gold}`, boxShadow: "0 0 60px rgba(212,168,82,0.7)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{node}</div>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 34, color: theme.gold, whiteSpace: "nowrap" }}>{label}</div>
      </div>
    );
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)" }}>
          <Rays size={900} spin={8} opacity={0.55} />
        </div>
        <div style={{ marginTop: 120 }}>{badge(<Masjid width={200} />, "SADAKA-İ CÂRİYE")}</div>
        <div style={{ marginTop: -120 }}>
          {badge(
            <svg width={190} height={142} viewBox="-50 -36 100 76">
              <path d="M 0 -24 Q -24 -34 -46 -26 L -46 30 Q -24 22 0 32 Q 24 22 46 30 L 46 -26 Q 24 -34 0 -24 Z" fill="#5f79c4" />
              <path d="M 0 -20 Q -22 -28 -40 -22 L -40 24 Q -22 18 0 26 Z" fill="#fbf3df" />
              <path d="M 0 -20 Q 22 -28 40 -22 L 40 24 Q 22 18 0 26 Z" fill="#f2e4c2" />
            </svg>,
            "FAYDALI İLİM",
          )}
        </div>
        <div style={{ marginTop: 120 }}>{badge(<CrowdFigure size={200} color="#2f8f6b" arm={1} />, "SALİH EVLAT")}</div>
      </div>
    );
  }
  if (kind === "near") {
    // A glowing gate just one step away; the sandal strap lit in gold in front.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: 640, top: 330, transform: "translate(-50%, -50%)" }}>
          <Rays size={820} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: 560, top: 80, width: 200, height: 270, borderRadius: "100px 100px 10px 10px", border: `10px solid ${theme.gold}`, background: "rgba(255,240,200,0.9)", boxShadow: "0 0 90px rgba(255,226,150,0.8)" }} />
        <div style={{ position: "absolute", left: 300, bottom: 0, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={{ ...POSES.stand, headTilt: 6 }} style={MAN_WHITE} size={560} heart={{ color: theme.gold, glow: 1, scale: 1.2 }} />
        </div>
        <div style={{ position: "absolute", left: 700, bottom: 10, transform: "translateX(-50%)", zIndex: 2 }}>
          <Sandal size={380} glow={1} />
        </div>
      </div>
    );
  }
  if (kind === "easy") {
    // A golden middle path to the horizon; a man walks it steadily, heart glowing.
    return (
      <div style={{ position: "relative", width: 1080, height: 820 }}>
        <div style={{ position: "absolute", left: "50%", top: 150, transform: "translate(-50%, -50%)" }}>
          <Rays size={700} spin={8} opacity={0.6} />
        </div>
        <svg width={1080} height={820} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M 330 820 L 500 150 L 580 150 L 750 820 Z" fill="rgba(212,168,82,0.55)" stroke={theme.gold} strokeWidth={5} />
          <path d="M 0 820 L 330 820 L 500 150 L 0 150 Z" fill="rgba(224,50,43,0.15)" />
          <path d="M 1080 820 L 750 820 L 580 150 L 1080 150 Z" fill="rgba(125,137,168,0.15)" />
        </svg>
        <div style={{ position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 1 }}>
          <Man pose={{ ...POSES.stand, stepL: 0.5 }} style={MAN_WHITE} size={600} heart={{ color: theme.gold, glow: 1.1, scale: 1.3 }} />
        </div>
      </div>
    );
  }
  if (kind === "speak") {
    // Man standing with speech gesture, golden rays and glowing speech bubble with a star.
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)" }}>
          <Rays size={780} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 400, width: 520, height: 520, transform: "translate(-50%, -50%)", borderRadius: 999, background: "radial-gradient(circle, rgba(255,226,150,0.55) 0%, rgba(212,168,82,0.18) 45%, transparent 70%)" }} />
        {/* Floating golden speech bubble above right */}
        <div style={{ position: "absolute", right: 180, top: 110, zIndex: 2, transform: "rotate(6deg)" }}>
          <SpeechBubbleGold width={260} glow={1.2} tail="bottom">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Star size={36} />
              <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 44, color: "#8a5a12", lineHeight: 1 }}>خَيْر</div>
              <Star size={36} />
            </div>
          </SpeechBubbleGold>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.speak} size={760} heart={{ color: theme.gold, glow: 1.1, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  return null;
};

export const ReelCover: React.FC<ReelCoverProps> = ({ title, arabicTitle, source, art, titleSize = 168 }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #2f4ba0 0%, #1b2d66 50%, #0e1940 100%)" }}>
    <StarPattern color={theme.line} gold={theme.gold} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(6,12,36,0.65) 100%)" }} />

    {/* Brand tag */}
    <div style={{ position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
      <BayanMark theme={theme} size={54} />
      <Latin theme={theme} size={30} />
    </div>

    {/* Title */}
    <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: titleSize, lineHeight: 1, whiteSpace: "nowrap", color: "#fff", letterSpacing: "-0.02em", textShadow: "0 14px 50px rgba(0,0,0,0.55)" }}>{title}</div>
      <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 76, lineHeight: 1.5, color: theme.gold, marginTop: 18, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
        {arabicTitle}
      </div>
    </div>

    {/* Illustration */}
    <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Art kind={art} />
    </div>

    {/* Ground glow and source */}
    <div style={{ position: "absolute", top: 1540, left: 240, right: 240, height: 40, borderRadius: 999, background: "radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)" }} />
    <div style={{ position: "absolute", top: 1600, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: serif, fontWeight: 500, fontSize: 34, color: theme.gold, border: `2px solid ${theme.gold}`, borderRadius: 999, padding: "8px 30px", background: "rgba(15,26,69,0.75)" }}>{source}</div>
    </div>
  </AbsoluteFill>
);
