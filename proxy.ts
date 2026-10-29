import { NextResponse, type NextRequest } from "next/server";
import { activeLocales, defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";

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
  // A language that is built but not served sends its links to the same English page.
  const paused = locales.find((l) => !(activeLocales as readonly string[]).includes(l) && (pathname === `/${l}` || pathname.startsWith(`/${l}/`)));
  if (paused) {
    request.nextUrl.pathname = `/en${pathname.slice(paused.length + 1)}`;
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
