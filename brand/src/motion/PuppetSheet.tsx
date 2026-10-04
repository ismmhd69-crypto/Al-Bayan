import React from "react";
import { AbsoluteFill } from "remotion";
import { MAN_GREY, MAN_STRONG, MAN_WHITE, Man, POSES, walk } from "./Man";

// Dev sheet: every pose side by side, to check the rig.
export const PuppetSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1b2d66", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-around", padding: 40 }}>
    {Object.entries(POSES).map(([name, p]) => (
      <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", fontSize: 28 }}>
        <Man pose={p} size={420} heart={name === "takbir" ? { color: "#d4a852", glow: 1 } : null} />
        {name}
      </div>
    ))}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", fontSize: 28 }}>
      <Man pose={walk(POSES.stand, 0.2)} style={MAN_GREY} size={420} />
      walk
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", fontSize: 28 }}>
      <Man pose={POSES.give} style={MAN_WHITE} size={420} heart={{ color: "#8d93a3", glow: 0.4 }} />
      give grey heart
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", fontSize: 28 }}>
      <Man pose={POSES.flex} style={MAN_STRONG} bulk={1.35} size={420} />
      strong flex
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", fontSize: 28 }}>
      <Man pose={POSES.fists} headTint={1} size={420} />
      angry fists
    </div>
  </AbsoluteFill>
);
