export const LEARNING_PROGRESS_KEY = "bayan:learning-progress:v1";
export const LEGACY_PROGRESS_KEY = "bayan:steps-done";
export type ReadingProgress = { read: string[]; last: string | null };
export const emptyProgress = (): ReadingProgress => ({ read: [], last: null });
/** Old six-step marks do not certify that someone has read the expanded articles. */
export function parseReadingProgress(raw: string | null, validIds: readonly string[]): ReadingProgress {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return emptyProgress();
    const object = value as { read?: unknown; last?: unknown };
    return { read: Array.isArray(object.read) ? [...new Set(object.read.filter((id): id is string => typeof id === "string" && validIds.includes(id)))] : [], last: typeof object.last === "string" && validIds.includes(object.last) ? object.last : null };
  } catch { return emptyProgress(); }
}
