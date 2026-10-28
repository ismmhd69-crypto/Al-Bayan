import "server-only";

// Embeds JSON-LD structured data into the HTML.
// Escapes '<' as '\u003c' per Next.js official guidance to prevent XSS / script injection.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
