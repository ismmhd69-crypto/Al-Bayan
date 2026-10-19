import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy, squash } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { Check, NameCard, Rays, Star } from "./motion/Props";
import { Balance, GiftBox, MotherFigure } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 04 (Turkish): "ANNEN". Hadith: Sahih al-Bukhari 5971 (HadeethEnc Turkish 4182).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/18535; Ibn Uthaymeen, binothaimeen.net
// (Liqa al-Bab al-Maftuh 32). Turkish scholar lines are Claude's translation (needs review).

const { amiri, serif, sans } = fonts;

export type MotherMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: [string, string];
  ibnUthaymeenLink: string;
};
export const calculateMotherMetadata = reelMetadata<MotherMotionProps>();

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

// Scene 1: hook. A son with a gift wonders who deserves his kindness most.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.5],
    [1.0, 1.0],
    [dur, 1.05],
  ]);
  const enter = springy(t, 0.1, 2.4, 6);
  const [qx, qy] = squash(t, 0.5);
  const l1 = prog(t, W("iyiliğe"), W("iyiliğe") + 0.2);
  const l2 = prog(t, W("kim"), W("kim") + 0.2);
  const marks = ["en", "çok", "kim"].map((w) => springy(t, W(w), 2.6, 7));
  const mom = prog(t, W("layık") - 0.1, W("layık") + 0.5);
  const [sx, sy] = shake(t, W("kim") + 0.1, 12);
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1100} s={s}>
        {mom > 0 ? (
          <At x={880} y={1470} anchor="bottom" style={{ opacity: mom * 0.9 }}>
            <MotherFigure size={520} glow={mom} bob={Math.sin(t * 2.4) * 2} />
          </At>
        ) : null}
        <At x={330} y={1470} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${enter * qx}, ${enter * qy})`, transformOrigin: "50% 100%" }}>
          <Man
            pose={breathe(POSES.give, t)}
            style={MAN_WHITE}
            size={560}
            rightItem={
              <g transform="translate(-34 -14)">
                <GiftBox size={68} />
              </g>
            }
          />
        </At>
        {marks.map((m, i) =>
          m > 0 ? (
            <At key={i} x={420 + i * 150} y={930 - (i % 2) * 70} style={{ transform: `translate(-50%, -50%) scale(${m}) rotate(${(i - 1) * 12}deg)` }}>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 130, color: theme.gold, textShadow: "0 6px 24px rgba(0,0,0,0.5)" }}>?</div>
            </At>
          ) : null,
        )}
      </Camera>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Title p={l1} size={92}>
          İYİLİĞE EN ÇOK
        </Title>
        <Title p={l2} size={112} color={theme.gold}>
          KİM LAYIK?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: each "Annen!" stamps a numbered badge above the scroll, then "Baban!".
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const badges = [
    { at: W("annen", 0), text: "ANNEN", n: "1", x: 160 },
    { at: W("annen", 1), text: "ANNEN", n: "2", x: 400 },
    { at: W("annen", 2), text: "ANNEN", n: "3", x: 640 },
    { at: W("baban", 0), text: "BABAN", n: "4", x: 900 },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {badges.map((b, i) => {
        const p = prog(t, b.at - 0.02, b.at + 0.16, easeInOut);
        if (p <= 0) return null;
        const mom = i < 3;
        return (
          <At key={i} x={b.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${lerp(2.4, 1, p)}) rotate(${(1 - p) * -10 + (i % 2 ? 3 : -3)}deg)`, opacity: p }}>
            <div
              style={{
                position: "relative",
                padding: mom ? "14px 22px" : "10px 18px",
                borderRadius: 18,
                background: mom ? theme.gold : "rgba(154,166,196,0.95)",
                color: "#1b2d66",
                fontFamily: sans,
                fontWeight: 800,
                fontSize: mom ? 38 : 30,
                boxShadow: mom ? "0 0 40px rgba(212,168,82,0.7)" : "0 10px 30px rgba(0,0,0,0.4)",
              }}
            >
              {b.text}
              <div style={{ position: "absolute", top: -22, right: -18, width: 44, height: 44, borderRadius: 99, background: "#1b2d66", border: `3px solid ${mom ? theme.gold : "#9aa6c4"}`, color: "#fff", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{b.n}</div>
            </div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. The son serves his parents; their right is joined with tawhid.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tIyilik = W("iyilik");
  const tTevhid = W("tevhid");
  const tBirlikte = W("birlikte");
  const walkIn = prog(t, 0.6, 2.6, easeInOut);
  const sonX = lerp(-200, 300, walkIn);
  const walking = t > 0.6 && t < 2.6;
  const give = prog(t, tIyilik - 0.3, tIyilik + 0.2);
  const sonPose = walking ? walk(POSES.stand, t, 2.4, 1) : breathe(mixPose(POSES.stand, POSES.give, give), t);
  const parents = springy(t, 0.3, 2.2, 6);
  const glow = prog(t, tIyilik, tIyilik + 0.6);
  const pills = [
    { at: W("önemli"), text: "EN ÖNEMLİ VAZİFE", y: 600 },
    { at: W("büyük"), text: "EN BÜYÜK FARZ", y: 700 },
  ];
  const pillsOut = prog(t, tTevhid - 0.6, tTevhid - 0.2);
  const cards = prog(t, W("allah", 1) - 0.1, W("allah", 1) + 0.4);
  const link = prog(t, tBirlikte - 0.1, tBirlikte + 0.5);
  const s = keys(t, [
    [0, 1.08],
    [tIyilik, 1.0],
    [dur, 1.04],
  ]);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={s}>
        {glow > 0 ? (
          <At x={760} y={1080} style={{ opacity: glow * 0.8 }}>
            <Rays size={640} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
        <At x={640} y={1390} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${parents})`, transformOrigin: "50% 100%" }}>
          <MotherFigure size={470} glow={glow} bob={Math.sin(t * 2.2) * 2} />
        </At>
        <At x={910} y={1390} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-parents}, ${parents})`, transformOrigin: "50% 100%" }}>
          <Man pose={breathe(POSES.calm, t + 1)} style={MAN_GREY} size={500} />
        </At>
        <At x={sonX} y={1390} anchor="bottom">
          <Man
            pose={sonPose}
            style={MAN_WHITE}
            size={520}
            rightItem={
              give > 0.3 ? (
                <g transform="translate(-30 -12)">
                  <GiftBox size={60} />
                </g>
              ) : undefined
            }
          />
        </At>
      </Camera>
      {pills.map((p, i) => {
        const a = springy(t, p.at, 2.6, 7) * (1 - pillsOut);
        if (a <= 0.01) return null;
        return (
          <At key={i} x={540} y={p.y} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
            <div style={{ padding: "12px 30px", borderRadius: 999, background: "rgba(15,26,69,0.85)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: 40, color: theme.gold, whiteSpace: "nowrap" }}>{p.text}</div>
          </At>
        );
      })}
      {cards > 0 ? (
        <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 120, opacity: cards, transform: `translateY(${(1 - cards) * 40}px)` }}>
          {[
            { label: "TEVHİD", icon: <Star size={70} /> },
            { label: "ANNE BABA\nHAKKI", icon: <svg width={70} height={70} viewBox="-30 -30 60 60"><path d="M 0 14 C -26 -4 -24 -24 -10 -24 C -4 -24 0 -18 0 -14 C 0 -18 4 -24 10 -24 C 24 -24 26 -4 0 14 Z" fill={theme.gold} transform="scale(1.4)" /></svg> },
          ].map((c, i) => (
            <div key={i} style={{ width: 300, height: 220, borderRadius: 28, background: "rgba(15,26,69,0.85)", border: `3px solid ${theme.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, boxShadow: `0 0 ${30 * link}px rgba(212,168,82,0.7)` }}>
              {c.icon}
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 32, color: "#fff", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.1 }}>{c.label}</div>
            </div>
          ))}
          {/* Gold link between the two cards */}
          <svg width={140} height={40} viewBox="0 0 140 40" style={{ position: "absolute", left: "50%", top: 90, transform: "translateX(-50%)" }}>
            <line x1={4} y1={20} x2={136} y2={20} stroke={theme.gold} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - link} />
            {link > 0.95 ? <circle cx={70} cy={20} r={14} fill={theme.gold} /> : null}
          </svg>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, W("önemli") - 0.4, W("önemli") - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={W("anne")} to={W("allah", 1) - 0.1} y={1440} size={46} />
      <ArabicLine t={t} text={quote[1]} from={W("allah", 1)} to={dur} y={1440} size={46} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: Ibn Uthaymeen. Serve both parents; if equal, the mother comes first.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tAsk = W("baba");
  const tClash = W("çatışırsa");
  const tDad = W("babanın");
  const tMom = W("annenin", 1);
  const tEqual = W("eşitse");
  const tFirst = W("anneyi");
  const bub = [springy(t, tAsk, 2.6, 7), springy(t, W("annenin", 0), 2.6, 7)];
  const bubOut = prog(t, tEqual - 0.3, tEqual);
  const bolt = prog(t, tClash, tClash + 0.25) * (1 - prog(t, W("ikisini") + 0.4, W("ikisini") + 0.8));
  const sonX = keys(t, [
    [0, 540],
    [tDad - 0.3, 540],
    [tDad + 0.6, 370],
    [tMom - 0.3, 370],
    [tMom + 0.7, 710],
    [tEqual - 0.2, 710],
    [tEqual + 0.4, 540],
  ]);
  const moving = (t > tDad - 0.3 && t < tDad + 0.6) || (t > tMom - 0.3 && t < tMom + 0.7) || (t > tEqual - 0.2 && t < tEqual + 0.4);
  const facingLeft = t < tMom - 0.3;
  const sonPose = moving ? walk(POSES.stand, t, 2.6, 1) : breathe(POSES.stand, t);
  const scale = springy(t, tEqual - 0.1, 2.4, 7);
  const tilt = lerp(0, 14, prog(t, tFirst, tFirst + 0.7, easeInOut));
  const momGlow = prog(t, tFirst, tFirst + 0.6);
  const doneDad = prog(t, tDad + 0.6, tDad + 0.9);
  const doneMom = prog(t, tMom + 0.7, tMom + 1.0);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.06], [tAsk, 1.0], [dur, 1.03]])}>
        {momGlow > 0 ? (
          <At x={880} y={1080} style={{ opacity: momGlow }}>
            <Rays size={560} spin={t * 18} opacity={0.5} />
          </At>
        ) : null}
        <At x={190} y={1390} anchor="bottom">
          <Man pose={breathe(POSES.stand, t + 1)} style={MAN_GREY} size={480} />
        </At>
        <At x={890} y={1390} anchor="bottom">
          <MotherFigure size={450} glow={momGlow} armUp={momGlow * 0.6} bob={Math.sin(t * 2.2) * 2} />
        </At>
        <At x={sonX} y={1390} anchor="bottom" style={{ transform: `translate(-50%, -100%) scaleX(${facingLeft ? -1 : 1})` }}>
          <Man pose={sonPose} style={MAN_WHITE} size={500} />
        </At>
        {/* Requests from each parent */}
        {[
          { x: 250, y: 760, p: bub[0], done: doneDad, icon: "book" },
          { x: 840, y: 760, p: bub[1], done: doneMom, icon: "cup" },
        ].map((b, i) =>
          b.p > 0 ? (
            <At key={i} x={b.x} y={b.y} style={{ transform: `translate(-50%, -50%) scale(${b.p * (1 - bubOut)})` }}>
              <div style={{ position: "relative", width: 150, height: 130, borderRadius: 30, background: "#fff", border: "5px solid #151c33", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.icon === "book" ? (
                  <svg width={80} height={60} viewBox="-40 -30 80 60"><path d="M 0 -20 Q -20 -28 -38 -22 L -38 24 Q -20 18 0 26 Q 20 18 38 24 L 38 -22 Q 20 -28 0 -20 Z" fill="#5f79c4" /><line x1={0} y1={-20} x2={0} y2={26} stroke="#fff" strokeWidth={3} /></svg>
                ) : (
                  <svg width={70} height={64} viewBox="-35 -32 70 64"><rect x={-24} y={-14} width={40} height={40} rx={8} fill="#c9733a" /><path d="M 16 -4 Q 32 -4 32 8 Q 32 20 16 18" stroke="#c9733a" strokeWidth={6} fill="none" /><path d="M -14 -22 Q -10 -30 -14 -36 M 0 -22 Q 4 -30 0 -36" stroke="#9aa6c4" strokeWidth={3} fill="none" /></svg>
                )}
                {b.done > 0 ? (
                  <div style={{ position: "absolute", top: -26, right: -22 }}>
                    <Check size={58} p={b.done} />
                  </div>
                ) : null}
              </div>
            </At>
          ) : null,
        )}
        {bolt > 0 ? (
          <At x={545} y={740} style={{ opacity: bolt, transform: `translate(-50%, -50%) scale(${0.8 + bolt * 0.3})` }}>
            <svg width={120} height={120} viewBox="-30 -40 60 80"><path d="M 6 -38 L -16 4 L 0 4 L -8 38 L 18 -8 L 2 -8 Z" fill="#e0322b" stroke="#fff" strokeWidth={3} /></svg>
          </At>
        ) : null}
        {scale > 0 ? (
          <At x={540} y={700} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
            <Balance
              width={420}
              tilt={tilt}
              left={<svg width={60} height={70} viewBox="-30 -70 60 70"><circle cy={-52} r={14} fill="#a87952" /><path d="M -20 0 L -16 -36 Q 0 -42 16 -36 L 20 0 Z" fill="#9aa6c4" /></svg>}
              right={<svg width={60} height={70} viewBox="-30 -70 60 70"><path d="M -24 0 L -18 -38 Q 0 -44 18 -38 L 24 0 Z" fill="#6a5a8e" /><path d="M -18 -40 Q -20 -66 0 -68 Q 20 -66 18 -40 Q 0 -34 -18 -40 Z" fill="#f2ece2" /><ellipse cy={-54} rx={9} ry={11} fill="#c99a72" /></svg>}
            />
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tAsk - 0.3, tAsk) }}>
        <NameCard kicker={UI.tr.explanation} name="Şeyh İbn Useymin" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tAsk} to={W("ikisi") - 0.1} y={1440} size={42} />
      <ArabicLine t={t} text={quote[1]} from={W("ikisi")} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: MotherMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.3, "pop", 0.3);
  add("hook", h("iyiliğe"), "hit", 0.4);
  for (const w of ["en", "çok"]) add("hook", h(w), "pop_high", 0.3);
  add("hook", h("kim"), "hit", 0.45);
  add("hook", h("layık"), "ding", 0.3);
  const d = W("hadith");
  for (let i = 0; i < 3; i++) add("hadith", d("annen", i) + 0.1, "stamp", 0.5);
  add("hadith", d("baban") + 0.1, "pop", 0.4);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let tt = 0.7; tt < 2.6; tt += 0.42) add("explain1", tt, "step", 0.25);
  add("explain1", e("iyilik"), "sparkle", 0.35);
  add("explain1", e("önemli"), "pop", 0.35);
  add("explain1", e("büyük"), "pop", 0.35);
  add("explain1", e("allah", 1), "whoosh", 0.3);
  add("explain1", e("birlikte"), "chime", 0.35);
  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", f("baba"), "bubble", 0.3);
  add("explain2", f("annenin", 0), "bubble", 0.3);
  add("explain2", f("çatışırsa"), "hit", 0.4);
  add("explain2", f("babanın") + 0.6, "ding", 0.3);
  add("explain2", f("annenin", 1) + 0.7, "ding", 0.3);
  add("explain2", f("eşitse"), "pop", 0.35);
  add("explain2", f("anneyi"), "sparkle", 0.4);
};

export const MotherMotion: React.FC<MotherMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 5971",
    arabic: p.arabicLines,
    line1: ["bir", 0],
    line2: ["rasûlullah", 1],
    stampWord: "buhari",
    arabicSize: 60,
    englishSize: 32,
    contentTop: 235,
    stampBottom: 20,
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: Hook,
        hadithOverlay: HadithOverlay,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} />,
      }}
      cues={ownCues(p)}
    />
  );
};
