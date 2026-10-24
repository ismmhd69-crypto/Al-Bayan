import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { searchHadithMulti } from "@/lib/sources/hadith";

afterEach(() => { vi.unstubAllGlobals(); delete (globalThis as { __bayanHadithCatalogues?: unknown }).__bayanHadithCatalogues; });

it("searches German-only phrases in the actual provider path and keeps Arabic authenticity checks", async () => {
  const paths: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input)); paths.push(url.pathname + url.search);
    if (url.pathname.endsWith("/categories/roots/")) return Response.json([{ id: "1" }]);
    if (url.pathname.endsWith("/hadeeths/list/")) return Response.json({ data: [{ id: "5438", title: "Rechte anderer Menschen" }, { id: "9876", title: "Rechte anderer Menschen" }], meta: { last_page: 1 } });
    if (url.pathname.endsWith("/hadeeths/one/")) {
      const id = url.searchParams.get("id"), language = url.searchParams.get("language");
      if (language !== "ar") return Response.json({ id, hadeeth: language === "de" ? "Erfundener deutscher Testtext" : "Invented English test text" });
      return Response.json({ id, hadeeth: "نص عربي تجريبي وليس نقلا", grade: id === "5438" ? "صحيح" : "ضعيف", attribution: "رواه البخاري", reference: "صحيح البخاري (6/ 192) (2449)." });
    }
    throw Error("unexpected mocked provider path");
  }));
  const found = await searchHadithMulti({ de: ["Rechte Menschen"] });
  expect(found.map(h => h.id)).toEqual(["HE5438"]);
  expect(found[0].arabic).toBe("نص عربي تجريبي وليس نقلا");
  expect(paths.some(p => p.includes("/hadeeths/list/") && p.includes("language=de"))).toBe(true);
  expect(paths.some(p => p.includes("/categories/roots/") && p.includes("language=en"))).toBe(false);
  expect(found[0].translations.de).toBe("Erfundener deutscher Testtext");
});
