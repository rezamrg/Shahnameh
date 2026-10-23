import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Feather, Shield, Compass, BookOpen, ExternalLink, Download, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '../utils/persianNumbers';
import { getTotalReadCount, getTotalReadingSessionsCount, subscribeToReadingLogs } from '../services/readingLogService';

interface FerdowsiBannerProps {
  onQuickJump: (id: number) => void;
  onOpenDownload?: () => void;
}

export const FerdowsiBanner: React.FC<FerdowsiBannerProps> = ({ onQuickJump, onOpenDownload }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedQuickId, setSelectedQuickId] = useState<number>(1);
  const [totalRead, setTotalRead] = useState<number>(() => getTotalReadCount());
  const [totalSessions, setTotalSessions] = useState<number>(() => getTotalReadingSessionsCount());

  useEffect(() => {
    const updateStats = () => {
      setTotalRead(getTotalReadCount());
      setTotalSessions(getTotalReadingSessionsCount());
    };
    updateStats();
    const unsub = subscribeToReadingLogs(updateStats);
    return unsub;
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-600/30 bg-gradient-to-b from-[#121826] via-[#0c121d] to-[#080b11] shadow-2xl mb-8">
      {/* Background Graphic with Simurgh & Alborz */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen">
        <img
          src="/src/assets/images/shahnameh_hero_1792671519243.jpg"
          alt="سیمرغ و کوه البرز"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-[#080b11]/80 to-transparent"></div>
      </div>

      {/* Decorative Persian Tazhib border corner accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-radial from-amber-500/10 to-transparent pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative p-5 sm:p-7 md:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          {/* Ferdowsi Portrait Frame */}
          <div className="relative flex-shrink-0 group">
            {/* Persian Arch / Mihrab outer glow frame */}
            <div className="w-36 h-44 sm:w-44 sm:h-52 md:w-52 md:h-60 rounded-t-full rounded-b-2xl p-1.5 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 shadow-xl shadow-amber-950/60 transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-slate-900 relative">
                <img
                  src="/src/assets/images/ferdowsi_portrait_1792671520172.jpg"
                  alt="حکیم ابوالقاسم فردوسی"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top filter brightness-95 contrast-105 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300 drop-shadow-md">
                    حکیم ابوالقاسم فردوسی
                  </span>
                  <div className="text-[10px] text-amber-200/70">
                    توس، ۳۲۹ – ۴۱۶ ه‍.ق
                  </div>
                </div>
              </div>
            </div>

            {/* Tazhib Badge */}
            <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg border border-amber-300">
              <Feather className="w-4 h-4" />
            </div>
          </div>

          {/* Epic Calligraphy & Text Description */}
          <div className="flex-1 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>شاهکار بی همتای زبان و فرهنگ پارسی</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              کاوش در ۶۱ فصل <span className="bg-gradient-to-l from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">شاهنامه فردوسی</span>
            </h2>

            {/* Poetic Couplets */}
            <div className="mt-3.5 space-y-1.5 font-poetry text-amber-100/90 text-sm sm:text-base md:text-lg border-r-2 border-amber-500/40 pr-3 my-2">
              <p className="tracking-wide">
                «پی افکندم از نظم کاخی بلند &nbsp;•&nbsp; که از باد و باران نیابد گزند»
              </p>
              <p className="text-amber-300/80 text-xs sm:text-sm">
                «بسی رنج بردم در این سال سی &nbsp;•&nbsp; عجم زنده کردم بدین پارسی»
              </p>
            </div>

            {isExpanded && (
              <p className="mt-3 text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-2xl">
                این نرم‌افزار، تمامی ۶۱ فصل شاهنامه حکیم توس را بر اساس فهرست‌بندی مرجع وب‌سایت گنجور در ۳ دوره «اساطیری»، «پهلوانی» و «تاریخی» دسته‌بندی و ساماندهی کرده است. می‌توانید به سرعت میان فصول گردش کنید، خلاصه و ابیات شاهکار هر فصل را بخوانید و مستقیماً به نسخه کامل در گنجور متصل شوید.
              </p>
            )}

            {/* Quick Stats & Navigation Jump */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">شمار فصول:</span>
                  <span className="font-bold text-amber-300">{toPersianDigits(61)} فصل</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">کل بخش‌ها:</span>
                  <span className="font-bold text-amber-300">{toPersianDigits(857)} بخش گنجور</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">۳ دوره:</span>
                  <span className="text-slate-200">اساطیری، پهلوانی، تاریخی</span>
                </div>
                {totalRead > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">مطالعه‌شده:</span>
                    <span className="font-bold text-emerald-300">{toPersianDigits(totalRead)} بخش</span>
                    {totalSessions > totalRead && (
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold mr-1">
                        {toPersianDigits(totalSessions)} نوبت
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Jump to Chapter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs text-slate-400 whitespace-nowrap">پرش مستقیم به فصل:</label>
                <select
                  value={selectedQuickId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedQuickId(id);
                    onQuickJump(id);
                  }}
                  className="bg-slate-900 border border-amber-600/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {Array.from({ length: 61 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      فصل {toPersianDigits(num)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onQuickJump(selectedQuickId)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg transition-colors border border-slate-700"
                >
                  مشاهده
                </button>
                {onOpenDownload && (
                  <button
                    onClick={onOpenDownload}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap"
                    title="مرکز تخصصی دانلود فایل ابیات Word / PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>مرکز دانلود</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Expand/Collapse */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
          >
            <span>{isExpanded ? 'خلاصه‌سازی پوسته' : 'نمایش توضیحات کامل'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
