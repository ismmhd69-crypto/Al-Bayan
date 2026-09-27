"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import AskAboutButton from "./AskAboutButton";

type Item = { id: string; title: string; text: string; topicId?: string; question?: string };
type Labels = { step: string; done: string; markDone: string; undo: string; read: string; ask: string; progress: string };

const KEY = "bayan:steps-done";

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Progress is kept on this device only (plan section 10).
export default function StepsList({ lang, items, t }: { lang: string; items: Item[]; t: Labels }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(load()), []);

  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: progress lasts for this visit only.
    }
  }

  const count = items.filter((i) => done.includes(i.id)).length;

  return (
    <>
      <div className="progress" aria-live="polite">
        <div className="progress-bar" aria-hidden="true">
          <span style={{ inlineSize: `${(count / items.length) * 100}%` }} />
        </div>
        <p>{t.progress.replace("{done}", String(count)).replace("{total}", String(items.length))}</p>
      </div>

      <ol className="steps">
        {items.map((s, n) => {
          const isDone = done.includes(s.id);
          return (
            <li key={s.id} className={`step${isDone ? " step--done" : ""}`}>
              <span className="step-num" aria-hidden="true">
                {isDone ? <Check /> : n + 1}
              </span>
              <div className="step-body">
                <p className="eyebrow">
                  {t.step} {n + 1}
                  {isDone && ` · ${t.done}`}
                </p>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <div className="step-actions">
                  {s.topicId ? (
                    <Link href={`/${lang}/topics/${s.topicId}`} className="btn btn-ghost">
                      {t.read}
                    </Link>
                  ) : (
                    s.question && <AskAboutButton lang={lang} question={s.question} label={t.ask} variant="ghost" />
                  )}
                  <button type="button" className="btn btn-quiet" aria-pressed={isDone} onClick={() => toggle(s.id)}>
                    {isDone ? t.undo : t.markDone}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
