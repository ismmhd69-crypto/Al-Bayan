import React from "react";
import { decodeHadithEntities } from "@/lib/hadith/display";

interface HadithDisplayTextProps {
  text: string;
  className?: string;
}

/** Renders the small set of Sunnah inline emphasis tags as safe React elements. */
export function HadithDisplayText({ text, className }: HadithDisplayTextProps) {
  type Frame = { tag: "i" | "em" | "b" | "strong"; opening: string; children: React.ReactNode[] };
  const root: React.ReactNode[] = [];
  const stack: Frame[] = [];
  const destination = () => stack.at(-1)?.children ?? root;
  const tags = /<\/?([a-z][a-z0-9:-]*)(?:\s+[^<>]*)?\s*\/?>/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const appendText = (value: string) => {
    if (value) destination().push(decodeHadithEntities(value));
  };

  const closeFrame = (frame: Frame) => {
    const content = React.createElement(
      frame.tag === "i" || frame.tag === "em" ? "em" : "strong",
      { key: key++ },
      ...frame.children,
    );
    destination().push(content);
  };

  while ((match = tags.exec(text)) !== null) {
    appendText(text.slice(cursor, match.index));
    const token = match[0];
    const name = match[1].toLowerCase();
    const closing = token.startsWith("</");
    const supported = ["i", "em", "b", "strong"].includes(name);

    if (supported && !closing && !token.endsWith("/>")) {
      stack.push({ tag: name as Frame["tag"], opening: token, children: [] });
    } else if (supported && closing && stack.at(-1)?.tag === name) {
      closeFrame(stack.pop()!);
    } else {
      // Unknown or malformed tags remain visible as escaped text for review.
      appendText(token);
    }
    cursor = tags.lastIndex;
  }

  appendText(text.slice(cursor));

  // Keep any unclosed supported tags visible rather than silently discarding them.
  while (stack.length) {
    const frame = stack.pop()!;
    destination().push(decodeHadithEntities(frame.opening), ...frame.children);
  }

  return <span className={className}>{root}</span>;
}
