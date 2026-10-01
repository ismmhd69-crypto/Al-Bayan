import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getScholarTranslations } from "@/lib/sources/scholar-translations";
import { shouldShowScholarTranslation } from "@/lib/ask/display-choice";

const previous = process.env.SHOW_AI_TRANSLATIONS;

afterEach(() => {
  if (previous === undefined) delete process.env.SHOW_AI_TRANSLATIONS;
  else process.env.SHOW_AI_TRANSLATIONS = previous;
});

const row = (source_id: string, published: boolean) => ({
  source_id, lang: "en" as const, text: `English ${source_id}`, origin: "ai" as const, published,
});

describe("scholar translation display lookup", () => {
  it("shows published AI rows while the switch is off", async () => {
    delete process.env.SHOW_AI_TRANSLATIONS;
    const result = await getScholarTranslations(["one", "two"], "en", async (ids) => ids.map((id) => row(id, id === "one")));
    expect(result).toEqual(new Map([["one", "English one"]]));
  });

  it("shows unpublished AI rows only when the switch is exactly true", async () => {
    process.env.SHOW_AI_TRANSLATIONS = "true";
    const result = await getScholarTranslations(["one"], "en", async () => [row("one", false)]);
    expect(result.get("one")).toBe("English one");
    process.env.SHOW_AI_TRANSLATIONS = "TRUE";
    expect((await getScholarTranslations(["one"], "en", async () => [row("one", false)])).size).toBe(0);
  });

  it("does not look up Arabic and falls back silently on lookup failure", async () => {
    const lookup = vi.fn(async () => { throw new Error("database unavailable"); });
    expect(await getScholarTranslations(["one"], "ar", lookup)).toEqual(new Map());
    expect(await getScholarTranslations(["one"], "de", lookup)).toEqual(new Map());
    expect(lookup).toHaveBeenCalledTimes(1);
  });
});

describe("scholar translation display choice", () => {
  it("shows only a real translation for English and German", () => {
    expect(shouldShowScholarTranslation("en", "text")).toBe(true);
    expect(shouldShowScholarTranslation("de", "text")).toBe(true);
    expect(shouldShowScholarTranslation("en", "")).toBe(false);
    expect(shouldShowScholarTranslation("ar", "text")).toBe(false);
    expect(shouldShowScholarTranslation("de")).toBe(false);
  });
});
