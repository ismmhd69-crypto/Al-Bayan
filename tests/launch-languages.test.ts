import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { activeLocales, isLocale } from "@/lib/i18n";

// Mo (2026-10-29): German is translated and served again, next to Arabic and English.
it("serves Arabic, English and German", () => {
  expect([...activeLocales]).toEqual(["ar", "en", "de"]);
  for (const l of ["ar", "en", "de"]) expect(isLocale(l)).toBe(true);
  expect(isLocale("fr")).toBe(false);
});
it("serves German links directly", () => {
  expect(proxy(new NextRequest("https://askbayan.org/de/ask?x=1"))).toBeUndefined();
  expect(proxy(new NextRequest("https://askbayan.org/de"))).toBeUndefined();
});
it("picks German from a saved cookie or the browser language", () => {
  const request = new NextRequest("https://askbayan.org/ask", { headers: { "accept-language": "de-DE,de;q=0.9" } });
  expect(proxy(request)?.headers.get("location")).toBe("https://askbayan.org/de/ask");
  const saved = new NextRequest("https://askbayan.org/ask", { headers: { cookie: "lang=de" } });
  expect(proxy(saved)?.headers.get("location")).toBe("https://askbayan.org/de/ask");
});
