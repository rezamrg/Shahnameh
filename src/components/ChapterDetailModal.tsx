import React, { useState, useEffect } from 'react';
import { X, Bookmark, ExternalLink, ChevronRight, ChevronLeft, Copy, Check, User, BookOpen, Edit3, Save, Sparkles, Layers, Search, ArrowLeft, Download, CheckCircle2, Trash2 } from 'lucide-react';
import { Chapter } from '../data/chapters';
import { ChapterSection } from '../data/chapterSections';
import { preloadChapterVerses } from '../services/verseService';
import { toPersianDigits } from '../utils/persianNumbers';
import { getReadingLogs, subscribeToReadingLogs, ReadingLogEntry } from '../services/readingLogService';

interface ChapterDetailModalProps {
  chapter: Chapter | null;
  onClose: () => void;
  onNavigateChapter: (direction: 'next' | 'prev') => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  userNotes: Record<number, string>;
  onSaveNote: (chapterId: number, note: string) => void;
  onSelectSection: (section: ChapterSection) => void;
  onOpenDownload: (chapterId: number, sectionNumber?: number) => void;
  onOpenMarkAsRead: (chapterId: number, sectionNumber: number, sectionTitle: string, openingVerse?: string) => void;
}

export const ChapterDetailModal: React.FC<ChapterDetailModalProps> = ({
  chapter,
  onClose,
  onNavigateChapter,
  isFavorite,
  onToggleFavorite,
  userNotes,
  onSaveNote,
  onSelectSection,
  onOpenDownload,
  onOpenMarkAsRead,
}) => {
  const [activeTab, setActiveTab] = useState<'sections' | 'summary' | 'notes'>('sections');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<boolean>(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);
  const [sectionFilterQuery, setSectionFilterQuery] = useState<string>('');
  const [readingLogs, setReadingLogs] = useState<Record<string, ReadingLogEntry>>(() => getReadingLogs());

  useEffect(() => {
    setReadingLogs(getReadingLogs());
    const unsubscribe = subscribeToReadingLogs(() => {
      setReadingLogs(getReadingLogs());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (chapter) {
      setCurrentNote(userNotes[chapter.id] || '');
      setIsEditingNote(false);
      setSectionFilterQuery('');
      setActiveTab('sections');
      preloadChapterVerses(chapter.id);
    }
  }, [chapter?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigateChapter('prev'); // RTL: Right is previous
      if (e.key === 'ArrowLeft') onNavigateChapter('next');  // RTL: Left is next
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigateChapter]);

  if (!chapter) return null;

  const handleCopyVerse = (m1: string, m2: string, idx: number) => {
    const text = `${m1} / ${m2}\n— شاهنامه فردوسی (${chapter.title})`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveCurrentNote = () => {
    onSaveNote(chapter.id, currentNote);
    setIsEditingNote(false);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const eraColor = {
    'اساطیری': 'from-purple-900/30 border-purple-500/40 text-purple-300',
    'پهلوانی': 'from-amber-900/30 border-amber-500/40 text-amber-300',
    'تاریخی': 'from-emerald-900/30 border-emerald-500/40 text-emerald-300',
  }[chapter.era];

  const sections = chapter.sections || [];
  const filteredSections = sections.filter((s) => {
    if (!sectionFilterQuery.trim()) return true;
    const q = sectionFilterQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) ||
           s.openingVerse.toLowerCase().includes(q) ||
           String(s.sectionNumber).includes(q) ||
           toPersianDigits(s.sectionNumber).includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-3xl my-8 bg-[#0b101b] border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0e1424]">
          {/* Previous / Next Chapter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateChapter('prev')}
              disabled={chapter.chapterNumber <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
              title="فصل قبلی"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">فصل پیشین</span>
            </button>

            <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
              فصل {toPersianDigits(chapter.chapterNumber)} از ۶۱
            </span>

            <button
              onClick={() => onNavigateChapter('next')}
              disabled={chapter.chapterNumber >= 61}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
              title="فصل بعدی"
            >
              <span className="hidden sm:inline">فصل بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Close & Bookmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(chapter.id)}
              className={`p-2 rounded-lg border transition-all ${
                isFavorite
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
              }`}
              title={isFavorite ? 'حذف از نشان‌شده‌ها' : 'نشان کردن این فصل'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chapter Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-[#0e1424] border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${eraColor}`}>
              {chapter.eraFull}
            </span>
            <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
              {chapter.dynasty}
            </span>
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{toPersianDigits(sections.length)} بخش در گنجور</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-100 leading-snug">
            {chapter.title}
          </h2>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sections'
                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-200 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>فهرست بخش‌ها ({toPersianDigits(sections.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>خلاصه و شاه‌بیت‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-200 border border-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>یادداشت‌ها</span>
            </button>
          </div>
        </div>

        {/* Modal Body Based on Active Tab */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200 flex-1">
          {activeTab === 'sections' ? (
            <div className="space-y-4">
              {/* Search inside sections */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={sectionFilterQuery}
                    onChange={(e) => setSectionFilterQuery(e.target.value)}
                    placeholder="جستجو در بخش‌ها و مصراع‌های آغازین این فصل..."
                    className="w-full pl-4 pr-10 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {sectionFilterQuery && (
                    <button
                      onClick={() => setSectionFilterQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 self-center">
                  {/* Chapter reading progress */}
                  {(() => {
                    const chapterReadCount = sections.filter((s) => Boolean(readingLogs[`${chapter.id}_${s.sectionNumber}`])).length;
                    const percent = sections.length > 0 ? Math.round((chapterReadCount / sections.length) * 100) : 0;
                    return (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">مطالعه‌شده:</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          chapterReadCount > 0
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {toPersianDigits(chapterReadCount)} از {toPersianDigits(sections.length)} ({toPersianDigits(percent)}٪)
                        </span>
                      </div>
                    );
                  })()}

                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    <span>نمایش </span>
                    <strong className="text-amber-300 font-bold">{toPersianDigits(filteredSections.length)}</strong>
                    <span> بخش</span>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-2.5">
                {filteredSections.map((sec) => {
                  const logKey = `${chapter.id}_${sec.sectionNumber}`;
                  const readLog = readingLogs[logKey];
                  const isRead = Boolean(readLog);

                  return (
                    <div
                      key={sec.sectionNumber}
                      className={`group p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isRead
                          ? 'bg-[#0f1922] border-emerald-800/40 hover:border-emerald-500/60'
                          : 'bg-[#101625] hover:bg-[#141d30] border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5 ${
                          isRead
                            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 border-amber-600/30 text-amber-300'
                        }`}>
                          {toPersianDigits(sec.sectionNumber)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => onSelectSection(sec)}
                              className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-amber-300 cursor-pointer transition-colors"
                            >
                              بخش {toPersianDigits(sec.sectionNumber)}: {sec.title}
                            </h4>

                            {isRead && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                (readLog?.totalReads || 1) > 1
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                <Check className="w-2.5 h-2.5" />
                                <span>
                                  {(readLog?.totalReads || 1) > 1
                                    ? `${toPersianDigits(readLog!.totalReads)} بار مطالعه شد`
                                    : 'مطالعه شد'}
                                </span>
                              </span>
                            )}
                          </div>

                          <p className="font-poetry text-amber-200/80 text-xs sm:text-sm mt-1 line-clamp-1">
                            مصراع آغازین: « {sec.openingVerse} »
                          </p>

                          {/* Reading note preview if available */}
                          {isRead && readLog?.note && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMarkAsRead(chapter.id, sec.sectionNumber, sec.title, sec.openingVerse);
                              }}
                              className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300/90 cursor-pointer hover:bg-emerald-900/40 transition-colors"
                              title="کلیک برای مشاهده تاریخچه، افزودن نوبت یا ویرایش یادداشت"
                            >
                              <span className="text-emerald-400 font-bold whitespace-nowrap">
                                آخرین نوبت (نوبت {toPersianDigits(readLog.iteration)}):
                              </span>
                              <span className="line-clamp-1">{readLog.note}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {/* "مطالعه شد" Layer Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMarkAsRead(chapter.id, sec.sectionNumber, sec.title, sec.openingVerse);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isRead
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-950/50'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                          }`}
                          title={isRead ? `مشاهده تاریخچه و ثبت نوبت مطالعه جدید` : 'ثبت به عنوان مطالعه شد و ثبت زمان/شرح'}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isRead ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>
                            {isRead
                              ? (readLog?.totalReads || 1) > 1
                                ? `${toPersianDigits(readLog!.totalReads)} نوبت مطالعه ✓`
                                : 'مطالعه شد ✓'
                              : 'مطالعه شد'}
                          </span>
                        </button>

                        {/* Download Section button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDownload(chapter.id, sec.sectionNumber);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                          title="دانلود فایل این بخش (Word / PDF / TXT)"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Direct Ganjoor Section link */}
                        <a
                          href={sec.ganjoorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-amber-300 bg-slate-900/80 border border-slate-800 flex items-center gap-1 transition-colors"
                          title="مشاهده مستقیم این بخش در گنجور"
                        >
                          <ExternalLink className="w-3 h-3 text-amber-500/80" />
                          <span className="hidden md:inline">گنجور</span>
                        </a>

                        {/* Read Section Verses */}
                        <button
                          onClick={() => onSelectSection(sec)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>متن ابیات</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="space-y-6">
              {/* Story Summary */}
              <div className="bg-[#121828] p-4 sm:p-5 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-amber-400/90 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>خلاصه و زمینه داستانی فصل:</span>
                </h4>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {chapter.summary}
                </p>
              </div>

              {/* Key Figures */}
              {chapter.keyFigures.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>شخصیت‌ها و چهره‌های کلیدی این فصل:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {chapter.keyFigures.map((fig, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-900/90 text-amber-200 border border-slate-800 hover:border-amber-600/40 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {fig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Famous Verses */}
              {chapter.sampleVerses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>شاه‌بیت‌ها و ابیات برگزیده این فصل:</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      جهت کپی روی آیکون کلیک کنید
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {chapter.sampleVerses.map((verse, idx) => (
                      <div
                        key={idx}
                        className="group relative p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-amber-950/10 border border-amber-900/30 hover:border-amber-600/50 transition-all font-poetry"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between text-center gap-2 sm:gap-6 text-sm sm:text-base md:text-lg text-amber-100/95">
                          <div className="w-full sm:w-1/2 text-center sm:text-right">
                            « {verse.mesra1} »
                          </div>
                          <div className="w-full sm:w-1/2 text-center sm:text-left">
                            « {verse.mesra2} »
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyVerse(verse.mesra1, verse.mesra2, idx)}
                          className="absolute top-2 left-2 p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="کپی بیت"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* User Notes Tab */
            <div className="bg-[#0e1524] p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>یادداشت‌های اختصاصی شما برای فعالیت روی این فصل:</span>
                </h4>
                {noteSavedFeedback && (
                  <span className="text-xs text-emerald-400 font-medium animate-pulse">
                    یادداشت با موفقیت ذخیره شد
                  </span>
                )}
              </div>

              {isEditingNote || !currentNote ? (
                <div className="space-y-3">
                  <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="نکات پژوهشی، وظایف، اشعار مد نظر یا تحلیل‌های فعالیت خود را درباره این فصل بنویسید..."
                    rows={6}
                    className="w-full p-3 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {userNotes[chapter.id] && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentNote(userNotes[chapter.id] || '');
                          setIsEditingNote(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 transition-colors"
                      >
                        انصراف
                      </button>
                    )}
                    <button
                      onClick={handleSaveCurrentNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>ذخیره یادداشت</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-900/90 rounded-lg text-xs sm:text-sm text-slate-300 whitespace-pre-wrap border border-slate-800 leading-relaxed font-sans">
                    {currentNote}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش یادداشت</span>
                    </button>

                    {confirmDeleteNote ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800 text-xs text-rose-300">
                        <span>یادداشت حذف شود؟</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentNote('');
                            onSaveNote(chapter.id, '');
                            setConfirmDeleteNote(false);
                            setIsEditingNote(false);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-500 cursor-pointer"
                        >
                          بله
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNote(false)}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                        >
                          خیر
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteNote(true)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        title="حذف این یادداشت"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف یادداشت</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0e1424] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            شامل <span className="text-amber-300 font-bold">{toPersianDigits(sections.length)}</span> بخش بر پایهٔ داده‌های گنجور
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenDownload(chapter.id)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 hover:border-amber-400 shadow-md transition-all cursor-pointer"
              title="دانلود کل ابیات این فصل در قالب فایل Word یا PDF"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>دانلود ابیات فصل (Word / PDF)</span>
            </button>

            <a
              href={chapter.ganjoorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-md shadow-amber-500/20 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>گنجور آنلاین</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

