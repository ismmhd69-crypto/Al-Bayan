"use client";

import { useEffect, useState } from "react";

/** Wide screens only: the article's sections (highlighted while scrolling) and how much has been read.
 * Uses the lesson rail's styles in app/[lang]/start/learning.css. */
export default function ArticleRail({ title, sections, readLabel }: { title: string; sections: { id: string; label: string }[]; readLabel: string }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const update = () => {
      let current = sections[0]?.id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top < 200) current = section.id;
      }
      setActive(current);
      const room = document.documentElement.scrollHeight - window.innerHeight;
      setPercent(room > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / room) * 100))) : 100);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [sections]);
  return <aside className="lesson-rail" aria-label={title}>
    <h2 className="lesson-rail-title">{title}</h2>
    <nav className="lesson-toc">
      {sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>{section.label}</a>)}
    </nav>
    <p className="lesson-rail-percent"><strong>{percent} %</strong>{readLabel}</p>
  </aside>;
}
