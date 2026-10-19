export type SearchAudit = {
  group: "hadith" | "scholar";
  queries: number;
  hits: number;
  ceilingHits: number;
  wrongKindOrUnavailable: number;
  missingText: number;
  length: number;
  continuation: number;
  titleOrTopic: number;
  authenticity: number;
  eligible: number;
  returned: number;
  configurationMissing: boolean;
};
export type SearchOptions = { allVariants?: boolean; onAudit?: (audit: SearchAudit) => void };
export const emptySearchAudit = (group: SearchAudit["group"]): SearchAudit => ({
  group, queries: 0, hits: 0, ceilingHits: 0, wrongKindOrUnavailable: 0, missingText: 0,
  length: 0, continuation: 0, titleOrTopic: 0, authenticity: 0, eligible: 0, returned: 0, configurationMissing: false,
});
