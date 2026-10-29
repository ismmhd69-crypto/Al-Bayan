import "../globals.css";
import "./french-preview.css";

export default function LocalPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
