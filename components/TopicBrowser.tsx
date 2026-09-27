"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

type Item = { id: string; category: string; title: string; question: string };

// Category filter chips plus the topic list. Filtering happens on the device.
export default function TopicBrowser({
  lang,
  allLabel,
  categories,
  items,
}: {
  lang: string;
  allLabel: string;
  categories: { id: string; name: string }[];
  items: Item[];
}) {
  const [active, setActive] = useState<string>("all");
  const groups = categories
    .filter((c) => active === "all" || c.id === active)
    .map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) }));

  return (
    <>
      <div className="filter" role="group" aria-label={allLabel}>
        {[{ id: "all", name: allLabel }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            className="pill"
            aria-pressed={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.id} className="topic-group" aria-labelledby={`cat-${g.id}`}>
          <h2 id={`cat-${g.id}`} className="eyebrow">
            {g.name}
          </h2>
          <ul className="list">
            {g.items.map((i) => (
              <li key={i.id}>
                <Link href={`/${lang}/topics/${i.id}`} className="list-row">
                  <span>
                    <span className="list-title">{i.title}</span>
                    <span className="list-sub">{i.question}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="flip-rtl" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
