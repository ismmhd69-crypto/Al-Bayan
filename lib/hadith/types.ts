export type HadithCollectionId = "bukhari" | "muslim";

export interface HadithCollectionSummary {
  id: HadithCollectionId;
  name: string;
  nameArabic: string;
  nameEnglish: string;
  shortIntro: string;
  totalBooks?: number | null;
  totalHadith?: number | null;
  totalAvailableHadith?: number | null;
}

export interface HadithBookSummary {
  bookNumber: string;
  nameEnglish: string;
  nameArabic: string;
  hadithStartNumber?: number | null;
  hadithEndNumber?: number | null;
  numberOfHadith?: number | null;
}

export interface HadithGradeInfo {
  grade: string;
  gradedBy?: string | null;
}

export interface HadithDetail {
  id: string; // e.g. "bukhari:1" or "muslim:8a"
  collection: HadithCollectionId;
  bookNumber: string;
  chapterId?: string;
  hadithNumber: string; // raw number from provider, e.g. "1" or "8 a"
  displayNumber: string; // clean display number, e.g. "1" or "8a"
  arabicText: string;
  englishText: string | null;
  chapterTitleEnglish?: string;
  chapterTitleArabic?: string;
  grades: HadithGradeInfo[]; // verified provider grades only, never fabricated
  url: string;
  bookNameEnglish?: string;
  bookNameArabic?: string;
}

export interface PaginatedHadiths {
  hadiths: HadithDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}
