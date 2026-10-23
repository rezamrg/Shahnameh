export interface Couplet {
  m1: string;
  m2: string;
  summary?: string;
}

interface ChapterVersesFile {
  chapterId: number;
  title: string;
  sectionsCount: number;
  versesCount: number;
  sections: Record<string, Couplet[]>;
}

// In-memory cache of loaded chapter data
const chapterCache: Record<number, Record<string, Couplet[]>> = {};

/**
 * Preloads a chapter's verses into memory so section reading is 100% instant (0ms)
 */
export async function preloadChapterVerses(chapterId: number): Promise<void> {
  if (chapterCache[chapterId]) return;

  try {
    const res = await fetch(`/data/verses/ch_${chapterId}.json`);
    if (!res.ok) return;
    const data: ChapterVersesFile = await res.json();
    if (data && data.sections) {
      chapterCache[chapterId] = data.sections;
    }
  } catch (err) {
    console.warn(`Could not preload chapter ${chapterId}:`, err);
  }
}

/**
 * Gets section verses permanently and instantly from local software storage
 */
export async function getSectionVerses(
  chapterId: number,
  sectionNumber: number
): Promise<{
  success: boolean;
  couplets: Couplet[];
  error?: string;
}> {
  // 1. Check in-memory cache first (0 ms)
  if (chapterCache[chapterId]) {
    const couplets = chapterCache[chapterId][String(sectionNumber)] || [];
    return {
      success: couplets.length > 0,
      couplets,
      error: couplets.length > 0 ? undefined : 'ابیات این بخش یافت نشد.',
    };
  }

  // 2. Load chapter file directly from local app files (/data/verses/ch_X.json)
  try {
    const res = await fetch(`/data/verses/ch_${chapterId}.json`);
    if (!res.ok) {
      throw new Error(`خطای بارگذاری فایل محلی ابیات (${res.status})`);
    }
    const data: ChapterVersesFile = await res.json();
    if (data && data.sections) {
      chapterCache[chapterId] = data.sections;
      const couplets = data.sections[String(sectionNumber)] || [];
      return {
        success: couplets.length > 0,
        couplets,
        error: couplets.length > 0 ? undefined : 'ابیات این بخش یافت نشد.',
      };
    }
    return {
      success: false,
      couplets: [],
      error: 'داده‌های بخش نامعتبر است.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای بارگذاری داخلی ابیات';
    return {
      success: false,
      couplets: [],
      error: message,
    };
  }
}
