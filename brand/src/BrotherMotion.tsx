import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import { CoinG, CrossBadge, NameCard, Quran, Rays, Steam } from "./motion/Props";
import { GiftBox } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, fonts, reelMetadata, wordTime, UI, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 08 (Turkish): "KARDEŞİN İÇİN". Hadith: Sahih al-Bukhari 13 (HadeethEnc Turkish 66520).
// Explanation: Ibn Uthaymeen, binothaimeen.net (library source 43e8f539). Turkish scholar
// lines are Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type BrotherMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateBrotherMetadata = reelMetadata<BrotherMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number; red?: boolean }> = ({ children, gold = false, size = 40, red = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${red ? "#e0322b" : theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : red ? "#ff6b5e" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const Coins: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-40 -40 80 80">
    <g transform="translate(-14 14)"><CoinG r={18} /></g>
    <g transform="translate(14 14)"><CoinG r={18} /></g>
    <g transform="translate(0 -10)"><CoinG r={18} /></g>
  </svg>
);

/** "Good" card: icon + label (religious or worldly good). */
const GoodCard: React.FC<{ kind: "din" | "dunya" }> = ({ kind }) => (
  <div style={{ width: 210, height: 170, borderRadius: 26, background: "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 0 30px rgba(212,168,82,0.45)" }}>
    {kind === "din" ? <Quran width={120} glow={0.6} /> : <Coins size={90} />}
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 25, color: "#fff", whiteSpace: "nowrap" }}>{kind === "din" ? "DİNİ HAYIR" : "DÜNYEVİ HAYIR"}</div>
  </div>
);

