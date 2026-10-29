import { NextResponse, type NextRequest } from "next/server";
import { activeLocales, defaultLocale, isLocale, type Locale } from "@/lib/i18n";

// Sends visitors without a language in the address to their language:
// the one they picked before (cookie), else their browser's, else English.
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get("lang")?.value;
  if (saved && isLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of wanted) if (isLocale(lang)) return lang;
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const previewPath = pathname.replace(/\/$/u, "");
  const hostname = request.nextUrl.hostname.toLowerCase().replace(/^\[|\]$/gu, "");
  const localFrenchPreviewHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  if (previewPath === "/dev/french-preview") {
    if (process.env.NODE_ENV !== "development" || !localFrenchPreviewHost) return new NextResponse(null, { status: 404 });
    return NextResponse.next();
  }
  // German is not offered at launch: old /de links go to the same English page.
  if (pathname === "/de" || pathname.startsWith("/de/")) {
    request.nextUrl.pathname = `/en${pathname.slice(3)}`;
    return NextResponse.redirect(request.nextUrl);
  }
  const hasLocale = activeLocales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  request.nextUrl.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
