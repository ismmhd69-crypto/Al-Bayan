import { describe, expect, it } from "vitest";
import { asksKnownUnresolvedView, PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";

describe("known unresolved scholar differences", () => {
  it("blocks ruling questions until a reviewed view decision exists", () => {
    expect(asksKnownUnresolvedView("ما حكم التوسل بالنبي؟", "ruling")).toBe(true);
    expect(asksKnownUnresolvedView("What is tawassul?", "definition")).toBe(false);
    expect(PREPARED_IDS_AWAITING_VIEW_DECISION.has("is-music-haram")).toBe(true);
  });
  it("no longer blocks music: Ask answers it from the approved scholars (Mo, 2026-10-30)", () => {
    expect(asksKnownUnresolvedView("Is music haram?", "ruling")).toBe(false);
    expect(asksKnownUnresolvedView("ما حكم سماع الموسيقى والأغاني؟", "ruling")).toBe(false);
  });
});
