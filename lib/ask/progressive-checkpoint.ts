import type { QuestionFrame, EvidencePackage, PassageForSelection } from "./retrieval";
import type { RichSection } from "./rich-answer";

export type ProgressiveGroup = "quran" | "hadith" | "scholar";
export type ProgressiveLaneCheckpoint = {
  candidates: PassageForSelection[];
  pack?: EvidencePackage;
  section?: RichSection;
  retrievalComplete: boolean;
  discoveryComplete?: boolean;
  early?: { pack: EvidencePackage; section: RichSection };
};
/** Trusted server memory only. Never accept this structure from a request body. */
export type ProgressiveCheckpoint = {
  simple?: { version: 1; candidates?: PassageForSelection[]; pack?: EvidencePackage; recoveryUsed: boolean; reassessmentUsed?: boolean;
    /** A reassessment dispatched but not yet returned: resumed with the same reason for the same candidates. */
    pendingReassessment?: { reason: string; candidates: string };
    /** Source families whose search failed in the run that built the saved candidate list. */
    searchProblems?: ("quran" | "hadith" | "scholar")[];
    correctionUsed: boolean; lastFailure?: import("./rich-answer").RichFailureKind; summaryState?: "not_started" | "draft" | "partial" | "approved" | "rejected"; frozen?: RichSection[]; gaps: string[]; queries: import("./search-engine/recovery").RecoveryQuery[];
    recoveryPending?: { queries: import("./search-engine/recovery").RecoveryQuery[]; assessment: {
      pack: EvidencePackage | null; preview: EvidencePackage | null; rejection?: string; missingRequirementIds: string[] | null;
      translations: [string, import("./rich-answer").DisplayTranslation][];
    } };
    approved?: { answer: import("./rich-answer").RichAnswer; fingerprint: string }; terminalNegative?: boolean };
  frame?: QuestionFrame;
  lanes: Partial<Record<ProgressiveGroup, ProgressiveLaneCheckpoint>>;
  meaningApprovals: Set<string>;
  combined?: { candidatesHash: string; candidateSnapshots?: string[]; pack: EvidencePackage };
  retry: number;
  needsEvidence?: boolean;
  integrityBlocked?: boolean;
  recoveryQueries?: import("./search-engine/recovery").RecoveryQuery[];
  recoveryRounds?: Partial<Record<ProgressiveGroup, number>>;
  visitedSources?: Partial<Record<ProgressiveGroup, string[]>>;
  conclusion?: { drafts: number; meaningUsed: boolean; editorialUsed: boolean; pending?: { request: Omit<import("@/lib/ai/types").JsonRequest, "signal">; patches: [import("./rich-answer").RichGroup, import("./text-only-patch").TextOnlyPatch][] }; raw?: unknown };
  stable?: Partial<Record<ProgressiveGroup, { section: RichSection; pack?: EvidencePackage; snapshot: string; invalid?: boolean; rejectedIds?: string[] }>>;
};
