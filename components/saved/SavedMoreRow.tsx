"use client";

import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { savedText } from "@/lib/saved/text";
import { useSaved } from "@/lib/saved/useSaved";

/** "Saved" row on the More page, with how many items are saved. */
export default function SavedMoreRow({ lang }: { lang: Locale }) {
  const { items } = useSaved();
  return <Link href={`/${lang}/saved`} className="list-row">
    <Bookmark aria-hidden="true" className="row-icon" />
    <span><span className="list-title">{savedText[lang].title}</span></span>
    {items.length > 0 && <span className="saved-count">{items.length}</span>}
    <ChevronRight aria-hidden="true" className="flip-rtl" />
  </Link>;
}
