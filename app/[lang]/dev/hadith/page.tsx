import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import HadithTester from "@/components/HadithTester";

// Private test page for the hadith connector (Mo's local testing only). Hidden on the live site.
export const dynamic = "force-dynamic";

export default async function HadithTestPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (process.env.NODE_ENV === "production" || !isLocale(lang)) notFound();
  return <HadithTester lang={lang} />;
}
