export type RevelationPlace = "makkah" | "madinah";

export interface SurahSummary {
  id: number;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  revelationPlace: RevelationPlace | null;
  revelationOrder: number | null;
  bismillahPre: boolean;
  translatedName: string;
}

export interface SurahDetail extends SurahSummary {
  pages: [number, number];
}

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: string; // e.g. "1:1"
  textUthmani: string;
  textImlaeiSimple?: string;
  translation: string | null;
  audioUrl: string | null;
  url: string;
}

export interface VersePagination {
  perPage: number;
  currentPage: number;
  nextPage: number | null;
  totalPages: number;
  totalRecords: number;
}

export interface PaginatedVerses {
  verses: Verse[];
  pagination: VersePagination;
}

