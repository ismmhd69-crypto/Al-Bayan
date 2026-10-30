"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WordSearchStatus = "idle" | "loading" | "done" | "error";

const DEBOUNCE_MS = 400;
const MIN_CHARS = 3;

/** Plain references like "2:255" or "bukhari 1" are looked up by the page's own search, not by words. */
export function isWordQuery(query: string): boolean {
  const q = query.trim();
  return q.length >= MIN_CHARS && !/^[\d\s:.\-]+$/.test(q);
}

/** Word search through one of our own search routes: waits for a pause in typing, drops outdated answers and pages on request. */
export function useWordSearch<T>(endpoint: string, lang: string, query: string) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<WordSearchStatus>("idle");
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (q: string, page: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    try {
      const res = await fetch(`${endpoint}?${new URLSearchParams({ q, lang, page: String(page) })}`, { signal: controller.signal });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { hits: T[]; hasMore: boolean };
      if (controller.signal.aborted) return;
      pageRef.current = page;
      setItems((current) => (page === 1 ? data.hits : [...current, ...data.hits]));
      setHasMore(data.hasMore);
      setStatus("done");
    } catch {
      if (controller.signal.aborted) return;
      setStatus("error");
    }
  }, [endpoint, lang]);

  useEffect(() => {
    abortRef.current?.abort();
    if (!isWordQuery(query)) {
      setItems([]);
      setHasMore(false);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const timer = setTimeout(() => void run(query.trim(), 1), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const loadMore = useCallback(() => void run(query.trim(), pageRef.current + 1), [query, run]);
  const retry = useCallback(() => void run(query.trim(), 1), [query, run]);
  return { items, status, hasMore, loadMore, retry };
}
