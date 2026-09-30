import { describe, expect, it } from "vitest";
import { asksKnownUnresolvedView, PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";

describe("known unresolved scholar differences", () => {
  it("blocks ruling questions until a reviewed view decision exists", () => {
    expect(asksKnownUnresolvedView("Is music haram?", "ruling")).toBe(true);
    expect(asksKnownUnresolvedView("ما حكم التوسل بالنبي؟", "ruling")).toBe(true);
    expect(asksKnownUnresolvedView("What does the word music mean?", "definition")).toBe(false);
    expect(PREPARED_IDS_AWAITING_VIEW_DECISION.has("is-music-haram")).toBe(true);
  });
});
