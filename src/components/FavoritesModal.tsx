import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bookmark,
  BookOpen,
  Trash2,
  ExternalLink,
  ChevronLeft,
  Download,
  Upload,
  Database,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Chapter, SHAHNAMEH_CHAPTERS } from '../data/chapters';
import { toPersianDigits } from '../utils/persianNumbers';
import {
  getStorageStatus,
  exportUserDataBackup,
  importUserDataBackup,
  clearAllUserData,
  StorageStatus,
} from '../services/userDataService';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteChapters: Chapter[];
  onRemoveFavorite: (id: number) => void;
  onSelectChapter: (chapter: Chapter) => void;
  userNotes: Record<number, string>;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favoriteChapters,
  onRemoveFavorite,
  onSelectChapter,
  userNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'notes' | 'storage'>('favorites');
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(() => getStorageStatus());
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmWipeAll, setConfirmWipeAll] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStorage = () => {
    setStorageStatus(getStorageStatus());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorage();
      setImportFeedback(null);
      setConfirmWipeAll(false);
    }
  }, [isOpen, favoriteChapters, userNotes]);

  if (!isOpen) return null;

  const notesChapterEntries = Object.entries(userNotes)
    .filter(([, note]) => typeof note === 'string' && note.trim().length > 0)
    .map(([chapterIdStr, note]) => {
      const chapterId = Number(chapterIdStr);
      const chapter = SHAHNAMEH_CHAPTERS.find((c) => c.id === chapterId);
      return { chapterId, chapter, note };
    });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importUserDataBackup(content);
        setImportFeedback(result);
        refreshStorage();
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWipeAll = () => {
    clearAllUserData();
    setConfirmWipeAll(false);
    refreshStorage();
    setImportFeedback({
      success: true,
      message: 'کلیه یادداشت‌ها، نشان‌ها و اطلاعات مطالعه با موفقیت پاکسازی شدند.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0c121e] border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0f1726] flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400 fill-current" />
              <h3 className="text-base sm:text-lg font-bold text-amber-100">
                مرکز داده‌ها، یادداشت‌ها و نشان‌های کاربری
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>فصول نشان‌شده</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {toPersianDigits(favoriteChapters.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>یادداشت‌های فصول</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {toPersianDigits(notesChapterEntries.length)}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('storage');
                refreshStorage();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'storage'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>پشتیبان‌گیری و سلامت ذخیره‌سازی</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 text-right">
          {/* TAB 1: FAVORITES */}
          {activeTab === 'favorites' && (
            <div>
              {favoriteChapters.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">هیچ فصلی نشان نشده است.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    هیچ داده پیش‌فرضی قرار داده نشده است. با زدن علامت نشان (Bookmark) در هر یک از ۶۱ فصل شاهنامه، می‌توانید فصل‌های دلخواه خود را در این بخش قرار دهید.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteChapters.map((chapter) => {
                    const note = userNotes[chapter.id];
                    return (
                      <div
                        key={chapter.id}
                        className="p-4 rounded-xl bg-[#121929] border border-slate-800 hover:border-amber-600/40 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {toPersianDigits(chapter.chapterNumber)}
                            </span>
                            <h4
                              onClick={() => {
                                onClose();
                                onSelectChapter(chapter);
                              }}
                              className="text-sm sm:text-base font-bold text-slate-100 hover:text-amber-300 cursor-pointer transition-colors"
                            >
                              {chapter.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => onRemoveFavorite(chapter.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                              title="حذف از نشان‌شده‌ها"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                onClose();
                                onSelectChapter(chapter);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-slate-950 transition-colors flex items-center gap-1 font-semibold"
                            >
                              <span>مطالعه</span>
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {note && (
                          <div className="text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-amber-200/90 leading-relaxed font-sans">
                            <span className="text-slate-500 font-bold ml-1">یادداشت شما:</span>
                            {note}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{chapter.eraFull} • {chapter.dynasty}</span>
                          <a
                            href={chapter.ganjoorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>لینک در گنجور</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER NOTES */}
          {activeTab === 'notes' && (
            <div>
              {notesChapterEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Edit3 className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">هیچ یادداشت کاربری ثبت نشده است.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    نرم‌افزار فاقد هرگونه یادداشت پیش‌فرض است. با ورود به جزئیات هر فصل و رفتن به تب «یادداشت»، می‌توانید نکات و تحلیل‌های اختصاصی خود را یادداشت و ذخیره نمایید.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notesChapterEntries.map(({ chapterId, chapter, note }) => (
                    <div
                      key={chapterId}
                      className="p-4 rounded-xl bg-[#121929] border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                            {toPersianDigits(chapter?.chapterNumber || chapterId)}
                          </span>
                          <h4 className="text-sm font-bold text-amber-100">
                            {chapter?.title || `فصل ${toPersianDigits(chapterId)}`}
                          </h4>
                        </div>

                        {chapter && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectChapter(chapter);
                            }}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold hover:underline"
                          >
                            <span>مشاهده فصل و ویرایش</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                        {note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STORAGE STATUS & BACKUP */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Storage Health Card */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>وضعیت و امنیت ذخیره‌سازی داده‌های شما: پایدار و فعال</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تمامی داده‌ها و یادداشت‌های شما در حافظه اختصاصی و دائم مرورگر دستگاه شما (<code className="text-amber-300 font-mono">LocalStorage</code>) با کلیدهای امن و ایزوله نگهداری می‌شوند و با بستن مرورگر یا رفرش صفحه از بین نمی‌روند.
                </p>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">یادداشت‌های فصول</span>
                  <strong className="text-base text-amber-300 font-bold">
                    {toPersianDigits(storageStatus.notesCount)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">فصول نشان‌شده</span>
                  <strong className="text-base text-amber-300 font-bold">
                    {toPersianDigits(storageStatus.favoritesCount)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">بخش‌های مطالعه‌شده</span>
                  <strong className="text-base text-emerald-400 font-bold">
                    {toPersianDigits(storageStatus.readSectionsCount)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">کل نوبت‌های مطالعه</span>
                  <strong className="text-base text-emerald-400 font-bold">
                    {toPersianDigits(storageStatus.readingSessionsCount)}
                  </strong>
                </div>
              </div>

              {/* Feedback Alert if any */}
              {importFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    importFeedback.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{importFeedback.message}</span>
                </div>
              )}

              {/* Backup & Restore Action Buttons */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>پشتیبان‌گیری، بازیابی و انتقال داده‌ها به دستگاه دیگر:</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  می‌توانید در هر زمان یک فایل پشتیبان JSON از کلیه یادداشت‌ها و نوبت‌های مطالعه خود دریافت کنید و در آینده یا روی مرورگر و دستگاهی دیگر آن را بازیابی نمایید.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={exportUserDataBackup}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود نسخه پشتیبان (JSON)</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>بازیابی از فایل پشتیبان</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Data wipe option with confirmation */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  اطمینان از عدم وجود هرگونه داده پیش‌فرض
                </span>

                {confirmWipeAll ? (
                  <div className="flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800 text-xs text-rose-300">
                    <span>همه اطلاعات پاک شود؟</span>
                    <button
                      onClick={handleWipeAll}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-500"
                    >
                      بله، پاکسازی
                    </button>
                    <button
                      onClick={() => setConfirmWipeAll(false)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      خیر
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmWipeAll(true)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>پاکسازی کامل همه اطلاعات ثبت‌شده</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
