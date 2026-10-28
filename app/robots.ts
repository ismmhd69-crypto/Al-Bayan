import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// robots.txt manages crawler traffic. In accordance with Google's indexing guidelines,
// pages bearing a 'noindex' directive (e.g. /review, /account, /report, /dev) are NOT blocked here
// so that search engine crawlers can fetch the HTML, read the noindex directive, and drop the URL.
// Backend API endpoints are disallowed.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
