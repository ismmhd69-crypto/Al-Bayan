import { describe, expect, it } from "vitest";
import { matchingTopicHints, TOPIC_SOURCE_HINTS } from "@/data/topic-source-hints";
import { isRealVerse } from "@/lib/sources/quran-meta";

describe("checked topic search hints", () => {
  it("has thirty-two distinct topics and real Quran keys", () => {
    expect(TOPIC_SOURCE_HINTS).toHaveLength(32);
    expect(new Set(TOPIC_SOURCE_HINTS.map((topic) => topic.id)).size).toBe(32);
    for (const topic of TOPIC_SOURCE_HINTS) {
      expect(topic.quran.length + topic.hadith.length + topic.fatwas.length).toBeGreaterThan(0);
      for (const key of topic.quran) {
        const [chapter, verse] = key.split(":").map(Number);
        expect(isRealVerse(chapter, verse)).toBe(true);
      }
      for (const id of topic.hadith) expect(id).toMatch(/^HE\d+$/);
      for (const url of topic.fatwas) expect(url).toMatch(/^https:\/\/binbaz\.org\.sa\/fatwas\/\d+\//);
    }
  });
  it("finds the specific gold, repentance and conversion hints", () => {
    expect(matchingTopicHints("ما شروط وجوب الزكاة في الذهب وكم مقدارها؟").map((item) => item.id)).toContain("gold-zakat-rate");
    expect(matchingTopicHints("How do I repent from a sin?").map((item) => item.id)).toContain("repentance-steps");
    expect(matchingTopicHints("Was muss ich tun, um Muslim zu werden?").map((item) => item.id)).toContain("conversion");
  });
  it("finds the checked repentance-conditions source in English, German and Arabic", () => {
    const questions = [
      "What are the conditions of sincere repentance?",
      "Was sind die Bedingungen und Voraussetzungen aufrichtiger Reue?",
      "ما شروط التوبة النصوح؟",
    ];
    for (const question of questions) {
      expect(matchingTopicHints(question).map((item) => item.id)).toContain("repentance-steps");
    }
    expect(matchingTopicHints("What are the conditions of sincere repentance, and what should someone do if the sin harmed another person?")
      .map((item) => item.id)).toEqual(expect.arrayContaining(["repentance-steps", "repentance-rights", "sincere-repentance"]));
  });
  it("finds the checked backbiting source before the general repentance source", () => {
    const ids = matchingTopicHints("What are the conditions for backbiting repentance, and must the person tell the one they spoke about?")
      .map((item) => item.id);
    expect(ids).toEqual(["backbiting-repentance", "repentance-steps"]);
  });
  it("includes the added fasting, marriage and prayer timing verses", () => {
    expect(TOPIC_SOURCE_HINTS.find((item) => item.id === "fasting-obligation")?.quran).toContain("2:185");
    expect(TOPIC_SOURCE_HINTS.find((item) => item.id === "marriage-justice")?.quran).toContain("4:129");
    expect(TOPIC_SOURCE_HINTS.find((item) => item.id === "prayer-timing")?.quran).toEqual(expect.arrayContaining(["11:114", "17:78"]));
  });
  it("does not attach a gold-zakat hint to a different zakat topic", () => {
    expect(matchingTopicHints("Who may receive zakat?").map((item) => item.id)).not.toContain("gold-zakat-rate");
  });
  it("does not confuse compulsory fasting or forced conversion with other topics", () => {
    expect(matchingTopicHints("Is fasting in Ramadan compulsory in Islam?").map((item) => item.id)).not.toContain("no-compulsion");
    const forced = matchingTopicHints("Can someone be forced to become Muslim?").map((item) => item.id);
    expect(forced).toContain("no-compulsion");
    expect(forced).not.toContain("conversion");
    expect(matchingTopicHints("How can someone be forced to become Muslim?").map((item) => item.id)).not.toContain("conversion");
  });
});
