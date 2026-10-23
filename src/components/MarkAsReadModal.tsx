import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  Clock,
  Trash2,
  Save,
  Plus,
  Edit2,
  Calendar,
  RotateCcw,
  BookOpen,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  getSectionSessions,
  addReadingSession,
  updateReadingSession,
  deleteReadingSession,
  clearAllSectionSessions,
  getPersianNowString,
  getIterationLabel,
  getIterationShortLabel,
  getNextIterationNumber,
  ReadingSession,
  ReadingLogEntry,
} from '../services/readingLogService';
import { toPersianDigits } from '../utils/persianNumbers';

interface MarkAsReadModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  openingVerse?: string;
  onSaved?: (entry: ReadingLogEntry) => void;
  onRemoved?: () => void;
}

export const MarkAsReadModal: React.FC<MarkAsReadModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  sectionNumber,
  sectionTitle,
  openingVerse,
  onSaved,
  onRemoved,
}) => {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Form state
  const [iteration, setIteration] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const refreshSessions = () => {
    const list = getSectionSessions(chapterId, sectionNumber);
    setSessions(list);
    return list;
  };

  useEffect(() => {
    if (isOpen) {
      const list = refreshSessions();
      setEditingSessionId(null);
      setConfirmDeleteId(null);
      setConfirmClearAll(false);
      setValidationError(null);

      // Default to next iteration
      const nextIter = getNextIterationNumber(chapterId, sectionNumber);
      setIteration(nextIter);
      const nowStr = getPersianNowString();
      setCustomDate(nowStr);
      // Clean slate - no default prefilled note! User writes their own description or chooses a preset
      setNote('');
    }
  }, [isOpen, chapterId, sectionNumber]);

  if (!isOpen) return null;

  const handleStartEdit = (session: ReadingSession) => {
    setEditingSessionId(session.id);
    setIteration(session.iteration);
    setNote(session.note);
    setCustomDate(session.displayDate);
    setConfirmDeleteId(null);
    setValidationError(null);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    const nextIter = getNextIterationNumber(chapterId, sectionNumber);
    setIteration(nextIter);
    const nowStr = getPersianNowString();
    setCustomDate(nowStr);
    setNote('');
    setValidationError(null);
  };

  const handleSave = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setValidationError('لطفاً شرح کوتاهی از این نوبت مطالعه (مانند روز، زمان یا یادداشت خود) را بنویسید یا از پیشنهادهای آماده زیر انتخاب نمایید.');
      return;
    }

    setValidationError(null);

    if (editingSessionId) {
      updateReadingSession(chapterId, sectionNumber, editingSessionId, {
        iteration,
        note: trimmed,
        customDisplayDate: customDate || getPersianNowString(),
      });
      setEditingSessionId(null);
    } else {
      addReadingSession(chapterId, sectionNumber, {
        iteration,
        note: trimmed,
        customDisplayDate: customDate || getPersianNowString(),
      });
    }

    const updatedList = refreshSessions();

    // Prepare next entry cleanly
    const nextIter = getNextIterationNumber(chapterId, sectionNumber);
    setIteration(nextIter);
    const nowStr = getPersianNowString();
    setCustomDate(nowStr);
    setNote('');

    if (onSaved && updatedList.length > 0) {
      const latest = updatedList[updatedList.length - 1];
      onSaved({
        ...latest,
        chapterId,
        sectionNumber,
        totalReads: updatedList.length,
      });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteReadingSession(chapterId, sectionNumber, sessionId);
    setConfirmDeleteId(null);
    if (editingSessionId === sessionId) {
      handleCancelEdit();
    }
    const updated = refreshSessions();
    if (updated.length === 0 && onRemoved) {
      onRemoved();
    }
  };

  const handleClearAll = () => {
    clearAllSectionSessions(chapterId, sectionNumber);
    setConfirmClearAll(false);
    refreshSessions();
    handleCancelEdit();
    if (onRemoved) {
      onRemoved();
    }
    onClose();
  };

  const setPreset = (presetText: string) => {
    setNote(presetText);
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0c121e] border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/40 bg-[#111828] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-amber-100">
                  ثبت و یادداشت مطالعه بخش
                </h3>
                {sessions.length > 0 ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    ✓ {toPersianDigits(sessions.length)} بار مطالعه شده
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    هنوز مطالعه نشده
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {chapterTitle} • بخش {toPersianDigits(sectionNumber)}: {sectionTitle}
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto text-right">
          {openingVerse && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-amber-200/80 font-poetry">
              مصراع آغازین: « {openingVerse} »
            </div>
          )}

          {/* Section 1: Past reading sessions history */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>تاریخچه نوبت‌های مطالعه این بخش:</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                مجموع: <strong className="text-amber-300">{toPersianDigits(sessions.length)}</strong> نوبت
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
                <p>تاکنون نوبتی برای مطالعه این بخش ثبت نکرده‌اید.</p>
                <p className="text-[11px] text-slate-500">
                  می‌توانید اولین نوبت را در فرم زیر با یادداشت و زمان دلخواه ثبت نمایید.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isEditingThis = editingSessionId === s.id;
                  const isConfirmingDelete = confirmDeleteId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isEditingThis
                          ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <span>{getIterationLabel(s.iteration)}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{s.displayDate}</span>
                          </span>
                        </div>

                        {/* Actions for this reading session */}
                        <div className="flex items-center gap-1">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-800 text-xs text-rose-300 animate-in fade-in">
                              <span>حذف شود؟</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(s.id)}
                                className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-500"
                              >
                                بله
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                              >
                                خیر
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(s)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                                title="ویرایش این نوبت مطالعه"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="حذف این نوبت"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans select-text">
                        {s.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Active Registration / Editing Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0f1726] border border-amber-600/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                {editingSessionId ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ویرایش اطلاعات نوبت مطالعه:</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ثبت یک نوبت جدید از مطالعه این بخش:</span>
                  </>
                )}
              </h4>

              {editingSessionId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>انصراف و رفتن به نوبت جدید</span>
                </button>
              )}
            </div>

            {/* Iteration Selector: چندمین مطالعه است؟ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <span>تعیین نوبت مطالعه (چندمین مطالعه):</span>
                  <span className="text-amber-400 text-xs font-bold">
                    {getIterationLabel(iteration)}
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  (می‌توانید نوبت را دستی تغییر دهید)
                </span>
              </div>

              {/* Stepper + Direct number input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIteration(Math.max(1, iteration - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/50 flex items-center justify-center font-bold text-base transition-colors"
                  title="نوبت قبلی"
                >
                  -
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={iteration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        setIteration(val);
                      }
                    }}
                    className="w-full text-center py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl font-bold text-amber-300 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                    نوبت
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIteration(iteration + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/50 flex items-center justify-center font-bold text-base transition-colors"
                  title="نوبت بعدی"
                >
                  +
                </button>
              </div>

              {/* Quick iteration selector pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setIteration(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      iteration === num
                        ? 'bg-amber-500/30 text-amber-300 border-amber-500 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {getIterationShortLabel(num)}
                  </button>
                ))}
              </div>
            </div>

            {/* Note & Description Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                شرح کوتاهی از این نوبت مطالعه (مثلاً روز، زمان، احساس یا بازخوانی):
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="روز، زمان یا شرح کوتاهی از این نوبت مطالعه را بنویسید (مثلاً: روز دوشنبه ساعت ۱۸ - مرور همراه با شاهنامه‌خوانی صوتی و یادداشت واژگان)..."
                className={`w-full p-3 rounded-xl bg-slate-950 border focus:ring-1 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none leading-relaxed ${
                  validationError
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/50'
                    : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500'
                }`}
              />
              {validationError && (
                <p className="text-xs text-rose-400 font-medium animate-in fade-in flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* Quick Presets for Note */}
            <div>
              <span className="text-[11px] text-slate-400 mb-1.5 block">پیشنهادهای آماده شرح مطالعه:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreset(`مطالعه ${getIterationLabel(iteration)} در ${getPersianNowString()}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>هم‌اکنون ({getPersianNowString()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(`دور ${toPersianDigits(iteration)} - روخوانی کامل و آهنگین ابیات`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                >
                  روخوانی کامل
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(`دور ${toPersianDigits(iteration)} - واژه‌شناسی، معانی و اعلام شاهنامه`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                >
                  واژه‌شناسی و معانی
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(`دور ${toPersianDigits(iteration)} - مطالعه شبانه و تفکر در پندهای حکیم`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                >
                  مطالعه شبانه و پندها
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(`دور ${toPersianDigits(iteration)} - حفظ گزیده ابیات شاخص`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                >
                  حفظ ابیات
                </button>
              </div>
            </div>

            {/* Save Button for active form */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingSessionId
                    ? `بروزرسانی ${getIterationShortLabel(iteration)}`
                    : `ثبت ${getIterationLabel(iteration)}`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#111828] flex items-center justify-between gap-2 flex-shrink-0">
          {sessions.length > 0 ? (
            confirmClearAll ? (
              <div className="flex items-center gap-2 bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800 text-xs text-rose-300">
                <span>تمام نوبت‌ها حذف شود؟</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  بله، حذف کل
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  انصراف
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-colors flex items-center gap-1"
                title="پاک کردن تمامی نوبت‌های ثبت‌شده برای این بخش"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف تمام نوبت‌های این بخش</span>
              </button>
            )
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
