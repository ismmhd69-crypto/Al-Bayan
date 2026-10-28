import "server-only";
import type {
  HadithBookSummary,
  HadithCollectionId,
  HadithCollectionSummary,
  HadithDetail,
  HadithGradeInfo,
  PaginatedHadiths,
} from "./types";
import { cleanHadithMarkup } from "@/lib/sources/hadith-markup";
import { acceptableGrade } from "@/lib/sources/hadith-rules";

const API_BASE = "https://api.sunnah.com/v1";
const CACHE_SECONDS = 86_400; // 1 day cache per provider policy
const TIMEOUT_MS = 10_000;

/** Validates that reference input contains only safe alphanumeric characters. */
export function validateReferenceInput(ref: string): boolean {
  if (typeof ref !== "string") return false;
  const trimmed = ref.trim().replace(/\s+/g, "");
  // Must start with digits and may end with letters (e.g. 1, 8a, 1921b)
  return /^\d+[a-zA-Z]*$/.test(trimmed) && trimmed.length <= 15;
}

/** Natural comparison for Hadith references (e.g. 1 < 2 < 10, and 8a < 8b). */
export function compareHadithReferences(a: string, b: string): number {
  const parse = (ref: string) => {
    const match = ref.trim().match(/^(\d+)\s*([a-zA-Z]*)$/);
    if (!match) return { num: 0, suffix: ref.trim().toLowerCase() };
    return { num: Number(match[1]), suffix: match[2].toLowerCase() };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.num !== pb.num) {
    return pa.num - pb.num;
  }
  return pa.suffix.localeCompare(pb.suffix);
}

/** Formats a raw Sunnah.com reference into a clean URL-safe display reference (e.g. "8 a" -> "8a"). */
export function formatDisplayReference(ref: string): string {
  return ref.trim().replace(/\s+/g, "").toLowerCase();
}

/** Prepares legitimate lookup candidates for Sunnah.com API (e.g. "8a" -> ["8 a", "8a"]). */
export function normalizeReferenceForLookup(ref: string): string[] {
  const cleaned = ref.trim().replace(/[-_]+/g, "");
  const match = cleaned.match(/^(\d+)\s*([a-zA-Z]+)$/);
  if (match) {
    const withSpace = `${match[1]} ${match[2].toLowerCase()}`;
    const withoutSpace = `${match[1]}${match[2].toLowerCase()}`;
    return [withSpace, withoutSpace];
  }
  return [cleaned];
}

async function fetchSunnah(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.SUNNAH_API_KEY;
  if (!key) {
    throw new Error("Sunnah.com API key is not configured in environment");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          Accept: "application/json",
          "X-API-Key": key,
          ...init?.headers,
        },
        next: { revalidate: CACHE_SECONDS },
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        throw new Error("Sunnah.com API request timed out");
      }
      throw err;
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(`Sunnah.com API authentication failed (${res.status})`);
    }
    if (res.status === 429) {
      throw new Error("Sunnah.com API rate limit exceeded (429)");
    }
    if (res.status >= 500) {
      throw new Error(`Sunnah.com API server error (${res.status})`);
    }
    if (!res.ok && res.status !== 404) {
      throw new Error(`Sunnah.com API request failed with status ${res.status}`);
    }

    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------- Collections ----------------

interface ApiCollectionResponse {
  name?: string;
  totalHadith?: number;
  totalAvailableHadith?: number;
  collection?: Array<{
    lang: string;
    title: string;
    shortIntro?: string;
  }>;
}

export async function getHadithCollections(): Promise<HadithCollectionSummary[]> {
  const collections: HadithCollectionId[] = ["bukhari", "muslim"];
  const summaries: HadithCollectionSummary[] = [];

  for (const id of collections) {
    const summary = await getCollection(id);
    if (summary) summaries.push(summary);
  }

  return summaries;
}

