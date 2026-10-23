import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, ChevronRight, ChevronLeft, BookOpen, AlertCircle, Type, Sparkles, HelpCircle, Download, CheckCircle2 } from 'lucide-react';
import { ChapterSection } from '../data/chapterSections';
import { Chapter } from '../data/chapters';
import { getSectionVerses, Couplet } from '../services/verseService';
import { toPersianDigits } from '../utils/persianNumbers';
import { getSectionReadingLog, subscribeToReadingLogs, ReadingLogEntry } from '../services/readingLogService';

interface SectionReaderModalProps {
  section: ChapterSection | null;
  chapter: Chapter | null;
  onClose: () => void;
  onNavigateSection: (direction: 'next' | 'prev') => void;
  hasPrevSection: boolean;
  hasNextSection: boolean;
  onOpenDownload: (chapterId: number, sectionNumber: number) => void;
  onOpenMarkAsRead: (chapterId: number, sectionNumber: number, sectionTitle: string, openingVerse?: string) => void;
}

export const SectionReaderModal: React.FC<SectionReaderModalProps> = ({
  section,
  chapter,
  onClose,
  onNavigateSection,
  hasPrevSection,
  hasNextSection,
  onOpenDownload,
  onOpenMarkAsRead,
}) => {
  const [couplets, setCouplets] = useState<Couplet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [readingLog, setReadingLog] = useState<ReadingLogEntry | undefined>(() =>
    section && chapter ? getSectionReadingLog(chapter.id, section.sectionNumber) : undefined
  );

  useEffect(() => {
    if (section && chapter) {
      setReadingLog(getSectionReadingLog(chapter.id, section.sectionNumber));
    }
    const unsubscribe = subscribeToReadingLogs(() => {
      if (section && chapter) {
        setReadingLog(getSectionReadingLog(chapter.id, section.sectionNumber));
      }
    });
    return unsubscribe;
  }, [section, chapter]);

  useEffect(() => {
    let isMounted = true;
    if (!section || !chapter) return;

    // Load instantly from local storage
    setLoading(true);
    setError(null);

    getSectionVerses(chapter.id, section.sectionNumber).then((result) => {
      if (!isMounted) return;
      setLoading(false);
      if (result.success && result.couplets.length > 0) {
        setCouplets(result.couplets);
      } else {
        setError(result.error || 'ابیات این بخش یافت نشد.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [section, chapter]);

  // Handle escape & arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasPrevSection) onNavigateSection('prev');
      if (e.key === 'ArrowLeft' && hasNextSection) onNavigateSection('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigateSection, hasPrevSection, hasNextSection]);

  if (!section || !chapter) return null;

  const handleCopyAll = () => {
    if (couplets.length === 0) return;
    const text = couplets.map((c, i) => `${i + 1}. ${c.m1} / ${c.m2}`).join('\n') +
      `\n\n— شاهنامه فردوسی، ${chapter.title}، بخش ${section.sectionNumber}: ${section.title}\nمنبع: ${section.ganjoorUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyCouplet = (c: Couplet, idx: number) => {
    const text = `« ${c.m1} / ${c.m2} »\n— شاهنامه فردوسی (${chapter.shortName} - بخش ${toPersianDigits(section.sectionNumber)})`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const fontSizes = {
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  };

  const hasAnySummaries = couplets.some((c) => Boolean(c.summary));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-4xl bg-[#090d16] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/40 bg-[#0e1424]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateSection('prev')}
              disabled={!hasPrevSection}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
              title="بخش قبلی"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">بخش پیشین</span>
            </button>

            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold whitespace-nowrap">
              بخش {toPersianDigits(section.sectionNumber)}
            </span>

            <button
              onClick={() => onNavigateSection('next')}
              disabled={!hasNextSection}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
              title="بخش بعدی"
            >
              <span className="hidden sm:inline">بخش بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark as read button */}
            <button
              onClick={() => onOpenMarkAsRead(chapter.id, section.sectionNumber, section.title, section.openingVerse)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                readingLog
                  ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
              }`}
              title={readingLog ? `مشاهده تاریخچه مطالعه و ثبت دور جدید (آخرین: نوبت ${toPersianDigits(readingLog.iteration)})` : 'ثبت این بخش به عنوان مطالعه شد'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${readingLog ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>
                {readingLog
                  ? (readingLog.totalReads || 1) > 1
                    ? `${toPersianDigits(readingLog.totalReads)} بار مطالعه شد ✓`
                    : 'مطالعه شد ✓'
                  : 'مطالعه شد'}
              </span>
            </button>

            {/* Toggle Meaning / Summary if available */}
            {hasAnySummaries && (
              <button
                onClick={() => setShowMeaning(!showMeaning)}
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                  showMeaning
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="نمایش یا عدم نمایش شرح و معنی روان ابیات"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showMeaning ? 'پنهان‌سازی معنی' : 'نمایش معنی'}</span>
              </button>
            )}

            {/* Font size control */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <Type className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                کوچک
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                متوسط
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                بزرگ
              </button>
            </div>

            {/* Copy All Verses */}
            {couplets.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-200 transition-all flex items-center gap-1.5"
                title="کپی متن کامل ابیات این بخش"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span className="hidden md:inline">{copiedAll ? 'کپی شد' : 'کپی کل ابیات'}</span>
              </button>
            )}

            {/* Direct Ganjoor Link */}
            <a
              href={section.ganjoorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all"
              title="مشاهده مستقیم این بخش در گنجور"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reading Note Banner if marked */}
        {readingLog && (
          <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-950/50 via-emerald-950/30 to-slate-900/40 border-b border-emerald-900/50 text-xs text-emerald-300 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                (readingLog.totalReads || 1) > 1
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {(readingLog.totalReads || 1) > 1
                  ? `${toPersianDigits(readingLog.totalReads)} بار مطالعه شده (آخرین: نوبت ${toPersianDigits(readingLog.iteration)})`
                  : `نوبت ۱ مطالعه شده`}
              </span>
              <span className="text-slate-200 line-clamp-1">
                {readingLog.note}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                ({readingLog.displayDate})
              </span>
            </div>
            <button
              onClick={() => onOpenMarkAsRead(chapter.id, section.sectionNumber, section.title, section.openingVerse)}
              className="text-[11px] text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer flex-shrink-0"
            >
              مدیریت نوبت‌ها و ثبت دور جدید ←
            </button>
          </div>
        )}

        {/* Section Heading & Subtitle */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/30 via-slate-900/50 to-amber-950/20 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-amber-400/80 mb-1 flex items-center gap-2">
              <span>{chapter.title}</span>
              <span>•</span>
              <span>بخش {toPersianDigits(section.sectionNumber)}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-amber-100">
              {section.title}
            </h2>
            <p className="font-poetry text-amber-300/80 text-sm sm:text-base mt-2">
              مصراع آغازین: « {section.openingVerse} »
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>پایگاه داده داخلی (بارگذاری آنی)</span>
          </div>
        </div>

        {/* Main Verses Reader Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-4">
          {error && couplets.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
              <h3 className="text-base font-bold text-slate-200">
                {error}
              </h3>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-900/40 max-w-lg mx-auto font-poetry text-amber-200 text-lg">
                « {section.openingVerse} »
              </div>
              <a
                href={section.ganjoorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>مشاهده متن کامل این بخش در گنجور</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <span>تعداد کل ابیات این بخش: <strong className="text-amber-300 font-bold">{toPersianDigits(couplets.length)}</strong> بیت</span>
                <span className="text-[11px] text-slate-500">برای کپی هر بیت، بر روی آن کلیک کنید</span>
              </div>

              {couplets.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyCouplet(c, idx)}
                  className="group relative p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#0c121e] via-[#0f1728] to-[#0c121e] hover:bg-[#152037] border border-slate-800/80 hover:border-amber-500/40 transition-all font-poetry cursor-pointer shadow-sm"
                >
                  <div className={`flex flex-col sm:flex-row items-center justify-between text-center gap-2 sm:gap-6 ${fontSizes[fontSize]} text-amber-100/95`}>
                    <div className="w-full sm:w-1/2 text-center sm:text-right">
                      « {c.m1} »
                    </div>
                    <div className="w-full sm:w-1/2 text-center sm:text-left">
                      « {c.m2} »
                    </div>
                  </div>

                  {/* Optional meaning/summary if available and toggled on */}
                  {showMeaning && c.summary && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 font-sans text-xs text-amber-200/70 leading-relaxed text-right">
                      <span className="text-amber-400 font-semibold ml-1">معنی روان:</span>
                      {c.summary}
                    </div>
                  )}

                  {/* Couplet number badge */}
                  <div className="absolute top-2 right-2 text-[10px] text-slate-500 group-hover:text-amber-400 font-sans">
                    بیت {toPersianDigits(idx + 1)}
                  </div>

                  {/* Copy status icon */}
                  <div className="absolute top-2 left-2 p-1 rounded bg-slate-900/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-amber-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0e1424] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-amber-400 font-semibold">ذخیره‌سازی دائمی در برنامه</span>
            <span>•</span>
            <span>بدون نیاز به اینترنت یا لود شدن از سایت</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark as read button */}
            <button
              onClick={() => onOpenMarkAsRead(chapter.id, section.sectionNumber, section.title, section.openingVerse)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md ${
                readingLog
                  ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300'
              }`}
              title={readingLog ? `شرح مطالعه: ${readingLog.note}` : 'ثبت این بخش به عنوان مطالعه شد'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${readingLog ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{readingLog ? 'مطالعه شد ✓' : 'علامت مطالعه شد'}</span>
            </button>

            <button
              onClick={() => onOpenDownload(chapter.id, section.sectionNumber)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 hover:border-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              title="دانلود فایل این بخش در قالب Word یا PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>دانلود مستقیم بخش</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              بستن
            </button>
            <a
              href={section.ganjoorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>گنجور</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
