import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { unattributedRuling } from "@/lib/ask/checks";
import { parseRichClaims } from "@/lib/ask/rich-engine";
import { pack } from "./fixtures/rich";

// Bayan never rules in its own voice: a summary ruling or instruction names its source.
// Wording reproduced from live answers on 2026-10-29 (round 4); controls invented.
it("flags summary rulings and instructions that do not say whose they are", () => {
  for (const text of [
    "وإذا تعلّق الذنب بحق شخص آخر، وجب ردّ حقه أو استسماحه؛ فإن سامح، تمّت التوبة من هذه الجهة.",
    "Give up that conduct after breaking a promise.",
    "A Muslim must make up the missed fast.",
    "لا يجوز للمسافر أن يقصر قبل خروجه من بلده.",
  ]) expect(unattributedRuling(text), text).toBe(true);
});
it("accepts rulings attributed to the Quran, the Prophet, a hadith or a named scholar, and plain descriptions", () => {
  for (const text of [
    "صيام رمضان واجب على المؤمنين؛ فقد فرض الله الصيام عليهم.",
    "ويبيّن ابن عثيمين أن الراتب لا زكاة فيه حتى يمضي الحول.",
    "Ibn Baz says the wronged person's right must be returned or pardon sought.",
    "The Prophet taught that breaking a promise is a trait of hypocrisy.",
    "The Quran teaches believers to seek help through patience and prayer.",
    "تذكر آية الكرسي انفراد الله بالألوهية.",
  ]) expect(unattributedRuling(text), text).toBe(false);
});
it("returns an unattributed summary ruling for a wording fix", () => {
  const reasons: string[] = [];
  const claims = [{ text: "A Muslim must make up the missed fast.", source_ids: [pack.passages[0].id], requirement_id: "R1" }];
  expect(parseRichClaims(claims, "summary", pack, "en", r => reasons.push(r))).toBeNull();
  expect(reasons).toContain("unattributed_ruling");
});