export async function getCollection(id: string): Promise<HadithCollectionSummary | null> {
  const norm = id.toLowerCase().trim();
  if (norm !== "bukhari" && norm !== "muslim") {
    return null;
  }

  const colId = norm as HadithCollectionId;
  const res = await fetchSunnah(`/collections/${colId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch collection metadata for ${colId}: ${res.status}`);
  }

  const data = (await res.json()) as ApiCollectionResponse;
  const enInfo = data.collection?.find((c) => c.lang === "en");
  const arInfo = data.collection?.find((c) => c.lang === "ar");

  // Determine verified books count
  let totalBooks: number | null = null;
  try {
    const books = await getCollectionBooks(colId);
    totalBooks = books.length;
  } catch {
    totalBooks = null;
  }

  return {
    id: colId,
    name: colId,
    nameEnglish: enInfo?.title ?? (colId === "bukhari" ? "Sahih al-Bukhari" : "Sahih Muslim"),
    nameArabic: arInfo?.title ?? (colId === "bukhari" ? "صحيح البخاري" : "صحيح مسلم"),
    shortIntro: enInfo?.shortIntro ?? "",
    totalBooks,
    totalHadith: typeof data.totalHadith === "number" ? data.totalHadith : null,
    totalAvailableHadith: typeof data.totalAvailableHadith === "number" ? data.totalAvailableHadith : null,
  };
}

// ---------------- Books ----------------

interface ApiBookLang {
  lang: string;
  name: string;
}

interface ApiBook {
  bookNumber: string | number;
  book?: ApiBookLang[];
  hadithStartNumber?: number;
  hadithEndNumber?: number;
  numberOfHadith?: number;
}

interface ApiBooksResponse {
  data?: ApiBook[];
  total?: number;
  limit?: number;
  next?: number | null;
  previous?: number | null;
}

