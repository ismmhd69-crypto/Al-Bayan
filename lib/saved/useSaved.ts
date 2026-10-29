"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { browserSupabase } from "@/lib/supabase-browser";
import { addItem, DEVICE_KEY, fromRow, MAX_DEVICE_ANSWERS, moveDeviceToAccount, parseDevice, removeItem, serializeDevice, toRow, type SavedItem, type SavedKind, type SavedRow, type SavedTable } from "./store";

// One shared store for every Save button, bookmark and the Saved page on the screen.
// Signed out: device storage. Signed in: public.saved_items, with device saves moved over once.
// If the account table cannot be reached (for example before its migration is applied), saving keeps
// working on the device instead of failing.

type State = { ready: boolean; signedIn: boolean; account: boolean; items: SavedItem[] };
let state: State = { ready: false, signedIn: false, account: false, items: [] };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => { state = { ...state, ...next }; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const serverState: State = { ready: false, signedIn: false, account: false, items: [] };

function readDevice(): SavedItem[] {
  try { return parseDevice(localStorage.getItem(DEVICE_KEY)); } catch { return []; }
}
function writeDevice(items: SavedItem[]): boolean {
  try { localStorage.setItem(DEVICE_KEY, serializeDevice(items)); return true; } catch { return false; }
}

const table: SavedTable = {
  async list() {
    const { data, error } = await browserSupabase().from("saved_items")
      .select("kind, item_key, title, lang, question, answer, created_at").order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    return (data ?? []) as SavedRow[];
  },
  async insert(rows) {
    const { error } = await browserSupabase().from("saved_items").upsert(rows, { onConflict: "user_id,kind,item_key", ignoreDuplicates: true });
    if (error) throw error;
  },
  async remove(kind, key) {
    const { error } = await browserSupabase().from("saved_items").delete().eq("kind", kind).eq("item_key", key);
    if (error) throw error;
  },
};

async function load(signedIn: boolean) {
  if (!signedIn) { set({ ready: true, signedIn: false, account: false, items: readDevice() }); return; }
  try {
    const device = readDevice();
    const moved = await moveDeviceToAccount(device, table);
    if (!moved.keepDevice && device.length) writeDevice([]);
    const rows = await table.list();
    set({ ready: true, signedIn: true, account: true, items: rows.map(fromRow) });
  } catch {
    set({ ready: true, signedIn: true, account: false, items: readDevice() });
  }
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const supabase = browserSupabase();
  supabase.auth.getSession().then(({ data }) => load(!!data.session)).catch(() => load(false));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load(!!session);
  });
  window.addEventListener("storage", (e) => { if (e.key === DEVICE_KEY && !state.account) set({ items: readDevice() }); });
}

export type SaveResult = "saved" | "device" | "dropped" | "failed";

export function useSaved() {
  useEffect(start, []);
  const s = useSyncExternalStore(subscribe, () => state, () => serverState);
  const isSaved = useCallback((kind: SavedKind, key: string) => s.items.some((x) => x.kind === kind && x.key === key), [s.items]);
  const save = useCallback(async (item: SavedItem): Promise<SaveResult> => {
    if (state.account) {
      try { await table.insert([toRow(item)]); set({ items: addItem(state.items, item).items }); return "saved"; }
      catch { return "failed"; }
    }
    const { items, dropped } = addItem(readDevice(), item, MAX_DEVICE_ANSWERS);
    if (!writeDevice(items)) return "failed";
    set({ items });
    return dropped ? "dropped" : "device";
  }, []);
  const remove = useCallback(async (kind: SavedKind, key: string): Promise<boolean> => {
    if (state.account) {
      try { await table.remove(kind, key); } catch { return false; }
      set({ items: removeItem(state.items, kind, key) });
      return true;
    }
    const items = removeItem(readDevice(), kind, key);
    if (!writeDevice(items)) return false;
    set({ items });
    return true;
  }, []);
  return { ...s, isSaved, save, remove };
}
