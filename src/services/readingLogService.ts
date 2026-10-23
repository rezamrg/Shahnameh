/**
 * Service for tracking reading logs and multiple reading sessions per section in Shahnameh.
 * Allows users to specify which reading iteration it is (چندمین مطالعه) and write short notes for each.
 * Persists in localStorage with reactive event notifications.
 */
import { toPersianDigits } from '../utils/persianNumbers';

export interface ReadingSession {
  id: string; // Unique session identifier
  iteration: number; // چندمین مطالعه (1, 2, 3...)
  readAt: string; // ISO timestamp
  displayDate: string; // Persian formatted date & time
  note: string; // Short note (e.g. روز یا زمان مطالعه، احساس یا بازخوانی)
}

export interface SectionReadingLog {
  chapterId: number;
  sectionNumber: number;
  sessions: ReadingSession[]; // All reading sessions for this section
}

// Backward-compatible type for existing consumers
export interface ReadingLogEntry extends ReadingSession {
  chapterId: number;
  sectionNumber: number;
  totalReads: number;
}

const STORAGE_KEY_V2 = 'shahnameh_reading_logs_v2';
const STORAGE_KEY_V1 = 'shahnameh_reading_logs_v1';
const EVENT_NAME = 'shahnameh_reading_logs_updated';

// Format current date into clean Persian date string
export function getPersianNowString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    const d = new Date();
    return `${d.toLocaleDateString('fa-IR')} ساعت ${toPersianDigits(d.getHours())}:${toPersianDigits(d.getMinutes().toString().padStart(2, '0'))}`;
  }
}

/**
 * Returns human-friendly Persian ordinal title for reading iteration
 */
export function getIterationLabel(iteration: number): string {
  const ordinals: Record<number, string> = {
    1: 'مطالعه اول (نوبت ۱)',
    2: 'مطالعه دوم (نوبت ۲)',
    3: 'مطالعه سوم (نوبت ۳)',
    4: 'مطالعه چهارم (نوبت ۴)',
    5: 'مطالعه پنجم (نوبت ۵)',
    6: 'مطالعه ششم (نوبت ۶)',
    7: 'مطالعه هفتم (نوبت ۷)',
    8: 'مطالعه هشتم (نوبت ۸)',
    9: 'مطالعه نهم (نوبت ۹)',
    10: 'مطالعه دهم (نوبت ۱۰)',
  };
  return ordinals[iteration] || `مطالعه نوبت ${toPersianDigits(iteration)}`;
}

export function getIterationShortLabel(iteration: number): string {
  return `نوبت ${toPersianDigits(iteration)}`;
}

export function getSectionKey(chapterId: number, sectionNumber: number): string {
  return `${chapterId}_${sectionNumber}`;
}