// Scene 1: a man holds a glowing gift; his brother appears. Does he want the same for him?
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.2],
    [dur, 1.05],
  ]);
  const l1 = prog(t, W("kendin"), W("kendin") + 0.2);
  const l2 = prog(t, W("kardeşin"), W("kardeşin") + 0.2);
  const l3 = prog(t, W("istiyor"), W("istiyor") + 0.2);
  const bro = springy(t, W("kardeşin"), 2.4, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1130} s={s}>
        <At x={300} y={1040} style={{ opacity: 0.7 }}>
          <Rays size={520} spin={t * 14} opacity={0.5} />
        </At>
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.give, t)} style={MAN_WHITE} size={540} heart={{ color: theme.gold, glow: 0.8, scale: 1 }} rightItem={<g transform="translate(-34 -14)"><GiftBox size={70} /></g>} />
        </At>
        {bro > 0 ? (
          <At x={840} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-bro}, ${bro})`, transformOrigin: "50% 100%" }}>
            <Man pose={breathe(POSES.stand, t + 1)} style={MAN_GREY} size={510} />
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={70}>
          KENDİN İÇİN İSTEDİĞİNİ
        </Title>
        <Title p={l2} size={86} color={theme.gold}>
          KARDEŞİN İÇİN DE
        </Title>
        <Title p={l3} size={86} color={theme.gold}>
          İSTİYOR MUSUN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: KENDİN İÇİN = KARDEŞİN İÇİN.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const a = springy(t, W("kendisi"), 2.6, 7);
  const b = springy(t, W("kardeşi"), 2.6, 7);
  const eq = prog(t, W("kardeşi"), W("kardeşi") + 0.4);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {a > 0 ? (
        <At x={270} y={300} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
          <Pill size={38}>KENDİN İÇİN</Pill>
        </At>
      ) : null}
      {eq > 0 ? (
        <At x={540} y={300} style={{ opacity: eq }}>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 70, color: theme.gold }}>=</div>
        </At>
      ) : null}
      {b > 0 ? (
        <At x={810} y={300} style={{ transform: `translate(-50%, -50%) scale(${b})` }}>
          <Pill gold size={38}>
            KARDEŞİN İÇİN
          </Pill>
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Uthaymeen. The good he loves (religious and worldly) is copied to his brother; iman fills up.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tKul = W("kul");
  const tDin = W("dini");
  const tDunya = W("dünyevi");
  const tBro = W("kardeşi");
  const tIman = W("imanı");
  const tKemal = W("kemale");
  const c1 = springy(t, tDin, 2.6, 7);
  const c2 = springy(t, tDunya, 2.6, 7);
  const fly = prog(t, tBro, tBro + 0.8, easeInOut);
  const give = prog(t, tBro - 0.3, tBro + 0.3);
  const bar = springy(t, tIman - 0.1, 2.4, 7);
  const fill = lerp(0.45, 0.6, prog(t, tIman, tIman + 0.4)) + 0.4 * prog(t, tKemal, tKemal + 0.8, easeInOut);
  const full = prog(t, tKemal + 0.6, tKemal + 1.0);
  const glow = prog(t, tKemal, tKemal + 0.8);
  const cards = [
    { kind: "din" as const, x: 200, p: c1 },
    { kind: "dunya" as const, x: 420, p: c2 },
  ];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.08], [tKul, 1.0], [dur, 1.04]])}>
        {glow > 0 ? (
          <At x={540} y={1080} style={{ opacity: glow * 0.8 }}>
            <Rays size={760} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, POSES.give, give), t)} style={MAN_WHITE} size={500} heart={{ color: theme.gold, glow: 0.5 + glow, scale: 1 }} />
        </At>
        <At x={790} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(POSES.stand, t + 1)} style={MAN_GREY} size={490} heart={glow > 0 ? { color: theme.gold, glow, scale: 1 } : null} />
        </At>
        {cards.map((c, i) =>
          c.p > 0 ? (
            <React.Fragment key={i}>
              <At x={c.x} y={720} style={{ transform: `translate(-50%, -50%) scale(${c.p})` }}>
                <GoodCard kind={c.kind} />
              </At>
              {fly > 0 ? (
                <At x={lerp(c.x, c.x + 470, fly)} y={720 - Math.sin(fly * Math.PI) * 120} style={{ transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * fly})`, opacity: Math.min(1, fly * 3) }}>
                  <GoodCard kind={c.kind} />
                </At>
              ) : null}
            </React.Fragment>
          ) : null,
        )}
      </Camera>
      {bar > 0.01 ? (
        <At x={540} y={480} style={{ transform: `translate(-50%, -50%) scale(${bar})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 40, color: "#fff" }}>İMAN</div>
            <div style={{ width: 520, height: 46, borderRadius: 999, background: "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}`, overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, #a77b2b, ${theme.gold})`, boxShadow: `0 0 ${30 * full}px rgba(255,226,150,0.9)` }} />
            </div>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: theme.gold, opacity: full }}>KÂMİL</div>
          </div>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tKul - 0.4, tKul - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name="Şeyh İbn Useymin" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tKul} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: a blessing comes down on the brother; envy darkens the other's heart; the warning crosses it out.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tBu = W("bu");
  const tWarn = W("uyarı");
  const tHaset = W("haset");
  const tGift = W("başkasına");
  const tHate = W("hoş");
  const warn = springy(t, tWarn - 0.1, 2.6, 7) * (1 - prog(t, tHaset - 0.4, tHaset - 0.1));
  const [wx, wy] = shake(t, tWarn + 0.1, 10);
  const gift = prog(t, tGift - 0.2, tGift + 0.9, easeInOut);
  const dark = prog(t, tHate - 0.2, tHate + 0.5);
  const cross = prog(t, tHate + 0.7, tHate + 1.1);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.05], [tBu, 1.0], [dur, 1.05]])}>
        {gift > 0 ? (
          <>
            <At x={790} y={1000} style={{ opacity: gift }}>
              <Rays size={560} spin={t * 16} opacity={0.55} />
            </At>
            <At x={790} y={lerp(380, 800, gift)} style={{ opacity: Math.min(1, gift * 2) }}>
              <GiftBox size={130} />
            </At>
          </>
        ) : null}
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, { ...POSES.fists, lean: 0 }, dark), t)} style={MAN_WHITE} size={500} headTint={dark * 0.5} heart={{ color: dark > 0.3 ? "#3a3f55" : theme.gold, glow: 0.6, scale: 1 }} />
        </At>
        {dark > 0
          ? [0, 1, 2].map((i) => (
              <At key={i} x={280 + (i - 1) * 60} y={820 - ((t * 0.6 + i / 3) % 1) * 140}>
                <Steam size={90} p={(t * 0.6 + i / 3) % 1} color="#3a3f55" />
              </At>
            ))
          : null}
        <At x={790} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(mixPose(POSES.stand, POSES.takbir, gift * 0.5), t + 1)} style={MAN_GREY} size={490} heart={gift > 0.5 ? { color: theme.gold, glow: 1, scale: 1 } : null} />
        </At>
        {cross > 0 ? (
          <At x={300} y={760} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tHate + 0.7, 2.6, 7)})` }}>
            <CrossBadge size={150} p={cross} />
          </At>
        ) : null}
      </Camera>
      {warn > 0.01 ? (
        <At x={540 + wx} y={520 + wy} style={{ transform: `translate(-50%, -50%) scale(${warn})` }}>
          <Pill red size={52}>
            <svg width={56} height={50} viewBox="-30 -28 60 54">
              <path d="M 0 -26 L 28 24 L -28 24 Z" fill="#e0322b" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
              <rect x={-3.5} y={-10} width={7} height={20} rx={3} fill="#fff" />
              <circle cy={16} r={4} fill="#fff" />
            </svg>
            HASETTEN SAKIN
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tBu} to={tHaset - 0.1} y={1440} size={50} />
      <ArabicLine t={t} text={quote[1]} from={tHaset} to={dur} y={1440} size={48} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: BrotherMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "sparkle", 0.3);
  add("hook", h("kendin"), "hit", 0.35);
  add("hook", h("kardeşin"), "pop", 0.35);
  add("hook", h("musun"), "ding", 0.3);
  const d = W("hadith");
  add("hadith", d("kendisi"), "pop_high", 0.25);
  add("hadith", d("kardeşi"), "chime", 0.3);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("dini"), "pop", 0.3);
  add("explain1", e("dünyevi"), "pop", 0.3);
  add("explain1", e("kardeşi"), "whoosh", 0.35);
  add("explain1", e("imanı"), "rise", 0.3);
  add("explain1", e("kemale") + 0.6, "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", f("uyarı"), "hit", 0.4);
  add("explain2", f("başkasına"), "sparkle", 0.35);
  add("explain2", f("hoş"), "heartbeat", 0.45);
  add("explain2", f("hoş") + 0.7, "strike", 0.35);
};

export const BrotherMotion: React.FC<BrotherMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Enes b. Mâlik",
    stamp: "Sahih Buhârî 13",
    arabic: p.arabicLines,
    line1: ["sizden", 0],
    line2: ["buhari", 0],
    stampWord: "buhari",
    arabicSize: 84,
    englishSize: 52,
    contentTop: 330,
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
