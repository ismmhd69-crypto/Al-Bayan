"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyProgress, LEARNING_PROGRESS_KEY, parseReadingProgress, type ReadingProgress } from "@/lib/learning/progress";

export function useReadingProgress(validIds: readonly string[]) {
  const [progress, setProgress] = useState<ReadingProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const validKey = validIds.join("|");
  useEffect(() => {
    const ids = validKey.split("|");
    const load = () => {
      try { setProgress(parseReadingProgress(localStorage.getItem(LEARNING_PROGRESS_KEY), ids)); }
      catch { setStorageAvailable(false); }
    };
    load(); setReady(true);
    const listen = (event: StorageEvent) => { if (event.key === LEARNING_PROGRESS_KEY || event.key === null) load(); };
    window.addEventListener("storage", listen);
    return () => window.removeEventListener("storage", listen);
  }, [validKey]);
  const change = useCallback((update: (value: ReadingProgress) => ReadingProgress) => {
    setProgress((value) => {
      const next = update(value);
      try { localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(next)); }
      catch { setStorageAvailable(false); }
      return next;
    });
  }, []);
  const visit = useCallback((id: string) => change((value) => value.last === id ? value : { ...value, last: id }), [change]);
  const toggle = useCallback((id: string) => change((value) => ({ ...value, read: value.read.includes(id) ? value.read.filter((item) => item !== id) : [...value.read, id] })), [change]);
  return { progress, ready, storageAvailable, visit, toggle };
}