// Load logs and migrate older v1 format if needed
export function getAllSectionLogs(): Record<string, SectionReadingLog> {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      return JSON.parse(rawV2);
    }

    // Attempt migration from v1
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1);
      const migrated: Record<string, SectionReadingLog> = {};

      for (const [key, oldEntry] of Object.entries(parsedV1 as Record<string, any>)) {
        if (!oldEntry) continue;
        const [chapStr, secStr] = key.split('_');
        const chapterId = oldEntry.chapterId || Number(chapStr) || 1;
        const sectionNumber = oldEntry.sectionNumber || Number(secStr) || 1;

        migrated[key] = {
          chapterId,
          sectionNumber,
          sessions: [
            {
              id: `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              iteration: 1,
              readAt: oldEntry.readAt || new Date().toISOString(),
              displayDate: oldEntry.displayDate || getPersianNowString(),
              note: oldEntry.note || 'نوبت نخست مطالعه',
            },
          ],
        };
      }

      try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
      } catch (e) {
        console.error('Failed to save migrated reading logs:', e);
      }

      return migrated;
    }

    return {};
  } catch (e) {
    console.error('Error loading reading logs:', e);
    return {};
  }
}

function persistLogs(logs: Record<string, SectionReadingLog>, detailKey?: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(logs));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { key: detailKey, timestamp: Date.now() },
      })
    );
  } catch (e) {
    console.error('Error persisting reading logs:', e);
  }
}

/**
 * Get section reading log container
 */
export function getSectionReadingLog(chapterId: number, sectionNumber: number): ReadingLogEntry | undefined {
  const logs = getAllSectionLogs();
  const sec = logs[getSectionKey(chapterId, sectionNumber)];
  if (!sec || !sec.sessions || sec.sessions.length === 0) return undefined;

  // Sort sessions: descending by iteration/time
  const sorted = [...sec.sessions].sort((a, b) => b.iteration - a.iteration || b.readAt.localeCompare(a.readAt));
  const latest = sorted[0];

  return {
    ...latest,
    chapterId,
    sectionNumber,
    totalReads: sec.sessions.length,
  };
}

/**
 * Get all reading sessions for a section sorted by iteration
 */
export function getSectionSessions(chapterId: number, sectionNumber: number): ReadingSession[] {
  const logs = getAllSectionLogs();
  const sec = logs[getSectionKey(chapterId, sectionNumber)];
  if (!sec || !sec.sessions) return [];
  return [...sec.sessions].sort((a, b) => a.iteration - b.iteration || a.readAt.localeCompare(b.readAt));
}

/**
 * Count how many times this section was read
 */
export function getSectionReadCount(chapterId: number, sectionNumber: number): number {
  const logs = getAllSectionLogs();
  const sec = logs[getSectionKey(chapterId, sectionNumber)];
  return sec?.sessions?.length || 0;
}

export function isSectionRead(chapterId: number, sectionNumber: number): boolean {
  return getSectionReadCount(chapterId, sectionNumber) > 0;
}

/**
 * Determine recommended next iteration number
 */
export function getNextIterationNumber(chapterId: number, sectionNumber: number): number {
  const sessions = getSectionSessions(chapterId, sectionNumber);
  if (sessions.length === 0) return 1;
  const maxIteration = Math.max(...sessions.map((s) => s.iteration || 1));
  return maxIteration + 1;
}

/**
 * Add a new reading session for a section
 */
export function addReadingSession(
  chapterId: number,
  sectionNumber: number,
  data: {
    iteration?: number;
    note: string;
    customDisplayDate?: string;
  }
): ReadingSession {
  const logs = getAllSectionLogs();
  const key = getSectionKey(chapterId, sectionNumber);

  if (!logs[key]) {
    logs[key] = {
      chapterId,
      sectionNumber,
      sessions: [],
    };
  }

  const iteration = data.iteration && data.iteration > 0
    ? data.iteration
    : getNextIterationNumber(chapterId, sectionNumber);

  const displayDate = data.customDisplayDate || getPersianNowString();
  const defaultNote = `مطالعه نوبت ${toPersianDigits(iteration)} در ${displayDate}`;

  const newSession: ReadingSession = {
    id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    iteration,
    readAt: new Date().toISOString(),
    displayDate,
    note: data.note.trim() || defaultNote,
  };

  logs[key].sessions.push(newSession);
  persistLogs(logs, key);

  return newSession;
}

/**
 * Update an existing reading session
 */
export function updateReadingSession(
  chapterId: number,
  sectionNumber: number,
  sessionId: string,
  updates: {
    iteration?: number;
    note?: string;
    customDisplayDate?: string;
  }
): ReadingSession | null {
  const logs = getAllSectionLogs();
  const key = getSectionKey(chapterId, sectionNumber);
  const sec = logs[key];
  if (!sec) return null;

  const session = sec.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  if (updates.iteration !== undefined && updates.iteration > 0) {
    session.iteration = updates.iteration;
  }
  if (updates.note !== undefined) {
    session.note = updates.note.trim() || session.note;
  }
  if (updates.customDisplayDate) {
    session.displayDate = updates.customDisplayDate;
  }

  persistLogs(logs, key);
  return session;
}

/**
 * Delete a specific reading session
 */
export function deleteReadingSession(chapterId: number, sectionNumber: number, sessionId: string): boolean {
  const logs = getAllSectionLogs();
  const key = getSectionKey(chapterId, sectionNumber);
  const sec = logs[key];
  if (!sec) return false;

  const initialLen = sec.sessions.length;
  sec.sessions = sec.sessions.filter((s) => s.id !== sessionId);

  if (sec.sessions.length === 0) {
    delete logs[key];
  }

  persistLogs(logs, key);
  return sec.sessions.length < initialLen;
}

/**
 * Remove all reading records for a section
 */
export function clearAllSectionSessions(chapterId: number, sectionNumber: number): void {
  const logs = getAllSectionLogs();
  const key = getSectionKey(chapterId, sectionNumber);
  if (logs[key]) {
    delete logs[key];
    persistLogs(logs, key);
  }
}

// Deprecated alias for single-save compatibility
export function saveReadingLog(
  chapterId: number,
  sectionNumber: number,
  note: string,
  customDisplayDate?: string,
  iteration?: number
): ReadingLogEntry {
  const session = addReadingSession(chapterId, sectionNumber, {
    iteration,
    note,
    customDisplayDate,
  });
  return {
    ...session,
    chapterId,
    sectionNumber,
    totalReads: getSectionReadCount(chapterId, sectionNumber),
  };
}

// Deprecated alias for remove
export function removeReadingLog(chapterId: number, sectionNumber: number): void {
  clearAllSectionSessions(chapterId, sectionNumber);
}

/**
 * Returns a dictionary of latest reading per section for backwards-compatibility
 */
export function getReadingLogs(): Record<string, ReadingLogEntry> {
  const logs = getAllSectionLogs();
  const result: Record<string, ReadingLogEntry> = {};

  for (const [key, sec] of Object.entries(logs)) {
    if (!sec || !sec.sessions || sec.sessions.length === 0) continue;
    const sorted = [...sec.sessions].sort((a, b) => b.iteration - a.iteration || b.readAt.localeCompare(a.readAt));
    const latest = sorted[0];
    result[key] = {
      ...latest,
      chapterId: sec.chapterId,
      sectionNumber: sec.sectionNumber,
      totalReads: sec.sessions.length,
    };
  }

  return result;
}

/**
 * Total unique sections read across the entire Shahnameh
 */
export function getTotalReadCount(): number {
  const logs = getAllSectionLogs();
  return Object.values(logs).filter((sec) => sec.sessions && sec.sessions.length > 0).length;
}

/**
 * Total count of all reading sessions (including repeats)
 */
export function getTotalReadingSessionsCount(): number {
  const logs = getAllSectionLogs();
  return Object.values(logs).reduce((acc, sec) => acc + (sec.sessions?.length || 0), 0);
}

/**
 * Total unique sections read in a specific chapter
 */
export function getChapterReadCount(chapterId: number): number {
  const logs = getAllSectionLogs();
  const prefix = `${chapterId}_`;
  return Object.entries(logs).filter(([k, sec]) => k.startsWith(prefix) && sec.sessions && sec.sessions.length > 0).length;
}

/**
 * Total reading sessions completed in a specific chapter
 */
export function getChapterTotalSessionsCount(chapterId: number): number {
  const logs = getAllSectionLogs();
  const prefix = `${chapterId}_`;
  return Object.entries(logs)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((acc, [, sec]) => acc + (sec.sessions?.length || 0), 0);
}

/**
 * Subscribe to changes in reading logs
 */
export function subscribeToReadingLogs(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
