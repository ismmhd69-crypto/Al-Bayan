import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getVerse } from "@/lib/sources/quran";
import { getHadith } from "@/lib/sources/hadith";
import { getLibraryHadith } from "@/lib/sources/hadith-library";
import { hadithMode } from "@/lib/sources/hadith-mode";
import { currentIndexSourceStates } from "@/lib/sources/index-source-state";
import { verifyOfficialScholarExcerpt } from "@/lib/sources/scholars-live";
import {
  scholarQuoteAllowed,
  type ScholarQuote,
} from "@/lib/sources/scholar-rules";
import { getReviewDecisions, getScholarNames } from "@/lib/content";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";
import { loadPrepared } from "@/lib/prepared";
import { preparedContentHash } from "@/lib/prepared-v2";
import { toEvidence, type Evidence } from "@/lib/ask/core";
import { lookupDisplayTranslations } from "@/lib/ask/display-translation-lookup";
import type { JobFreshnessDeps, SourceFreshness } from "./job-freshness";
import type { Locale } from "@/lib/i18n";
import { canonicalSourcePage } from "./candidate-identity";
import { currentVideos } from "@/lib/sources/videos";

/** Per-read dependencies. No cross-request permission/approval cache and no paid AI calls. */
export function serverJobFreshness(options: { freshOriginals?: boolean } = {}): JobFreshnessDeps {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (
    !url ||
    new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co" ||
    !key
  )
    throw new Error("job_freshness_not_configured");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let names: ReturnType<typeof getScholarNames> | undefined;
  const siteRights = new Map<string, Promise<number | null>>();
  const rights = (host: string, signal: AbortSignal) => {
    if (!siteRights.has(host))
      siteRights.set(
        host,
        (async () => {
          const result = await db
            .rpc("read_current_scholar_site_rights", { site_hosts: [host] })
            .abortSignal(signal);
          if (result.error) throw new Error("scholar_permission_lookup_failed");
          const rows = result.data as {
            owner: string;
            status: string;
            max_quote_chars: number | null;
          }[];
          if (
            !Array.isArray(rows) ||
            rows.length !== 1 ||
            rows[0].owner !== host
          )
            return null;
          if (rows[0].status === "granted") return 600;
          return rows[0].status === "short_quotes_only" &&
            Number.isInteger(rows[0].max_quote_chars) &&
            rows[0].max_quote_chars! > 0
            ? Math.min(600, rows[0].max_quote_chars!)
            : null;
        })(),
      );
    return siteRights.get(host)!;
  };
  const same = (a: Evidence, b: Evidence) => {
    const fields = (e: Evidence) =>
      e.kind === "quran"
        ? [e.kind, e.key, e.arabic, e.url, e.translation, e.translationName]
        : e.kind === "hadith"
          ? [
              e.kind,
              e.key,
              e.arabic,
              e.url,
              e.collection,
              e.numbers.bukhari,
              e.numbers.muslim,
              e.gradeAr,
              e.attributionAr,
              e.translation,
              e.translationLanguage,
            ]
          : [
              e.kind,
              e.key,
              e.arabic,
              e.url,
              e.scholarId,
              e.scholarName,
              e.title,
              e.reference,
            ];
    return JSON.stringify(fields(a)) === JSON.stringify(fields(b));
  };
  const checkEvidence = async (
    e: Evidence,
    language: Locale,
    signal: AbortSignal,
    approvedRegistry = false,
  ): Promise<SourceFreshness> => {
    signal.throwIfAborted();
    if (e.kind === "quran") {
      const fresh = await getVerse(e.key, options.freshOriginals);
      return !fresh
        ? "unavailable"
        : same(e, toEvidence({ kind: "quran", verse: fresh }, language))
          ? "valid"
          : "changed";
    }
    if (e.kind === "hadith") {
      const library = e.key.startsWith("SH");
      if (
        !approvedRegistry &&
        hadithMode() !== (library ? "library" : "hadeethenc")
      )
        return "changed";
      if (library) {
        const state = (
          await currentIndexSourceStates([e.key.slice(2)], signal)
        ).get(e.key.slice(2));
        if (
          !state ||
          !("parentOriginalHash" in state) ||
          state.parentOriginalHash !==
            createHash("sha256").update(e.arabic).digest("hex")
        )
          return "changed";
      }
      const fresh = library
        ? await getLibraryHadith(e.key.slice(2))
        : await getHadith(e.key.slice(2), language, options.freshOriginals);
      if (!fresh) return "unavailable";
      return same(e, toEvidence({ kind: "hadith", hadith: fresh }, language))
        ? "valid"
        : "changed";
    }
    if (!approvedRegistry && process.env.SCHOLAR_QUOTES === "off")
      return "changed";
    const approvedNames = await (names ??= getScholarNames());
    if (!approvedNames[e.scholarId]) return "changed";
    const q: ScholarQuote = {
      ...e,
      id: e.key,
      scholarName: { ar: e.scholarName, en: e.scholarName, de: e.scholarName },
    };
    if (!scholarQuoteAllowed(q)) return "changed";
    const stored = await db
      .from("sources")
      .select("id,kind,published,scholar_id,title,reference,text_original,url")
      .eq("id", e.key.slice(1))
      .abortSignal(signal)
      .maybeSingle();
    if (stored.error) throw new Error("scholar_original_lookup_failed");
    // A live URL-derived id must not bypass a withdrawn stored copy of the same exact quote.
    // Match original bytes first, then the canonical official page, including changed slugs.
    const aliases = await db
      .from("sources")
      .select("id,published,url")
      .eq("kind", "fatwa")
      .eq("scholar_id", e.scholarId)
      .eq("text_original", e.arabic)
      .limit(11)
      .abortSignal(signal);
    if (aliases.error) throw new Error("scholar_alias_lookup_failed");
    if ((aliases.data?.length ?? 0) >= 11) return "unavailable";
    const copies = (aliases.data ?? []).filter(
      (row) => canonicalSourcePage(row.url) === canonicalSourcePage(e.url),
    );
    if (copies.some((row) => !row.published)) return "changed";
    if (copies.length) {
      const states = await currentIndexSourceStates(
        copies.map((row) => row.id),
        signal,
      );
      if (copies.some((row) => !states.has(row.id))) return "changed";
    }
    if (stored.data) {
      const row = stored.data;
      if (row.kind !== "fatwa" || !row.published) return "changed";
      const state = (await currentIndexSourceStates([row.id], signal)).get(
        row.id,
      );
      if (
        !state ||
        !("parentOriginalHash" in state) ||
        state.parentOriginalHash !==
          createHash("sha256").update(e.arabic).digest("hex")
      )
        return "changed";
      const fresh: ScholarQuote = {
        id: `S${row.id}`,
        scholarId: row.scholar_id,
        scholarName: approvedNames[row.scholar_id],
        title: row.title,
        reference: row.reference,
        arabic: row.text_original,
        url: row.url,
      };
      if (!fresh.scholarName) return "changed";
      if (!approvedRegistry)
        return same(e, toEvidence({ kind: "scholar", quote: fresh }, language))
          ? "valid"
          : "changed";
    }
    if (!approvedRegistry && process.env.SCHOLARS_LIVE === "off")
      return "changed";
    const max = await rights(new URL(e.url).hostname, signal);
    if (max === null || e.arabic.length > max) return "changed";
    return (await verifyOfficialScholarExcerpt(
      q,
      language,
      signal,
      !approvedRegistry,
    ))
      ? "valid"
      : "changed";
  };
  return {
    refreshVideos: currentVideos,
    async evidence(source, language, signal) {
      const status = await checkEvidence(source.evidence, language, signal);
      if (status !== "valid" || source.displayTranslation?.status !== "ready")
        return status;
      const current = (
        await lookupDisplayTranslations([source], language, signal)
      ).get(source.id);
      if (current?.status === "lookup_failed") return "unavailable";
      return JSON.stringify(current) ===
        JSON.stringify(source.displayTranslation)
        ? "valid"
        : "changed";
    },
    async prepared(answer, signal) {
      if (
        process.env.PREPARED_PUBLISHING_ENABLED !== "true" ||
        process.env.PREPARED_ANSWERS === "off" ||
        !answer.v2 ||
        answer.v2.origin !== "prepared" ||
        !("approval_hash" in answer.v2.provenance)
      )
        return "changed";
      const hash = answer.v2.provenance.approval_hash;
      for (const [kind, registry] of [
        ["prepared", PREPARED_ANSWERS],
        ["topic", TOPIC_ANSWERS],
      ] as const) {
        if (kind === "topic" && process.env.ASK_APPROVED_TOPICS === "false")
          continue;
        const entry = Object.entries(registry).find(
          ([id, file]) =>
            !(
              kind === "prepared" && PREPARED_IDS_AWAITING_VIEW_DECISION.has(id)
            ) && preparedContentHash(file) === hash,
        );
        if (!entry) continue;
        const decision = (await getReviewDecisions(kind))[entry[0]];
        if (decision?.status !== "approved" || decision.contentHash !== hash)
          return "changed";
        const fresh = await loadPrepared(
          { ...entry[1], status: "approved" },
          answer.language,
          { approvalHash: hash },
        );
        signal.throwIfAborted();
        if (!fresh?.v2) return "unavailable";
        // Exact reviewed output, not a newly generated explanation inheriting an old approval.
        if (JSON.stringify(fresh.v2) !== JSON.stringify(answer.v2))
          return "changed";
        const scholarItems = [
          ...fresh.v2.scholars,
          ...(fresh.v2.view_handling
            ? (fresh.v2.view_handling.mode === "reviewed_main"
                ? fresh.v2.view_handling.other_views
                : fresh.v2.view_handling.views
              ).flatMap((v) => v.scholars)
            : []),
        ];
        const checked = await Promise.all(
          scholarItems.map(async (item) => {
            const evidence: Evidence = {
              kind: "scholar",
              key: item.id,
              scholarId: item.scholar_id,
              scholarName: item.scholar_name,
              title: item.title,
              reference: item.reference,
              arabic: item.arabic,
              url: item.url,
            };
            return checkEvidence(evidence, answer.language, signal, true);
          }),
        );
        if (checked.includes("changed")) return "changed";
        if (checked.includes("unavailable")) return "unavailable";
        return "valid";
      }
      return "changed";
    },
  };
}
