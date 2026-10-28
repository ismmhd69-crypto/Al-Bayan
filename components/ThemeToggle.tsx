"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

export default function ThemeToggle({
  labels = { light: "Light", dark: "Dark" },
}: {
  labels?: { light: string; dark: string };
}) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("bayan_theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("bayan_theme", next);
      document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // storage unavailable
    }
  };

  const isDark = mounted ? theme === "dark" : false;
  const currentLabel = isDark ? labels.light : labels.dark;

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggle}
      aria-label={currentLabel}
      title={currentLabel}
    >
      {isDark ? (
        <>
          <Sun aria-hidden="true" className="theme-toggle-icon" />
          <span className="theme-toggle-text">{labels.light}</span>
        </>
      ) : (
        <>
          <Moon aria-hidden="true" className="theme-toggle-icon" />
          <span className="theme-toggle-text">{labels.dark}</span>
        </>
      )}
    </button>
  );
}
