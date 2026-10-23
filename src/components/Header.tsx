import React from 'react';
import { BookOpen, Bookmark, ExternalLink, Sparkles, Search, Download } from 'lucide-react';
import { toPersianDigits } from '../utils/persianNumbers';

interface HeaderProps {
  favoritesCount: number;
  onOpenFavorites: () => void;
  onSelectChapterId: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDownloadCenter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount,
  onOpenFavorites,
  onSelectChapterId,
  searchQuery,
  onSearchChange,
  onOpenDownloadCenter,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-900/30 bg-[#080b11]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Right side (RTL Start): Ferdowsi Avatar & App Title */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <div className="relative group cursor-pointer" onClick={() => onSelectChapterId(1)}>
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
                <img
                  src="/src/assets/images/ferdowsi_portrait_1792671520172.jpg"
                  alt="حکیم ابوالقاسم فردوسی"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-[#080b11]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  شاهنامه فردوسی
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  ۶۱ فصل بر پایه گنجور
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                کاوشگر جامع فصول، داستان‌ها و شخصیت‌های جاودان حماسه ملی ایران
              </p>
            </div>
          </div>

          {/* Search Bar in center (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="جستجوی فصل یا بخش (مثال: رستم، سهراب، یزدگرد، یا عدد ۲۸)..."
                className="w-full pl-4 pr-10 py-2 text-sm bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Left Side (RTL End): Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Download Center Dedicated Button */}
            <button
              onClick={onOpenDownloadCenter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="مرکز دانلود فایل ورد و پی‌دی‌اف ابیات"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">دانلود ابیات (Word/PDF)</span>
              <span className="sm:hidden">دانلود</span>
            </button>

            {/* Ganjoor Official Link */}
            <a
              href="https://ganjoor.net/ferdousi/shahname"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/30 hover:border-amber-500 transition-all group"
              title="مشاهده شاهنامه در سایت اصلی گنجور"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>گنجور</span>
              <ExternalLink className="w-3 h-3 text-amber-400/70 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Bookmarked / Saved Chapters */}
            <button
              onClick={onOpenFavorites}
              className="relative inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-amber-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-all"
              title="نشان‌شده‌ها و یادداشت‌های فصول"
            >
              <Bookmark className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                  {toPersianDigits(favoritesCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجو در ۶۱ فصل شاهنامه..."
              className="w-full pl-4 pr-10 py-2 text-sm bg-slate-900/90 border border-slate-700/70 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
