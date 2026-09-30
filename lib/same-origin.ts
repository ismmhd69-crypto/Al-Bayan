// "Only our own pages may call this endpoint." One check for every API route.
//
// A browser always sends the page's address in `Origin` on a POST, and `Sec-Fetch-Site` says whether the
// page is on the same site. Behind Netlify's proxy the address the server sees in `request.url` is not
// the public address, so comparing only with `request.url` refused every real visitor online. Now the
// page's host must match one of the hosts the request arrived for, or the browser itself must say
// "same-origin". Requests from other sites are still refused; tools like curl can set any header, exactly
// as before, so this stops cross-site browser requests, not scripts.

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).host;
  } catch {
    return null;
  }
}

export function sameOrigin(request: Request): boolean {
  const origin = hostOf(request.headers.get("origin"));
  if (!origin || !request.headers.get("origin")?.includes("://")) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return true;
  if (site === "cross-site" || site === "same-site") return false;
  const arrivedFor = [
    hostOf(request.url),
    hostOf(request.headers.get("host")),
    hostOf(request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()),
  ];
  return arrivedFor.includes(origin);
}
