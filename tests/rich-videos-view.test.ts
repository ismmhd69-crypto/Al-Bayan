import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { RichAnswerView } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { APPROVED_CHANNELS } from "@/lib/sources/youtube-channels";
import type { RelatedVideos } from "@/lib/ask/related-videos";
const videos: RelatedVideos = { version: 1, basis: "title_only", items: [{ youtubeId: "abcdefghijk", channelId: APPROVED_CHANNELS[0].channelId, title: "Invented clip", minutes: 3, language: "en" }] };
describe("rich clip disclosure and privacy", () => {
  it.each(["en", "ar", "de"] as const)("labels metadata-only suggestions in %s and loads no third-party player or thumbnail", language => {
    const html = renderToStaticMarkup(React.createElement(RichAnswerView, { sections: [], language, text: getDictionary(language).ask, videos, complete: true }));
    expect(html).toContain("Invented clip"); expect(html).toContain("youtube.com/watch?v=abcdefghijk");
    expect(html).not.toContain("<iframe"); expect(html).not.toContain("<img");
    expect(html).toContain(language === "ar" ? 'dir="rtl"' : 'dir="ltr"');
  });
  it("does not show learning clips on incomplete or withdrawn work", () => {
    const props = { sections: [], language: "en" as const, text: getDictionary("en").ask, videos };
    expect(renderToStaticMarkup(React.createElement(RichAnswerView, { ...props, incomplete: true }))).not.toContain("Invented clip");
    expect(renderToStaticMarkup(React.createElement(RichAnswerView, { ...props, complete: true, withdrawn: true }))).not.toContain("Invented clip");
  });
});
