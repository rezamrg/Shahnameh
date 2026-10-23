import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Compass,
  ArrowUp,
  Layers
} from 'lucide-react';
import { SHAHNAMEH_CHAPTERS, Chapter, ERAS, ChapterSection } from './data/chapters';
import { Header } from './components/Header';
import { FerdowsiBanner } from './components/FerdowsiBanner';
import { ChapterCard } from './components/ChapterCard';
import { ChapterDetailModal } from './components/ChapterDetailModal';
import { SectionReaderModal } from './components/SectionReaderModal';
import { TimelineView } from './components/TimelineView';
import { FavoritesModal } from './components/FavoritesModal';
import { DownloadCenterModal } from './components/DownloadCenterModal';
import { MarkAsReadModal } from './components/MarkAsReadModal';
import { preloadChapterVerses } from './services/verseService';
import { sanitizeLegacyMockData } from './services/userDataService';
import { toPersianDigits, toEnglishDigits } from './utils/persianNumbers';

export default function App() {
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeSection, setActiveSection] = useState<ChapterSection | null>(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Download Center State
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [downloadTargetChapterId, setDownloadTargetChapterId] = useState<number | undefined>(undefined);
  const [downloadTargetSectionNumber, setDownloadTargetSectionNumber] = useState<number | undefined>(undefined);

  // Mark as Read Modal State
  const [markAsReadTarget, setMarkAsReadTarget] = useState<{
    chapterId: number;
    chapterTitle: string;
    sectionNumber: number;
    sectionTitle: string;
    openingVerse?: string;
  } | null>(null);

  // Favorites state persisted in localStorage - starts completely empty with no default bookmarks
  const [favorites, setFavorites] = useState<number[]>(() => {
    sanitizeLegacyMockData();
    try {
      const saved = localStorage.getItem('shahnameh_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Notes state persisted in localStorage - starts completely empty with no default notes
  const [userNotes, setUserNotes] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('shahnameh_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
      return {};
    } catch {
      return {};
    }
  });

  // Persist favorites safely
  useEffect(() => {
    try {
      localStorage.setItem('shahnameh_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error persisting favorites:', e);
    }
  }, [favorites]);

  // Persist notes safely
  useEffect(() => {
    try {
      localStorage.setItem('shahnameh_notes', JSON.stringify(userNotes));
    } catch (e) {
      console.error('Error persisting notes:', e);
    }
  }, [userNotes]);

  // Listen for storage events across tabs to keep data synchronized
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const rawFavs = localStorage.getItem('shahnameh_favorites');
        setFavorites(rawFavs ? JSON.parse(rawFavs) : []);

        const rawNotes = localStorage.getItem('shahnameh_notes');
        setUserNotes(rawNotes ? JSON.parse(rawNotes) : {});
      } catch (err) {
        console.error('Error syncing storage:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Scroll to top monitor
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Preload key chapters into local memory for instant opening
  useEffect(() => {
    preloadChapterVerses(1);
    preloadChapterVerses(15);
    preloadChapterVerses(28);
  }, []);

  const handleToggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveNote = (chapterId: number, note: string) => {
    setUserNotes((prev) => {
      const next = { ...prev };
      const trimmed = note.trim();
      if (!trimmed) {
        delete next[chapterId];
      } else {
        next[chapterId] = trimmed;
      }
      try {
        localStorage.setItem('shahnameh_notes', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving note to localStorage:', e);
      }
      return next;
    });
  };

  const handleNavigateChapter = (direction: 'next' | 'prev') => {
    if (!activeChapter) return;
    const currentNumber = activeChapter.chapterNumber;
    const targetNumber = direction === 'next' ? currentNumber + 1 : currentNumber - 1;
    const nextChapter = SHAHNAMEH_CHAPTERS.find((c) => c.chapterNumber === targetNumber);
    if (nextChapter) {
      setActiveChapter(nextChapter);
    }
  };

  const handleQuickJump = (id: number) => {
    const found = SHAHNAMEH_CHAPTERS.find((c) => c.id === id);
    if (found) {
      setActiveChapter(found);
    }
  };

  // Navigate between sections within the active chapter
  const handleNavigateSection = (direction: 'next' | 'prev') => {
    if (!activeChapter || !activeSection) return;
    const sections = activeChapter.sections || [];
    const currentIndex = sections.findIndex(
      (s) => s.sectionNumber === activeSection.sectionNumber
    );
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < sections.length) {
      setActiveSection(sections[nextIndex]);
    }
  };

  const currentSectionIndex = useMemo(() => {
    if (!activeChapter || !activeSection) return -1;
    return (activeChapter.sections || []).findIndex(
      (s) => s.sectionNumber === activeSection.sectionNumber
    );
  }, [activeChapter, activeSection]);

  const hasPrevSection = currentSectionIndex > 0;
  const hasNextSection = activeChapter && activeChapter.sections
    ? currentSectionIndex >= 0 && currentSectionIndex < activeChapter.sections.length - 1
    : false;

  const handleOpenDownload = (chId?: number, secNum?: number) => {
    setDownloadTargetChapterId(chId);
    setDownloadTargetSectionNumber(secNum);
    setIsDownloadOpen(true);
  };

  const handleOpenMarkAsRead = (
    chapterId: number,
    sectionNumber: number,
    sectionTitle: string,
    openingVerse?: string
  ) => {
    const ch = SHAHNAMEH_CHAPTERS.find((c) => c.id === chapterId);
    setMarkAsReadTarget({
      chapterId,
      chapterTitle: ch ? ch.title : `فصل ${toPersianDigits(chapterId)}`,
      sectionNumber,
      sectionTitle,
      openingVerse,
    });
  };

  // Filtered chapters calculation with full text search across chapters and all 857 sections
  const filteredChapters = useMemo(() => {
    const cleanQuery = toEnglishDigits(searchQuery.trim().toLowerCase());

    return SHAHNAMEH_CHAPTERS.filter((chapter) => {
      // Era filter
      if (selectedEra !== 'all' && chapter.era !== selectedEra) {
        return false;
      }

      // Search query filter
      if (!cleanQuery) return true;

      const titleMatches = chapter.title.toLowerCase().includes(cleanQuery);
      const numberMatches = String(chapter.chapterNumber).includes(cleanQuery) ||
                            toPersianDigits(chapter.chapterNumber).includes(cleanQuery);
      const summaryMatches = chapter.summary.toLowerCase().includes(cleanQuery);
      const dynastyMatches = chapter.dynasty.toLowerCase().includes(cleanQuery);
      const figuresMatch = chapter.keyFigures.some((fig) =>
        fig.toLowerCase().includes(cleanQuery)
      );
      const sectionsMatch = chapter.sections?.some(
        (sec) =>
          sec.title.toLowerCase().includes(cleanQuery) ||
          sec.openingVerse.toLowerCase().includes(cleanQuery) ||
          String(sec.sectionNumber).includes(cleanQuery) ||
          toPersianDigits(sec.sectionNumber).includes(cleanQuery)
      );

      return titleMatches || numberMatches || summaryMatches || dynastyMatches || figuresMatch || sectionsMatch;
    });
  }, [selectedEra, searchQuery]);

  const favoriteChaptersList = useMemo(() => {
    return SHAHNAMEH_CHAPTERS.filter((c) => favorites.includes(c.id));
  }, [favorites]);

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-200 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Application Header */}
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onSelectChapterId={handleQuickJump}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenDownloadCenter={() => handleOpenDownload()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Ferdowsi Hero Tribute Banner */}
        <FerdowsiBanner
          onQuickJump={handleQuickJump}
          onOpenDownload={() => handleOpenDownload()}
        />

        {/* Filters, Eras & Controls Bar */}
        <div className="mb-6 bg-[#0c121e] border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Era Filter Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {ERAS.map((era) => {
              const isSelected = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(era.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {era.name}
                </button>
              );
            })}
          </div>

          {/* View Mode & Count */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <span className="text-xs text-slate-400">
              نمایش <strong className="text-amber-300 font-bold">{toPersianDigits(filteredChapters.length)}</strong> از {toPersianDigits(61)} فصل
              <span className="text-slate-500 mr-1.5">({toPersianDigits(857)} بخش)</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="نمایش شبکه‌ای کارت‌ها"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="نمایش فهرست کامل"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="گاه‌شمار تاریخی ۶۱ فصل"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content based on View Mode */}
        {filteredChapters.length === 0 ? (
          <div className="text-center py-16 bg-[#0c121e] rounded-2xl border border-slate-800">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300">هیچ فصلی یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              عبارت دیگری را جستجو کنید یا فیلتر دوره را تغییر دهید.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEra('all');
              }}
              className="mt-4 px-4 py-2 bg-amber-600 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-500 transition-colors"
            >
              پاک کردن فیلترها و مشاهده همه ۶۱ فصل
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                isFavorite={favorites.includes(chapter.id)}
                onToggleFavorite={handleToggleFavorite}
                onSelect={setActiveChapter}
              />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
            {filteredChapters.map((chapter) => {
              const isFav = favorites.includes(chapter.id);
              const sectionsCount = chapter.sectionsCount || chapter.sections?.length || 0;
              return (
                <div
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter)}
                  className="p-4 sm:p-5 hover:bg-[#121929] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-slate-900 border border-amber-600/30 text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {toPersianDigits(chapter.chapterNumber)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                          {chapter.title}
                        </h4>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {chapter.eraFull}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                          {toPersianDigits(sectionsCount)} بخش
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                        {chapter.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <a
                      href={chapter.ganjoorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-amber-300 bg-slate-900/60 border border-slate-800 flex items-center gap-1"
                      title="لینک در گنجور"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-500" />
                      <span>گنجور</span>
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(chapter.id);
                      }}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isFav
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <TimelineView
            chapters={filteredChapters}
            onSelectChapter={setActiveChapter}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-30 p-3 rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-xl shadow-amber-950/50 transition-all hover:scale-110"
          title="بازگشت به ابتدای صفحه"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Chapter Detail Modal */}
      <ChapterDetailModal
        chapter={activeChapter}
        onClose={() => setActiveChapter(null)}
        onNavigateChapter={handleNavigateChapter}
        isFavorite={activeChapter ? favorites.includes(activeChapter.id) : false}
        onToggleFavorite={handleToggleFavorite}
        userNotes={userNotes}
        onSaveNote={handleSaveNote}
        onSelectSection={(section) => setActiveSection(section)}
        onOpenDownload={handleOpenDownload}
        onOpenMarkAsRead={handleOpenMarkAsRead}
      />

      {/* Section Verses Reader Modal */}
      <SectionReaderModal
        section={activeSection}
        chapter={activeChapter}
        onClose={() => setActiveSection(null)}
        onNavigateSection={handleNavigateSection}
        hasPrevSection={hasPrevSection}
        hasNextSection={hasNextSection}
        onOpenDownload={handleOpenDownload}
        onOpenMarkAsRead={handleOpenMarkAsRead}
      />

      {/* Mark as Read Modal */}
      {markAsReadTarget && (
        <MarkAsReadModal
          isOpen={Boolean(markAsReadTarget)}
          onClose={() => setMarkAsReadTarget(null)}
          chapterId={markAsReadTarget.chapterId}
          chapterTitle={markAsReadTarget.chapterTitle}
          sectionNumber={markAsReadTarget.sectionNumber}
          sectionTitle={markAsReadTarget.sectionTitle}
          openingVerse={markAsReadTarget.openingVerse}
        />
      )}

      {/* Download Center Layer / Modal */}
      <DownloadCenterModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        defaultChapterId={downloadTargetChapterId}
        defaultSectionNumber={downloadTargetSectionNumber}
      />

      {/* Favorites and Notes Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoriteChapters={favoriteChaptersList}
        onRemoveFavorite={handleToggleFavorite}
        onSelectChapter={setActiveChapter}
        userNotes={userNotes}
      />

      {/* Application Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#06080d] py-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/40 p-0.5">
              <img
                src="/src/assets/images/ferdowsi_portrait_1792671520172.jpg"
                alt="فردوسی"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <p className="font-bold text-amber-200">
                دانشنامه شاهنامه فردوسی (۶۱ فصل • ۸۵۷ بخش)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تطبیق کامل داده‌ها بر پایه فهرست‌بندی مرجع در وب‌سایت گنجور همراه با متن ابیات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a
              href="https://ganjoor.net/ferdousi/shahname"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>پایگاه گنجور</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              فصول نشان‌شده ({toPersianDigits(favorites.length)})
            </button>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500 font-poetry">
              «چو ایران نباشد تن من مباد»
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
