import React from 'react';
import { Bookmark, ExternalLink, Sparkles, User, ChevronLeft } from 'lucide-react';
import { Chapter } from '../data/chapters';
import { toPersianDigits } from '../utils/persianNumbers';

interface ChapterCardProps {
  chapter: Chapter;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onSelect: (chapter: Chapter) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  // Era color accents
  const eraBadgeConfig = {
    'اساطیری': {
      bg: 'bg-purple-950/40 text-purple-300 border-purple-700/40',
      dot: 'bg-purple-400',
    },
    'پهلوانی': {
      bg: 'bg-red-950/40 text-amber-200 border-red-800/40',
      dot: 'bg-amber-400',
    },
    'تاریخی': {
      bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40',
      dot: 'bg-emerald-400',
    },
  }[chapter.era];

  return (
    <div className="group relative flex flex-col justify-between rounded-xl p-5 bg-[#0e1422] hover:bg-[#131c30] border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/20">
      {/* Top Header of Card */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Chapter Number Emblem */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base bg-gradient-to-br from-amber-600/20 to-amber-950/60 border border-amber-500/40 text-amber-300 group-hover:scale-105 transition-transform">
              {toPersianDigits(chapter.chapterNumber)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${eraBadgeConfig.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${eraBadgeConfig.dot}`} />
                  {chapter.eraFull}
                </span>
                <span className="text-[11px] text-slate-400">
                  {chapter.dynasty}
                </span>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                  {toPersianDigits(chapter.sectionsCount || chapter.sections?.length || 0)} بخش
                </span>
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(chapter.id);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              isFavorite
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-amber-300 border-slate-800 hover:border-slate-700'
            }`}
            title={isFavorite ? 'حذف از نشان‌شده‌ها' : 'افزودن به نشان‌شده‌ها'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Exact User Title */}
        <h3
          onClick={() => onSelect(chapter)}
          className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors cursor-pointer leading-snug mb-2"
        >
          {chapter.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-3 mb-4">
          {chapter.summary}
        </p>

        {/* Key Figures badges */}
        {chapter.keyFigures.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {chapter.keyFigures.slice(0, 3).map((fig, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-900 text-slate-300 border border-slate-800"
              >
                <User className="w-2.5 h-2.5 text-amber-400/80" />
                {fig}
              </span>
            ))}
            {chapter.keyFigures.length > 3 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{toPersianDigits(chapter.keyFigures.length - 3)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Bottom Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        {/* Ganjoor Direct Link */}
        <a
          href={chapter.ganjoorUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
          title="مشاهده این بخش در گنجور"
        >
          <ExternalLink className="w-3 h-3 text-amber-500/70" />
          <span>گنجور</span>
        </a>

        {/* Read & Explore Chapter */}
        <button
          onClick={() => onSelect(chapter)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 hover:border-amber-500/60 transition-all group/btn"
        >
          <span>بخش‌ها و ابیات</span>
          <ChevronLeft className="w-3.5 h-3.5 text-amber-400 group-hover/btn:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
