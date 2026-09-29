export type Theme = {
  bg: string;
  line: string;
  lineSoft: string;
  gold: string;
  text: string;
};

// Same colours as the website (app/globals.css).
export const light: Theme = {
  bg: "#f6f7f9",
  line: "#27408b",
  lineSoft: "#8fa0cf",
  gold: "#a77b2b",
  text: "#27408b",
};

export const dark: Theme = {
  bg: "#1b2d66",
  line: "#f4efe3",
  lineSoft: "#7f91c4",
  gold: "#d4a852",
  text: "#f4efe3",
};

export const transparentLight: Theme = { ...light, bg: "transparent" };
export const transparentDark: Theme = { ...dark, bg: "transparent" };
