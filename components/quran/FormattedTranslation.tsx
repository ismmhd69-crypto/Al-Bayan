import React from "react";

interface FormattedTranslationProps {
  text: string;
  className?: string;
}

/**
 * Safely renders translation text while preserving inline formatting like <sup>, <sub>, <i>, <em>, <b>, <strong>.
 * Does not silently drop verses or passages with formatting.
 * Never executes raw script tags or unverified markup.
 */
export function FormattedTranslation({ text, className }: FormattedTranslationProps) {
  // If no HTML tags are present, render standard string directly
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    return <span className={className}>{text}</span>;
  }

  // Parse allowed inline elements safely using regex tokenization
  const tokens: React.ReactNode[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*?)?>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let currentTag: string | null = null;
  let buffer = "";

  // Helper to push text
  const pushText = (t: string) => {
    if (!t) return;
    if (currentTag === "sup") {
      tokens.push(<sup key={tokens.length} className="quran-footnote">{t}</sup>);
    } else if (currentTag === "sub") {
      tokens.push(<sub key={tokens.length}>{t}</sub>);
    } else if (currentTag === "em" || currentTag === "i") {
      tokens.push(<em key={tokens.length}>{t}</em>);
    } else if (currentTag === "b" || currentTag === "strong") {
      tokens.push(<strong key={tokens.length}>{t}</strong>);
    } else {
      tokens.push(t);
    }
  };

  while ((match = tagRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    pushText(textBefore);

    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = fullTag.startsWith("</");

    if (isClosing) {
      if (currentTag === tagName) {
        currentTag = null;
      }
    } else {
      if (["sup", "sub", "em", "i", "b", "strong"].includes(tagName)) {
        currentTag = tagName;
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    pushText(text.slice(lastIndex));
  }

  return <span className={className}>{tokens}</span>;
}

