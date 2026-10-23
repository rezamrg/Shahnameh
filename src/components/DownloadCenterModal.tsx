import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  Filter,
  Check,
  Loader2,
  FileCheck,
  Archive,
  Layers,
  Sparkles,
  FolderArchive,
  FileStack
} from 'lucide-react';
import { SHAHNAMEH_CHAPTERS, ERAS } from '../data/chapters';
import {
  ExportOptions,
  gatherSectionsData,
  generateWordDocument,
  generateTextDocument,
  generateJsonDocument,
  downloadDirectPdf,
  generateZipArchive,
  triggerFileDownload,
  sanitizeFileName,
} from '../utils/exportUtils';
import { toPersianDigits } from '../utils/persianNumbers';

interface DownloadCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChapterId?: number;
  defaultSectionNumber?: number;
}

export const DownloadCenterModal: React.FC<DownloadCenterModalProps> = ({
  isOpen,
  onClose,
  defaultChapterId,
  defaultSectionNumber,
}) => {
  // Mode: 'single-section', 'single-chapter', 'multi-sections', 'multi-chapters', 'all'
  const [downloadMode, setDownloadMode] = useState<
    'all' | 'multi-chapters' | 'multi-sections' | 'single-chapter' | 'single-section'
  >(
    defaultSectionNumber
      ? 'single-section'
      : defaultChapterId
      ? 'single-chapter'
      : 'multi-chapters'
  );

  // Selected chapters (for multi-chapter mode)
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>(() =>
    defaultChapterId ? [defaultChapterId] : [1, 15, 28, 61]
  );

  // Single Chapter selection
  const [singleChapterId, setSingleChapterId] = useState<number>(defaultChapterId || 1);

  // Single Section selection
  const [singleSectionChapterId, setSingleSectionChapterId] = useState<number>(defaultChapterId || 1);
  const [singleSectionNumber, setSingleSectionNumber] = useState<number>(defaultSectionNumber || 1);

  // Multi-section selection: map of "chapterId_sectionNumber"
  const [selectedSectionKeys, setSelectedSectionKeys] = useState<Set<string>>(() => {
    const s = new Set<string>();
    s.add('1_1');
    s.add('1_2');
    s.add('15_1');
    return s;
  });

  // Section picker chapter tab
  const [sectionPickerChapterId, setSectionPickerChapterId] = useState<number>(1);
  const [sectionSearchQuery, setSectionSearchQuery] = useState<string>('');

  // Multi-file bundling option:
  // 'merged': Single unified file
  // 'separate': Separate file for each section/chapter inside a ZIP
  // 'both': Download both merged file AND separate files ZIP
  const [bundleStrategy, setBundleStrategy] = useState<'merged' | 'separate' | 'both'>('merged');

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'word' | 'pdf' | 'txt' | 'json'>('word');
  const [includeMeaning, setIncludeMeaning] = useState<boolean>(true);
  const [includeVerseNumbers, setIncludeVerseNumbers] = useState<boolean>(true);
  const [includeHeaderInfo, setIncludeHeaderInfo] = useState<boolean>(true);
  const [layout, setLayout] = useState<'couplet' | 'single-line'>('couplet');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Quick preset filter for multi-chapter
  const [chapterFilterEra, setChapterFilterEra] = useState<string>('all');

  // Filtered chapters for chapter picker
  const filteredChaptersForPicker = useMemo(() => {
    if (chapterFilterEra === 'all') return SHAHNAMEH_CHAPTERS;
    return SHAHNAMEH_CHAPTERS.filter((c) => c.era === chapterFilterEra);
  }, [chapterFilterEra]);

  if (!isOpen) return null;

  // Toggle chapter selection
  const toggleChapter = (id: number) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllChapters = () => {
    setSelectedChapterIds(SHAHNAMEH_CHAPTERS.map((c) => c.id));
  };

  const deselectAllChapters = () => {
    setSelectedChapterIds([]);
  };

  const selectEraChapters = (era: string) => {
    const ids = SHAHNAMEH_CHAPTERS.filter((c) => c.era === era).map((c) => c.id);
    setSelectedChapterIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  // Toggle section selection
  const toggleSection = (chId: number, secNum: number) => {
    const key = `${chId}_${secNum}`;
    setSelectedSectionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllSectionsOfChapter = (chId: number) => {
    const chapter = SHAHNAMEH_CHAPTERS.find((c) => c.id === chId);
    if (!chapter || !chapter.sections) return;
    setSelectedSectionKeys((prev) => {
      const next = new Set(prev);
      chapter.sections?.forEach((s) => next.add(`${chId}_${s.sectionNumber}`));
      return next;
    });
  };

  const deselectAllSectionsOfChapter = (chId: number) => {
    const chapter = SHAHNAMEH_CHAPTERS.find((c) => c.id === chId);
    if (!chapter || !chapter.sections) return;
    setSelectedSectionKeys((prev) => {
      const next = new Set(prev);
      chapter.sections?.forEach((s) => next.delete(`${chId}_${s.sectionNumber}`));
      return next;
    });
  };

  // Build the list of target sections to export based on current mode
  const getItemsToExport = () => {
    const items: Array<{ chapter: typeof SHAHNAMEH_CHAPTERS[0]; section: any }> = [];

    if (downloadMode === 'single-section') {
      const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleSectionChapterId);
      const sec = ch?.sections?.find((s) => s.sectionNumber === singleSectionNumber);
      if (ch && sec) items.push({ chapter: ch, section: sec });
    } else if (downloadMode === 'single-chapter') {
      const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleChapterId);
      if (ch && ch.sections) {
        ch.sections.forEach((sec) => items.push({ chapter: ch, section: sec }));
      }
    } else if (downloadMode === 'multi-sections') {
      selectedSectionKeys.forEach((key) => {
        const [chIdStr, secNumStr] = key.split('_');
        const chId = Number(chIdStr);
        const secNum = Number(secNumStr);
        const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === chId);
        const sec = ch?.sections?.find((s) => s.sectionNumber === secNum);
        if (ch && sec) items.push({ chapter: ch, section: sec });
      });
      // Sort in book order
      items.sort((a, b) => {
        if (a.chapter.id !== b.chapter.id) return a.chapter.id - b.chapter.id;
        return a.section.sectionNumber - b.section.sectionNumber;
      });
    } else if (downloadMode === 'multi-chapters') {
      const sortedIds = [...selectedChapterIds].sort((a, b) => a - b);
      sortedIds.forEach((id) => {
        const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === id);
        if (ch && ch.sections) {
          ch.sections.forEach((sec) => items.push({ chapter: ch, section: sec }));
        }
      });
    } else if (downloadMode === 'all') {
      SHAHNAMEH_CHAPTERS.forEach((ch) => {
        if (ch.sections) {
          ch.sections.forEach((sec) => items.push({ chapter: ch, section: sec }));
        }
      });
    }

    return items;
  };

  const getComputedTitle = () => {
    if (downloadMode === 'single-section') {
      const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleSectionChapterId);
      const sec = ch?.sections?.find((s) => s.sectionNumber === singleSectionNumber);
      return `${ch?.shortName || ''} - بخش ${sec?.sectionNumber || ''} (${sec?.title || ''})`;
    }
    if (downloadMode === 'single-chapter') {
      const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleChapterId);
      return ch ? `${ch.title}` : 'فصل شاهنامه';
    }
    if (downloadMode === 'multi-sections') {
      return `${toPersianDigits(selectedSectionKeys.size)} بخش برگزیده شاهنامه`;
    }
    if (downloadMode === 'multi-chapters') {
      return `${toPersianDigits(selectedChapterIds.length)} فصل منتخب شاهنامه`;
    }
    return 'شاهنامه فردوسی - نسخه کامل ۶۱ فصل';
  };

  const totalSectionsToDownload = getItemsToExport().length;
  const isMultiItem = totalSectionsToDownload > 1;

  // DIRECT DOWNLOAD HANDLER:
  // Fulfills:
  // 1. "هیچ پیش نمایشی نیاز نیست و مستقیم دانلود شود"
  // 2. "اگر ۱۳ بخش را انتخاب کرد، هم فایل بصورت یکپارچه را ارائه دهد و فایل بصورت تک به تک"
  const handleStartExport = async (forceStrategy?: 'merged' | 'separate' | 'both') => {
    const items = getItemsToExport();
    if (items.length === 0) {
      alert('لطفاً حداقل یک بخش یا فصل را برای دانلود انتخاب فرمایید.');
      return;
    }

    const currentStrategy = forceStrategy || (isMultiItem ? bundleStrategy : 'merged');

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressText('در حال آماده‌سازی و واکشی ابیات از پایگاه دائمی...');

    try {
      const gathered = await gatherSectionsData(items, (loaded, total) => {
        const pct = Math.round((loaded / total) * 60);
        setProgressPercent(pct);
        setProgressText(`در حال استخراج ابیات بخش ${toPersianDigits(loaded)} از ${toPersianDigits(total)} (${toPersianDigits(pct)}٪)...`);
      });

      const options: ExportOptions = {
        format: exportFormat,
        includeMeaning,
        includeVerseNumbers,
        includeHeaderInfo,
        layout,
        documentTitle: getComputedTitle(),
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeTitle = sanitizeFileName(options.documentTitle);

      // Function to download single merged file
      const downloadMergedFile = async () => {
        setProgressText('در حال تولید فایل یکپارچه...');
        if (exportFormat === 'word') {
          const blob = generateWordDocument(gathered, options);
          triggerFileDownload(blob, `Shahnameh_${safeTitle}_${dateStr}.doc`);
        } else if (exportFormat === 'pdf') {
          await downloadDirectPdf(gathered, options, `Shahnameh_${safeTitle}_${dateStr}.pdf`);
        } else if (exportFormat === 'txt') {
          const blob = generateTextDocument(gathered, options);
          triggerFileDownload(blob, `Shahnameh_${safeTitle}_${dateStr}.txt`);
        } else if (exportFormat === 'json') {
          const blob = generateJsonDocument(gathered, options);
          triggerFileDownload(blob, `Shahnameh_${safeTitle}_${dateStr}.json`);
        }
      };

      // Function to download separate files zipped
      const downloadSeparateZip = async () => {
        setProgressText('در حال ساخت فایل‌های مجزا و بسته‌بندی در آرشیو ZIP...');
        const groupBy = downloadMode === 'multi-chapters' || downloadMode === 'all' ? 'by-chapter' : 'by-section';
        const zipBlob = await generateZipArchive(gathered, options, groupBy, (pct, msg) => {
          setProgressPercent(60 + Math.round(pct * 0.38));
          setProgressText(msg);
        });
        const zipName = `Shahnameh_${safeTitle}_Separate_Files_${dateStr}.zip`;
        triggerFileDownload(zipBlob, zipName);
      };

      if (!isMultiItem || currentStrategy === 'merged') {
        // Direct single file download
        await downloadMergedFile();
      } else if (currentStrategy === 'separate') {
        // Direct separate files in ZIP
        await downloadSeparateZip();
      } else if (currentStrategy === 'both') {
        // Download both: merged file AND separate files ZIP
        await downloadMergedFile();
        // Short pause to ensure browser handles dual download smoothly
        await new Promise((r) => setTimeout(r, 600));
        await downloadSeparateZip();
      }

      setProgressPercent(100);
      setProgressText('دانلود با موفقیت آغاز شد.');
      setTimeout(() => {
        setIsProcessing(false);
        setProgressText('');
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('خطا در فرآیند تولید و دانلود مستقیم فایل.');
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const activePickerChapter = SHAHNAMEH_CHAPTERS.find((c) => c.id === sectionPickerChapterId);
  const activePickerSections = (activePickerChapter?.sections || []).filter((s) => {
    if (!sectionSearchQuery) return true;
    const q = sectionSearchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.openingVerse.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#090d16] border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/40 bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-amber-100 flex items-center gap-2">
                <span>مرکز تخصصی دانلود مستقیم ابیات شاهنامه</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  دانلود مستقیم بدون پیش‌نمایش
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                دریافت مستقیم فایل‌های Word، PDF، TXT به صورت یکپارچه یا تک‌به‌تک (فایل‌های مجزا)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#0c121e] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setDownloadMode('single-section')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              downloadMode === 'single-section'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>۱. دانلود یک بخش</span>
          </button>

          <button
            onClick={() => setDownloadMode('single-chapter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              downloadMode === 'single-chapter'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>۲. دانلود یک فصل</span>
          </button>

          <button
            onClick={() => setDownloadMode('multi-sections')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              downloadMode === 'multi-sections'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>۳. چند بخش انتخابی</span>
            {selectedSectionKeys.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
                {toPersianDigits(selectedSectionKeys.size)}
              </span>
            )}
          </button>

          <button
            onClick={() => setDownloadMode('multi-chapters')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              downloadMode === 'multi-chapters'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>۴. چند فصل انتخابی</span>
            {selectedChapterIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
                {toPersianDigits(selectedChapterIds.length)}
              </span>
            )}
          </button>

          <button
            onClick={() => setDownloadMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              downloadMode === 'all'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>۵. کل شاهنامه (۶۱ فصل یکجا)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: Single Section */}
          {downloadMode === 'single-section' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    انتخاب فصل:
                  </label>
                  <select
                    value={singleSectionChapterId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSingleSectionChapterId(id);
                      setSingleSectionNumber(1);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {SHAHNAMEH_CHAPTERS.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        فصل {toPersianDigits(ch.chapterNumber)}: {ch.title} ({ch.sections?.length || 0} بخش)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    انتخاب بخش مورد نظر:
                  </label>
                  <select
                    value={singleSectionNumber}
                    onChange={(e) => setSingleSectionNumber(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {SHAHNAMEH_CHAPTERS.find((c) => c.id === singleSectionChapterId)?.sections?.map((s) => (
                      <option key={s.sectionNumber} value={s.sectionNumber}>
                        بخش {toPersianDigits(s.sectionNumber)}: {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview info card */}
              {(() => {
                const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleSectionChapterId);
                const sec = ch?.sections?.find((s) => s.sectionNumber === singleSectionNumber);
                if (!sec) return null;
                return (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-right space-y-1">
                    <div className="text-xs text-amber-400 font-bold">بخش انتخاب‌شده:</div>
                    <div className="text-sm font-bold text-slate-100">
                      بخش {toPersianDigits(sec.sectionNumber)}: {sec.title}
                    </div>
                    <div className="text-xs text-amber-200/80 font-poetry">
                      مصراع آغازین: « {sec.openingVerse} »
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: Single Chapter */}
          {downloadMode === 'single-chapter' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  فصل مورد نظر برای دانلود کامل ابیات را انتخاب کنید:
                </label>
                <select
                  value={singleChapterId}
                  onChange={(e) => setSingleChapterId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {SHAHNAMEH_CHAPTERS.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      فصل {toPersianDigits(ch.chapterNumber)}: {ch.title} ({toPersianDigits(ch.sections?.length || 0)} بخش)
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === singleChapterId);
                if (!ch) return null;
                return (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-right space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-bold">مشخصات فصل:</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        دوره {ch.era}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100">{ch.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{ch.summary}</p>
                    <div className="text-xs text-amber-300/90 pt-1">
                      حاوی <strong className="text-amber-300 font-bold">{toPersianDigits(ch.sections?.length || 0)} بخش</strong> از ابتدای فصل تا بخش پایانی
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: Multi-Sections Selector */}
          {downloadMode === 'multi-sections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300">
                  <span>تعداد بخش‌های تیک‌خورده: </span>
                  <strong className="text-amber-400 font-bold">
                    {toPersianDigits(selectedSectionKeys.size)} بخش
                  </strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => selectAllSectionsOfChapter(sectionPickerChapterId)}
                    className="flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                  >
                    انتخاب همه بخش‌های این فصل
                  </button>
                  <button
                    type="button"
                    onClick={() => deselectAllSectionsOfChapter(sectionPickerChapterId)}
                    className="flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    لغو انتخاب این فصل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSectionKeys(new Set())}
                    className="px-2 py-1 rounded-lg text-xs bg-rose-950/60 text-rose-300 border border-rose-900/60 hover:bg-rose-900/60 transition-colors"
                    title="پاک کردن همه"
                  >
                    پاکسازی
                  </button>
                </div>
              </div>

              {/* Chapter selector & search for sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    انتخاب فصل جهت مشاهده بخش‌ها:
                  </label>
                  <select
                    value={sectionPickerChapterId}
                    onChange={(e) => setSectionPickerChapterId(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  >
                    {SHAHNAMEH_CHAPTERS.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        فصل {toPersianDigits(ch.chapterNumber)}: {ch.title} ({ch.sections?.length || 0} بخش)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    جستجو در بخش‌های این فصل:
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={sectionSearchQuery}
                      onChange={(e) => setSectionSearchQuery(e.target.value)}
                      placeholder="عنوان بخش یا کلمه‌ای از مصراع..."
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section checkboxes list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                {activePickerSections.map((sec) => {
                  const isChecked = selectedSectionKeys.has(`${sectionPickerChapterId}_${sec.sectionNumber}`);
                  return (
                    <div
                      key={sec.sectionNumber}
                      onClick={() => toggleSection(sectionPickerChapterId, sec.sectionNumber)}
                      className={`p-2.5 rounded-lg border text-right cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="mt-0.5 text-amber-400 flex-shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-snug">
                          بخش {toPersianDigits(sec.sectionNumber)}: {sec.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-poetry mt-0.5 line-clamp-1">
                          « {sec.openingVerse} »
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Multi-Chapters Selector */}
          {downloadMode === 'multi-chapters' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300">
                  <span>تعداد فصول انتخاب‌شده: </span>
                  <strong className="text-amber-400 font-bold">
                    {toPersianDigits(selectedChapterIds.length)} از ۶۱ فصل
                  </strong>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={selectAllChapters}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                  >
                    انتخاب هر ۶۱ فصل
                  </button>
                  <button
                    type="button"
                    onClick={() => selectEraChapters('اساطیری')}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 transition-colors"
                  >
                    دوره اساطیری
                  </button>
                  <button
                    type="button"
                    onClick={() => selectEraChapters('پهلوانی')}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 transition-colors"
                  >
                    دوره پهلوانی
                  </button>
                  <button
                    type="button"
                    onClick={() => selectEraChapters('تاریخی')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 transition-colors"
                  >
                    دوره تاریخی
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllChapters}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-900/50 hover:bg-rose-900/50 transition-colors"
                  >
                    عدم انتخاب
                  </button>
                </div>
              </div>

              {/* Chapters Checkboxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                {SHAHNAMEH_CHAPTERS.map((ch) => {
                  const isChecked = selectedChapterIds.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => toggleChapter(ch.id)}
                      className={`p-2.5 rounded-lg border text-right cursor-pointer transition-all flex items-start gap-2 ${
                        isChecked
                          ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="mt-0.5 text-amber-400 flex-shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-tight">
                          فصل {toPersianDigits(ch.chapterNumber)}: {ch.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{toPersianDigits(ch.sections?.length || 0)} بخش</span>
                          <span className="text-[9px] text-amber-500/80">{ch.era}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: All 61 Chapters */}
          {downloadMode === 'all' && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-amber-950/20 border border-amber-600/40 text-right space-y-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-sm font-bold">دانلود کامل شاهنامه فردوسی (تمام ۶۱ فصل و ۸۵۷ بخش)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                این گزینه تمامی حدود ۵۰,۰۰۰ بیت شاهنامه فردوسی را بدون نیاز به لود از اینترنت و به صورت مستقیم از داده‌های محلی استخراج کرده و در قالب فایل منتخب شما تقدیم می‌کند.
              </p>
              <div className="flex items-center gap-3 text-xs text-amber-400/90 pt-1">
                <span>• ۶۱ فصل حماسی کامل</span>
                <span>• ۸۵۷ بخش مستقل</span>
                <span>• ۴۹,۶۰۹ بیت دقیق گنجور</span>
              </div>
            </div>
          )}

          {/* MULTI-FILE PACKAGING STRATEGY SELECTOR (CRITICAL REQUIREMENT) */}
          {/* Fulfills: "خروجی مورد نیاز کاربر اگر چندتایی باشد، پرسیده شود که یکجا همه با هم آورده شوند یا اینکه هر بخش یا هر فصل در فایلی جدا آورده شود" */}
          {isMultiItem && (
            <div className="p-4 rounded-xl bg-[#0f172a] border border-amber-500/40 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-200">
                    شیوه بسته‌بندی فایل‌های خروجی ({toPersianDigits(totalSectionsToDownload)} بخش انتخاب‌شده):
                  </span>
                </div>
                <span className="text-[11px] text-amber-300/80">انتخاب نحوه تفکیک</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Mode 1: Merged */}
                <div
                  onClick={() => setBundleStrategy('merged')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    bundleStrategy === 'merged'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-md shadow-amber-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <FileStack className="w-3.5 h-3.5 text-amber-400" />
                      یک فایل یکپارچه
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      bundleStrategy === 'merged' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                    }`}>
                      {bundleStrategy === 'merged' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    همه ابیات در ۱ فایل واحد پشت سر هم با عناوین و سربرگ‌های تفکیک‌شده
                  </span>
                </div>

                {/* Mode 2: Separate */}
                <div
                  onClick={() => setBundleStrategy('separate')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    bundleStrategy === 'separate'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-md shadow-amber-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-emerald-400" />
                      فایل‌های تک‌به‌تک (ZIP)
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      bundleStrategy === 'separate' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                    }`}>
                      {bundleStrategy === 'separate' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    هر بخش یا فصل در فایلی جداگانه و بسته‌بندی در یک آرشیو زیپ (ZIP)
                  </span>
                </div>

                {/* Mode 3: Both */}
                <div
                  onClick={() => setBundleStrategy('both')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    bundleStrategy === 'both'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-md shadow-amber-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      هر دو حالت
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      bundleStrategy === 'both' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                    }`}>
                      {bundleStrategy === 'both' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    هم فایل یکپارچه و هم فایل‌های تفکیک‌شده مجزا در قالب ZIP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Export Format Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              فرمت فایل خروجی را انتخاب کنید:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('word')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'word'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300 shadow-md shadow-blue-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-6 h-6 text-blue-400" />
                <span className="text-xs font-bold">فایل Word (.doc)</span>
                <span className="text-[10px] text-slate-400">راست‌چین و جدول‌بندی</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-6 h-6 text-rose-400" />
                <span className="text-xs font-bold">فایل PDF (.pdf)</span>
                <span className="text-[10px] text-slate-400">دانلود مستقیم سند PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('txt')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'txt'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold">متن ساده (.txt)</span>
                <span className="text-[10px] text-slate-400">مناسب ویرایش و نوت</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-bold">داده ساختاریافته (JSON)</span>
                <span className="text-[10px] text-slate-400">مناسب پژوهش و تحلیل</span>
              </button>
            </div>

            {/* Customization checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeMeaning}
                  onChange={(e) => setIncludeMeaning(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-0"
                />
                <span>گنجاندن معنی و شرح روان ابیات (در صورت وجود)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeVerseNumbers}
                  onChange={(e) => setIncludeVerseNumbers(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-0"
                />
                <span>درج شماره هر بیت (بیت ۱، ۲، ۳...)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeHeaderInfo}
                  onChange={(e) => setIncludeHeaderInfo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-0"
                />
                <span>درج دیباچه و سربرگ نام فصل‌ها و بخش‌ها</span>
              </label>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-400">چیدمان ابیات:</span>
                <button
                  type="button"
                  onClick={() => setLayout('couplet')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    layout === 'couplet'
                      ? 'bg-amber-600 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  دو مصراع روبه‌رو
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('single-line')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    layout === 'single-line'
                      ? 'bg-amber-600 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  پشت سر هم
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0e1424] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>آماده‌سازی برای دانلود:</span>
            <strong className="text-amber-300 font-bold">
              {toPersianDigits(totalSectionsToDownload)} بخش
            </strong>
            <span className="text-slate-500">•</span>
            <span>فرمت: <span className="text-amber-200 font-semibold">{exportFormat.toUpperCase()}</span></span>
            {isMultiItem && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300">
                  {bundleStrategy === 'merged'
                    ? 'یکپارچه'
                    : bundleStrategy === 'separate'
                    ? 'تک‌به‌تک (ZIP)'
                    : 'هم یکپارچه هم ZIP'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              انصراف
            </button>

            {/* If multi-item, give clear direct buttons to download either way or both */}
            {isMultiItem ? (
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <button
                  onClick={() => handleStartExport('merged')}
                  disabled={isProcessing || totalSectionsToDownload === 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  title="دانلود همه بخش‌های منتخب در ۱ فایل یکپارچه"
                >
                  <FileStack className="w-3.5 h-3.5" />
                  <span>دانلود یکپارچه</span>
                </button>

                <button
                  onClick={() => handleStartExport('separate')}
                  disabled={isProcessing || totalSectionsToDownload === 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-emerald-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  title="دانلود هر بخش در یک فایل مجزا داخل آرشیو ZIP"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>دانلود تک‌به‌تک (ZIP)</span>
                </button>

                <button
                  onClick={() => handleStartExport('both')}
                  disabled={isProcessing || totalSectionsToDownload === 0}
                  className="hidden md:inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-bold text-xs text-blue-200 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-600/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  title="دریافت هر دو حالت: فایل یکپارچه + فایل‌های تک‌به‌تک"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>هر دو</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartExport('merged')}
                disabled={isProcessing || totalSectionsToDownload === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{progressText || 'در حال آماده‌سازی و دانلود...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>دانلود مستقیم فایل ({exportFormat.toUpperCase()})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