export async function getCollectionBooks(collection: HadithCollectionId): Promise<HadithBookSummary[]> {
  if (collection !== "bukhari" && collection !== "muslim") {
    return [];
  }

  let currentPage = 1;
  let requestsMade = 0;
  const MAX_REQUESTS = 15;
  const MAX_PAGE_NUMBER = 15;
  const rawBooks: ApiBook[] = [];
  const visitedPages = new Set<number>();

  while (true) {
    requestsMade++;
    if (requestsMade > MAX_REQUESTS) {
      throw new Error(`Catalogue pagination exceeded request budget of ${MAX_REQUESTS} requests for ${collection}`);
    }

    if (visitedPages.has(currentPage)) {
      throw new Error(`Pagination cycle detected for ${collection} books on page ${currentPage}`);
    }
    visitedPages.add(currentPage);

    const res = await fetchSunnah(`/collections/${collection}/books?limit=50&page=${currentPage}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch books for ${collection} on page ${currentPage}: ${res.status}`);
    }

    const json = (await res.json()) as ApiBooksResponse | ApiBook[];
    const list = Array.isArray(json) ? json : json.data ?? [];
    rawBooks.push(...list);

    // If response is raw array or next is explicitly null/undefined: complete
    if (Array.isArray(json) || json.next == null) {
      break;
    }

    // Validate next-page value
    const nextPage = json.next;
    if (typeof nextPage !== "number" || !Number.isSafeInteger(nextPage) || nextPage <= 0) {
      throw new Error(`Invalid next-page value '${nextPage}' for ${collection} books on page ${currentPage}`);
    }

    // Check for self-cycle
    if (nextPage === currentPage) {
      throw new Error(`Self-cycle detected for ${collection} books: page ${currentPage} links to itself`);
    }

    // Check for multi-page cycle
    if (visitedPages.has(nextPage)) {
      throw new Error(`Pagination cycle detected for ${collection} books: page ${currentPage} links to already visited page ${nextPage}`);
    }

    // Check for jump beyond numeric bound
    if (nextPage > MAX_PAGE_NUMBER) {
      throw new Error(`Next page ${nextPage} exceeds maximum allowed page number (${MAX_PAGE_NUMBER}) for ${collection} books`);
    }

    currentPage = nextPage;
  }

  // Deduplicate books by bookNumber
  const seenBookNumbers = new Set<string>();
  const uniqueBooks: ApiBook[] = [];
  for (const b of rawBooks) {
    const key = String(b.bookNumber ?? "").trim().toLowerCase();
    if (!key || seenBookNumbers.has(key)) continue;
    seenBookNumbers.add(key);
    uniqueBooks.push(b);
  }

  return uniqueBooks
    .map((b) => {
      const en = b.book?.find((l) => l.lang === "en")?.name ?? `Book ${b.bookNumber}`;
      const ar = b.book?.find((l) => l.lang === "ar")?.name ?? `كتاب ${b.bookNumber}`;
      const bookNum = String(b.bookNumber).trim();
      return {
        bookNumber: bookNum,
        nameEnglish: en.trim(),
        nameArabic: ar.trim(),
        hadithStartNumber: typeof b.hadithStartNumber === "number" ? b.hadithStartNumber : null,
        hadithEndNumber: typeof b.hadithEndNumber === "number" ? b.hadithEndNumber : null,
        numberOfHadith: typeof b.numberOfHadith === "number" ? b.numberOfHadith : null,
      };
    })
    .filter((b) => {
      // Exclude Muslim's introduction (muqaddimah) per existing source policy:
      // Muslim's muqaddimah is not part of the authentic musnad collection.
      if (collection === "muslim") {
        if (b.bookNumber.toLowerCase() === "introduction") return false;
        if (/(?:مقدمة|introduction)/i.test(b.nameEnglish) || /(?:مقدمة|introduction)/i.test(b.nameArabic)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const na = Number(a.bookNumber);
      const nb = Number(b.bookNumber);
      if (Number.isInteger(na) && Number.isInteger(nb)) return na - nb;
      return a.bookNumber.localeCompare(b.bookNumber);
    });
}

export async function getBook(
  collection: HadithCollectionId,
  bookNumber: string
): Promise<HadithBookSummary | null> {
  const books = await getCollectionBooks(collection);
  const norm = bookNumber.toLowerCase().trim();
  const found = books.find((b) => b.bookNumber.toLowerCase() === norm);
  return found ?? null;
}

// ---------------- Hadiths ----------------

interface ApiLanguageEntry {
  lang?: string;
  title?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  urn?: number;
  body?: string;
  grades?: Array<{ grade?: string; graded_by?: string | null }>;
}

interface ApiHadithItem {
  collection?: string;
  bookNumber?: string | number;
  chapterId?: string;
  hadithNumber?: string | number;
  hadith?: ApiLanguageEntry[];
  grades?: Array<{ grade?: string; graded_by?: string | null }>;
}

interface ApiHadithsListResponse {
  data?: ApiHadithItem[];
  total?: number;
  limit?: number;
  previous?: number | null;
  next?: number | null;
}

function cleanHtmlText(html: string): string {
  const text = html
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
  return cleanHadithMarkup(text);
}

/** Validates verified provider grade labels using exact supported rules. */
export function isEligibleGrade(grade: string): boolean {
  if (typeof grade !== "string") return false;
  const g = grade.trim();
  if (!g) return false;

  // Reject any grade text indicating weakness, fabrication, defect, irregularity, or contradiction
  if (
    /ضعيف|موضوع|منكر|شاذ|لا يصح|لا أصل/i.test(g) ||
    /(?:da'?if|weak|mawdu'?|fabricated|munkar|shadh|unreliable|unsupported|disputed|doubtful|unknown)/i.test(g)
  ) {
    return false;
  }

  // Acceptable Arabic grades per existing documented rule
  if (acceptableGrade(g)) {
    return true;
  }

  // Exact supported English provider labels without qualifications
  if (/^(?:sahih|hasan)$/i.test(g)) {
    return true;
  }

  // Exact supported Muttafaqun 'Alayh labels
  if (/^(?:(?:sahih\s*-\s*)?muttafaq(?:un)?\s*'?alayh)$/i.test(g)) {
    return true;
  }

  // Explicit supported provider qualifications in parentheses
  // Supported provider examples on Sunnah.com: (Darussalam), (Al-Albani), (Zubair Ali Zai)
  const parenMatch = g.match(/^(?:sahih|hasan)\s*\(([^)]+)\)$/i);
  if (parenMatch) {
    const qual = parenMatch[1].trim();
    if (/^(?:Darussalam|Al-Albani|Zubair Ali Zai|Zubair 'Ali Za'i)$/i.test(qual)) {
      return true;
    }
    // Any other arbitrary or unknown parenthetical text (e.g. "disputed", "unknown", etc.) is rejected
    return false;
  }

  return false;
}

/** Enforces existing documented source eligibility rules. */
export function isEligibleHadith(item: ApiHadithItem, collection: HadithCollectionId): boolean {
  if (!item || typeof item !== "object") return false;
  if (item.collection?.toLowerCase() !== collection) return false;

  const arEntry = item.hadith?.find((h) => h.lang === "ar");
  const enEntry = item.hadith?.find((h) => h.lang === "en");
  const arabicBody = arEntry?.body?.trim();
  if (!arabicBody) return false;

  const title = (arEntry?.chapterTitle ?? enEntry?.chapterTitle ?? "").trim();
  const bookNum = String(item.bookNumber ?? "").toLowerCase();

  // Muslim's muqaddimah reports are excluded from the authentic reader
  if (collection === "muslim") {
    if (bookNum === "introduction" || /(?:مقدمة|introduction)/i.test(title) || /(?:مقدمة|introduction)/i.test(arabicBody)) {
      return false;
    }
  }

  // Bukhari chapter headings (tarjamah al-bab) that lack musnad narration are excluded
  // Evidence-backed check: rejects headings starting with باب or chapter without arbitrary length cutoffs
  if (collection === "bukhari") {
    const cleanAr = cleanHtmlText(arabicBody).trim();
    if (/^(?:باب(?:\s|:|$)|chapter\b)/i.test(cleanAr)) {
      return false;
    }
  }

  // If the provider supplies explicit grades, verify every one meets exact eligibility rules
  const allGrades = [
    ...(Array.isArray(item.grades) ? item.grades : []),
    ...(Array.isArray(arEntry?.grades) ? arEntry.grades : []),
    ...(Array.isArray(enEntry?.grades) ? enEntry.grades : []),
  ];

  for (const g of allGrades) {
    if (typeof g?.grade === "string" && g.grade.trim()) {
      if (!isEligibleGrade(g.grade)) {
        return false;
      }
    }
  }

  return true;
}

export function parseRawHadithItem(
  item: ApiHadithItem,
  collection: HadithCollectionId,
  expectedRef?: string
): HadithDetail | null {
  if (!item || !Array.isArray(item.hadith) || item.hadith.length === 0) {
    return null;
  }

  // Validate collection identity
  if (item.collection?.toLowerCase() !== collection) {
    return null;
  }

  const rawNum = String(item.hadithNumber ?? "").trim();
  if (!rawNum) return null;

  // Validate reference identity if expected
  if (expectedRef) {
    if (formatDisplayReference(rawNum) !== formatDisplayReference(expectedRef)) {
      return null;
    }
  }

  // Enforce source eligibility
  if (!isEligibleHadith(item, collection)) {
    return null;
  }

  const arEntry = item.hadith.find((h) => h.lang === "ar");
  const enEntry = item.hadith.find((h) => h.lang === "en");

  const rawArabic = arEntry?.body?.trim();
  if (!rawArabic) return null;

  const arabicText = cleanHtmlText(rawArabic);
  const rawEnglish = enEntry?.body?.trim();
  const englishText = rawEnglish ? cleanHtmlText(rawEnglish) : null;

  const displayNum = formatDisplayReference(rawNum);
  const bookNum = String(item.bookNumber ?? "1").trim();

  // Extract verified grades only: NEVER invent grades or attribution
  const grades: HadithGradeInfo[] = [];
  const rawGrades = (Array.isArray(item.grades) && item.grades.length > 0)
    ? item.grades
    : (arEntry?.grades ?? enEntry?.grades);
  if (Array.isArray(rawGrades)) {
    for (const g of rawGrades) {
      if (typeof g?.grade === "string" && g.grade.trim()) {
        const gradeText = g.grade.trim();
        const graderText = typeof g.graded_by === "string" && g.graded_by.trim() ? g.graded_by.trim() : null;
        grades.push({
          grade: gradeText,
          gradedBy: graderText,
        });
      }
    }
  }

  return {
    id: `${collection}:${displayNum}`,
    collection,
    bookNumber: bookNum,
    chapterId: typeof item.chapterId === "string" ? item.chapterId : undefined,
    hadithNumber: rawNum,
    displayNumber: displayNum,
    arabicText,
    englishText,
    chapterTitleEnglish: enEntry?.chapterTitle?.trim() || undefined,
    chapterTitleArabic: arEntry?.chapterTitle?.trim() || undefined,
    grades,
    url: `https://sunnah.com/${collection}:${displayNum}`,
  };
}

export async function getBookHadiths(
  collection: HadithCollectionId,
  bookNumber: string,
  options?: { page?: number; limit?: number }
): Promise<PaginatedHadiths> {
  if (collection !== "bukhari" && collection !== "muslim") {
    throw new Error(`Invalid collection: ${collection}`);
  }

  const normBook = bookNumber.toLowerCase().trim();
  if (collection === "muslim" && normBook === "introduction") {
    throw new Error("Muslim introduction is not an eligible collection book");
  }

  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(50, Math.max(1, options?.limit ?? 20));

  const res = await fetchSunnah(
    `/collections/${collection}/books/${encodeURIComponent(bookNumber)}/hadiths?limit=${limit}&page=${page}`
  );

  if (!res.ok) {
    if (res.status === 404) {
      return {
        hadiths: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      };
    }
    throw new Error(`Failed to fetch hadiths for ${collection} book ${bookNumber}: ${res.status}`);
  }

  const json = (await res.json()) as ApiHadithsListResponse;
  const rawItems = json.data ?? [];

  // Filter and validate book identity
  const hadiths = rawItems
    .filter((item) => String(item.bookNumber ?? "").toLowerCase() === normBook)
    .map((item) => parseRawHadithItem(item, collection))
    .filter((h): h is HadithDetail => h !== null);

  const total = typeof json.total === "number" ? json.total : hadiths.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = typeof json.next === "number" || page < totalPages;
  const hasPrev = typeof json.previous === "number" || page > 1;

  return {
    hadiths,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
}

export async function getHadithByReference(
  collection: HadithCollectionId,
  reference: string
): Promise<HadithDetail | null> {
  if (collection !== "bukhari" && collection !== "muslim") {
    return null;
  }

  if (!validateReferenceInput(reference)) {
    return null;
  }

  const candidates = normalizeReferenceForLookup(reference);
  let rawItem: ApiHadithItem | null = null;

  for (const cand of candidates) {
    const res = await fetchSunnah(`/collections/${collection}/hadiths/${encodeURIComponent(cand)}`);
    if (res.status === 404) {
      // Genuine documented 404: try next legitimate spelling candidate
      continue;
    }
    if (res.ok) {
      rawItem = (await res.json()) as ApiHadithItem;
      break;
    }
    // Any other status (403, 500, etc.) is NOT 404: do not retry alternate candidate, throw immediately
    throw new Error(`Sunnah.com API request failed with status ${res.status}`);
  }

  if (!rawItem) {
    return null;
  }

  const detail = parseRawHadithItem(rawItem, collection, reference);
  if (!detail) return null;

  // Enrich with verified book names
  try {
    const book = await getBook(collection, detail.bookNumber);
    if (book) {
      detail.bookNameEnglish = book.nameEnglish;
      detail.bookNameArabic = book.nameArabic;
    }
  } catch {
    // Book metadata fetch failure does not invalidate the verified hadith record
  }

  return detail;
}

// ---------------- Navigation using Verified Ordering ----------------

interface BookHadithsPageResult {
  refs: string[];
  total: number;
  totalPages: number;
  hasNext: boolean;
  effectiveLimit: number;
}

/** Bounded helper to fetch verified, eligible references for a specific book page. */
async function fetchBookHadithsPage(
  collection: HadithCollectionId,
  bookNumber: string,
  page: number,
  limit = 100
): Promise<BookHadithsPageResult> {
  const normBook = bookNumber.trim().toLowerCase();
  const res = await fetchSunnah(
    `/collections/${collection}/books/${encodeURIComponent(bookNumber)}/hadiths?limit=${limit}&page=${page}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch hadiths for ${collection} book ${bookNumber} page ${page}: ${res.status}`);
  }

  const json = (await res.json()) as ApiHadithsListResponse;
  const rawItems = json.data ?? [];

  // Filter and validate book identity, collection identity, and eligibility
  const eligibleRefs = rawItems
    .filter((item) => {
      if (item.collection?.toLowerCase() !== collection) return false;
      if (String(item.bookNumber ?? "").trim().toLowerCase() !== normBook) return false;
      return isEligibleHadith(item, collection);
    })
    .map((item) => formatDisplayReference(String(item.hadithNumber ?? "")))
    .filter(Boolean);

  // Use the provider's effective page size when interpreting pagination metadata
  const rawCount = rawItems.length;
  const effectiveLimit =
    typeof json.limit === "number" && json.limit > 0
      ? json.limit
      : rawCount > 0 && json.next != null
      ? rawCount
      : limit;

  const total = typeof json.total === "number" ? json.total : eligibleRefs.length;
  const totalPages = Math.ceil(total / effectiveLimit) || 1;
  const hasNext = typeof json.next === "number" || page < totalPages;

  return {
    refs: eligibleRefs,
    total,
    totalPages,
    hasNext,
    effectiveLimit,
  };
}

export async function getAdjacentHadiths(
  collection: HadithCollectionId,
  hadithOrRef: HadithDetail | string
): Promise<{ prev: string | null; next: string | null }> {
  if (collection !== "bukhari" && collection !== "muslim") {
    return { prev: null, next: null };
  }

  let hadith: HadithDetail | null = null;
  if (typeof hadithOrRef === "string") {
    hadith = await getHadithByReference(collection, hadithOrRef);
    if (!hadith) return { prev: null, next: null };
  } else {
    hadith = hadithOrRef;
  }

  const currentRef = formatDisplayReference(hadith.displayNumber);
  const bookNumber = hadith.bookNumber;
  const maxSearchPages = 6;

  let locatedPage: number | null = null;
  let locatedIndex: number | null = null;
  let locatedPageData: BookHadithsPageResult | null = null;

  // Search through book pages up to maxSearchPages to locate the record in verified ordering
  for (let p = 1; p <= maxSearchPages; p++) {
    try {
      const pageData = await fetchBookHadithsPage(collection, bookNumber, p, 100);
      const idx = pageData.refs.indexOf(currentRef);
      if (idx !== -1) {
        locatedPage = p;
        locatedIndex = idx;
        locatedPageData = pageData;
        break;
      }
      if (!pageData.hasNext) {
        break;
      }
    } catch {
      // If book page fetch fails, cannot establish sequence safely
      break;
    }
  }

  let prev: string | null = null;
  let next: string | null = null;
  let isTrueBookStart = false;
  let isTrueBookEnd = false;

  if (locatedPage != null && locatedIndex != null && locatedPageData != null) {
    // 1. Resolve 'prev' within the book
    if (locatedIndex > 0) {
      prev = locatedPageData.refs[locatedIndex - 1];
    } else if (locatedPage === 1) {
      // Index 0 of page 1: this is proven to be the true start of the book!
      isTrueBookStart = true;
    } else {
      // Index 0 of page > 1: fetch previous page to get its last eligible record
      try {
        const prevPageData = await fetchBookHadithsPage(collection, bookNumber, locatedPage - 1, 100);
        if (prevPageData.refs.length > 0) {
          prev = prevPageData.refs[prevPageData.refs.length - 1];
        }
      } catch {
        // Leave prev as null if adjacent page cannot be retrieved
      }
    }

    // 2. Resolve 'next' within the book
    if (locatedIndex < locatedPageData.refs.length - 1) {
      next = locatedPageData.refs[locatedIndex + 1];
    } else if (!locatedPageData.hasNext) {
      // Last index of last page: this is proven to be the true end of the book!
      isTrueBookEnd = true;
    } else {
      // Last index of page where hasNext is true: fetch next page to get its first eligible record
      try {
        const nextPageData = await fetchBookHadithsPage(collection, bookNumber, locatedPage + 1, 100);
        if (nextPageData.refs.length > 0) {
          next = nextPageData.refs[0];
        }
      } catch {
        // Leave next as null if adjacent page cannot be retrieved
      }
    }
  }

  // 3. Cross books ONLY after establishing the actual book boundary
  if (isTrueBookStart || isTrueBookEnd) {
    try {
      const books = await getCollectionBooks(collection);
      const bookIdx = books.findIndex(
        (b) => b.bookNumber.toLowerCase() === bookNumber.toLowerCase()
      );

      if (bookIdx !== -1) {
        // If at true start of book, get actual final record of previous book
        if (isTrueBookStart && bookIdx > 0) {
          const prevBook = books[bookIdx - 1];
          try {
            const page1 = await fetchBookHadithsPage(collection, prevBook.bookNumber, 1, 100);
            if (page1.totalPages > 1) {
              // Direct request to the actual final page using verified pagination metadata (1 request)
              const lastPageData = await fetchBookHadithsPage(
                collection,
                prevBook.bookNumber,
                page1.totalPages,
                page1.effectiveLimit
              );
              if (lastPageData.refs.length > 0) {
                prev = lastPageData.refs[lastPageData.refs.length - 1];
              } else {
                // If final page contains no eligible records, return null (never fall back to page 1)
                prev = null;
              }
            } else if (page1.refs.length > 0) {
              prev = page1.refs[page1.refs.length - 1];
            } else {
              prev = null;
            }
          } catch {
            // Leave prev null
          }
        }

        // If at true end of book, get first record of next book
        if (isTrueBookEnd && bookIdx < books.length - 1) {
          const nextBook = books[bookIdx + 1];
          try {
            const nextBookPage1 = await fetchBookHadithsPage(collection, nextBook.bookNumber, 1, 100);
            if (nextBookPage1.refs.length > 0) {
              next = nextBookPage1.refs[0];
            } else {
              next = null;
            }
          } catch {
            // Leave next null
          }
        }
      }
    } catch {
      // If collection books cannot be verified, leave boundary links as null
    }
  }

  return { prev, next };
}
