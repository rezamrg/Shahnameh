import React from 'react';
import { Bookmark, ExternalLink, User, ChevronLeft } from 'lucide-react';
import { Chapter } from '../data/chapters';
import { toPersianDigits } from '../utils/persianNumbers';

interface TimelineViewProps {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  chapters,
  onSelectChapter,
  favorites,
  onToggleFavorite,
}) => {
  return (
    <div className="relative border-r-2 border-amber-600/30 pr-4 sm:pr-8 mr-2 sm:mr-4 space-y-6 sm:space-y-8 my-6">
      {chapters.map((chapter) => {
        const isFav = favorites.includes(chapter.id);
        const eraColor = {
          'اساطیری': 'border-purple-500 bg-purple-950/60 text-purple-300',
          'پهلوانی': 'border-amber-500 bg-amber-950/60 text-amber-300',
          'تاریخی': 'border-emerald-500 bg-emerald-950/60 text-emerald-300',
        }[chapter.era];

        return (
          <div key={chapter.id} className="relative group">
            {/* Timeline Node Point on right line */}
            <div className="absolute -right-[23px] sm:-right-[39px] top-4 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#080b11] border-2 border-amber-500 group-hover:bg-amber-500 group-hover:scale-125 transition-all shadow-md shadow-amber-500/20" />

            {/* Chapter Container */}
            <div className="rounded-xl p-4 sm:p-5 bg-[#0e1422] hover:bg-[#131b2e] border border-slate-800 hover:border-amber-600/40 transition-all shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-900 border border-amber-500/30 text-amber-300">
                    {toPersianDigits(chapter.chapterNumber)}
                  </span>
                  <h4
                    onClick={() => onSelectChapter(chapter)}
                    className="text-base sm:text-lg font-bold text-slate-100 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    {chapter.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${eraColor}`}>
                    {chapter.eraFull}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                    {chapter.dynasty}
                  </span>
                  <button
                    onClick={() => onToggleFavorite(chapter.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isFav
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
                    }`}
                    title="نشان کردن"
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed mb-3">
                {chapter.summary}
              </p>

              {chapter.sampleVerses.length > 0 && (
                <div className="mb-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 font-poetry text-xs sm:text-sm text-amber-200/90 flex flex-col sm:flex-row justify-between text-center gap-1">
                  <span>« {chapter.sampleVerses[0].mesra1} »</span>
                  <span>« {chapter.sampleVerses[0].mesra2} »</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <a
                  href={chapter.ganjoorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-300"
                >
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                  <span>پیوند مستقیم گنجور</span>
                </a>

                <button
                  onClick={() => onSelectChapter(chapter)}
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold"
                >
                  <span>شرح کامل و ابیات</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
