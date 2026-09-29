import React from "react";
import { loadFont as loadKufi } from "@remotion/google-fonts/ReemKufi";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import type { Theme } from "./theme";

const { fontFamily: kufi } = loadKufi("normal", { weights: ["600"], subsets: ["arabic"] });
const { fontFamily: newsreader } = loadNewsreader("normal", { weights: ["500"], subsets: ["latin"] });

export const Arabic: React.FC<{ theme: Theme; size: number; style?: React.CSSProperties }> = ({ theme, size, style }) => (
  <div lang="ar" dir="rtl" style={{ fontFamily: kufi, fontWeight: 600, fontSize: size, lineHeight: 1, color: theme.text, ...style }}>
    بيان
  </div>
);

export const Latin: React.FC<{ theme: Theme; size: number; style?: React.CSSProperties }> = ({ theme, size, style }) => (
  <div
    style={{
      fontFamily: newsreader,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: "0.42em",
      // Balance the trailing letter-spacing so the word stays optically centred.
      marginRight: "-0.42em",
      color: theme.gold,
      ...style,
    }}
  >
    BAYAN
  </div>
);
