/** Pure URL builder kept separate so the search contract can be tested without API credentials. */
export function quranSearchPath(query: string, translationIds: readonly number[], size: number): string {
  const ids = translationIds.join(",");
  const params = new URLSearchParams({
    mode: "advanced",
    query,
    page: "1",
    size: String(size),
    get_text: "0",
    highlight: "0",
    filter_translations: ids,
    translation_ids: ids,
  });
  return `/search/api/v1/search?${params}`;
}

