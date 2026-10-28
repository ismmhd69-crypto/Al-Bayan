import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { activeLocales, isLocale } from "@/lib/i18n";

// Mo (2026-10-29): launch with Arabic and English only; German is kept in code but not served.
it("serves Arabic and English only", () => {
  expect([...activeLocales]).toEqual(["ar", "en"]);
  expect(isLocale("ar")).toBe(true); expect(isLocale("en")).toBe(true); expect(isLocale("de")).toBe(false);
});
it("sends old German links to the same English page", () => {
  const response = proxy(new NextRequest("https://askbayan.org/de/ask?x=1"));
  expect(response?.headers.get("location")).toBe("https://askbayan.org/en/ask?x=1");
  expect(proxy(new NextRequest("https://askbayan.org/de"))?.headers.get("location")).toBe("https://askbayan.org/en");
});
it("never picks German from a saved cookie or the browser language", () => {
  const request = new NextRequest("https://askbayan.org/ask", { headers: { "accept-language": "de-DE,de;q=0.9", cookie: "lang=de" } });
  expect(proxy(request)?.headers.get("location")).toBe("https://askbayan.org/en/ask");
});
