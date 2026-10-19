"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Search } from "lucide-react";
import { setPendingQuestion } from "@/lib/pending";

// The Home search box and popular-question buttons. Both open Ask with the question.
export default function AskLauncher({
  lang,
  placeholder,
  button,
  popularLabel,
  popular,
}: {
  lang: string;
  placeholder: string;
  button: string;
  popularLabel: string;
  popular: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  // Quick focus with Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("home-q")?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function go(question: string) {
    const q = question.trim();
    if (!q) return;
    setPendingQuestion(q);
    router.push(`/${lang}/ask`);
  }

  return (
    <>
      <form
        className="search-box"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
      >
        <Search aria-hidden="true" className="search-icon" />
        <label className="sr-only" htmlFor="home-q">
          {placeholder}
        </label>
        <input
          id="home-q"
          type="text"
          value={value}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="search-kbd" aria-hidden="true">⌘K</span>
        <button type="submit" className="btn btn-primary">
          {button}
        </button>
      </form>

      <section className="popular" aria-labelledby="popular-h">
        <h2 id="popular-h" className="eyebrow">
          {popularLabel}
        </h2>
        <ul className="chips">
          {popular.map((q) => (
            <li key={q}>
              <button type="button" className="chip" onClick={() => go(q)}>
                <span>{q}</span>
                <ArrowRight aria-hidden="true" className="flip-rtl" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
