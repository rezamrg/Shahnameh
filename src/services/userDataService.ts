/**
 * Service for auditing, preserving, exporting, and restoring all user data (Notes, Reading Logs, Favorites).
 * Ensures zero default/mock user data exists and verifies local storage integrity.
 */
import { getAllSectionLogs, SectionReadingLog } from './readingLogService';

export interface UserDataBackup {
  version: number;
  exportedAt: string;
  notes: Record<number, string>;
  favorites: number[];
  readingLogs: Record<string, SectionReadingLog>;
}

export interface StorageStatus {
  isAvailable: boolean;
  notesCount: number;
  favoritesCount: number;
  readingSessionsCount: number;
  readSectionsCount: number;
  approximateSizeBytes: number;
}

const STORAGE_KEYS = {
  NOTES: 'shahnameh_notes',
  FAVORITES: 'shahnameh_favorites',
  READING_LOGS_V2: 'shahnameh_reading_logs_v2',
  READING_LOGS_V1: 'shahnameh_reading_logs_v1',
};

/**
 * Sanitizes legacy mock/default data from localStorage if present.
 * Strictly guarantees that NO default user notes or mock bookmarks persist.
 */
export function sanitizeLegacyMockData(): void {
  try {
    // 1. Sanitize notes
    const rawNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (rawNotes) {
      try {
        const parsed = JSON.parse(rawNotes);
        if (parsed && typeof parsed === 'object') {
          let modified = false;
          const cleaned: Record<number, string> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') {
              const trimmed = v.trim();
              // Remove old hardcoded sample notes
              if (
                trimmed === 'بررسی مدخل و دیباچه شاهنامه برای تحقیق ساختار اثر' ||
                trimmed === 'تحلیل گفتگوهای رستم و اسفندیار در پروژه' ||
                trimmed === ''
              ) {
                modified = true;
                continue;
              }
              cleaned[Number(k)] = trimmed;
            }
          }
          if (modified || Object.keys(cleaned).length !== Object.keys(parsed).length) {
            localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(cleaned));
          }
        }
      } catch (e) {
        console.error('Failed to parse notes during sanitization:', e);
      }
    }

    // 2. Sanitize favorites
    const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (rawFavs) {
      try {
        const parsed = JSON.parse(rawFavs);
        if (Array.isArray(parsed)) {
          // If it matches exactly the old hardcoded sample bookmarks [1, 15, 28, 61], clear it
          const isLegacyMock =
            parsed.length === 4 &&
            parsed.includes(1) &&
            parsed.includes(15) &&
            parsed.includes(28) &&
            parsed.includes(61);
          if (isLegacyMock) {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
          }
        }
      } catch (e) {
        console.error('Failed to parse favorites during sanitization:', e);
      }
    }
  } catch (e) {
    console.warn('LocalStorage not accessible during mock sanitization:', e);
  }
}

/**
 * Check health, availability, and counts of stored user data.
 */
export function getStorageStatus(): StorageStatus {
  let isAvailable = false;
  let approximateSizeBytes = 0;

  try {
    const testKey = '__test_storage_health__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    isAvailable = true;

    // Approximate size
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        approximateSizeBytes += (item.length + key.length) * 2;
      }
    }
  } catch (e) {
    console.error('LocalStorage is not available:', e);
    isAvailable = false;
  }

  // Count notes
  let notesCount = 0;
  try {
    const rawNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (rawNotes) {
      const parsed = JSON.parse(rawNotes);
      notesCount = Object.keys(parsed).length;
    }
  } catch {
    notesCount = 0;
  }

  // Count favorites
  let favoritesCount = 0;
  try {
    const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (rawFavs) {
      const parsed = JSON.parse(rawFavs);
      favoritesCount = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    favoritesCount = 0;
  }

  // Count reading logs & sessions
  const logs = getAllSectionLogs();
  const readSectionsCount = Object.keys(logs).length;
  const readingSessionsCount = Object.values(logs).reduce(
    (acc, sec) => acc + (sec.sessions?.length || 0),
    0
  );

  return {
    isAvailable,
    notesCount,
    favoritesCount,
    readingSessionsCount,
    readSectionsCount,
    approximateSizeBytes,
  };
}

/**
 * Export all user data as a JSON file download.
 */
export function exportUserDataBackup(): void {
  try {
    let notes: Record<number, string> = {};
    let favorites: number[] = [];

    const rawNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (rawNotes) notes = JSON.parse(rawNotes);

    const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (rawFavs) favorites = JSON.parse(rawFavs);

    const readingLogs = getAllSectionLogs();

    const backup: UserDataBackup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      notes,
      favorites,
      readingLogs,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `shahnameh_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Failed to export backup:', e);
    alert('خطا در تهیه نسخه پشتیبان.');
  }
}

/**
 * Import and restore user data from a JSON backup string.
 */
export function importUserDataBackup(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است.' };
    }

    if (parsed.notes && typeof parsed.notes === 'object') {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(parsed.notes));
    }

    if (parsed.favorites && Array.isArray(parsed.favorites)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(parsed.favorites));
    }

    if (parsed.readingLogs && typeof parsed.readingLogs === 'object') {
      localStorage.setItem(STORAGE_KEYS.READING_LOGS_V2, JSON.stringify(parsed.readingLogs));
    }

    // Trigger updates
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('shahnameh_reading_logs_updated'));

    return { success: true, message: 'داده‌ها و یادداشت‌های کاربری با موفقیت بازیابی شدند.' };
  } catch (e) {
    return { success: false, message: 'خطا در خواندن و بازیابی فایل پشتیبان.' };
  }
}

/**
 * Completely wipe all personal user data (notes, reading logs, bookmarks) if explicitly requested.
 */
export function clearAllUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.READING_LOGS_V2);
    localStorage.removeItem(STORAGE_KEYS.READING_LOGS_V1);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('shahnameh_reading_logs_updated'));
  } catch (e) {
    console.error('Error clearing user data:', e);
  }
}
