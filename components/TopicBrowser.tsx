"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  // The chip row swipes on touch screens; with a mouse it can be dragged or scrolled with the wheel.
  const row = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const groups = categories
    .filter((c) => active === "all" || c.id === active)
    .map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) }));

  return (
    <>
      <div
        ref={row}
        className="filter"
        role="group"
        aria-label={allLabel}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !row.current) return;
          drag.current = { x: e.clientX, left: row.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !row.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          // Right-to-left rows scroll the other way.
          row.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
        onPointerLeave={() => { drag.current = null; }}
        onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}
      >
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
          <h2 id={`cat-${g.id}`} className="eyebrow topics-group-title">
            {g.name} <span className="topics-count">{g.items.length}</span>
          </h2>
          <ul className="topics-grid">
            {g.items.map((i) => (
              <li key={i.id}>
                <Link href={`/${lang}/topics/${i.id}`} className="topic-card">
                  <span>
                    <span className="topic-card-title">{i.title}</span>
                    {i.question && <span className="topic-card-sub">{i.question}</span>}
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
