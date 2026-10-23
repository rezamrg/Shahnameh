import JSZip from 'jszip';
import html2pdf from 'html2pdf.js';
import { Chapter } from '../data/chapters';
import { ChapterSection } from '../data/chapterSections';
import { Couplet, getSectionVerses } from '../services/verseService';
import { toPersianDigits } from './persianNumbers';

export interface ExportSectionItem {
  chapterId: number;
  chapterTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  openingVerse: string;
  couplets: Couplet[];
}

export interface ExportOptions {
  format: 'word' | 'pdf' | 'txt' | 'json';
  includeMeaning: boolean;
  includeVerseNumbers: boolean;
  includeHeaderInfo: boolean;
  layout: 'couplet' | 'single-line';
  documentTitle: string;
}

/**
 * Loads couplets for a given list of sections
 */
export async function gatherSectionsData(
  items: Array<{ chapter: Chapter; section: ChapterSection }>,
  onProgress?: (loaded: number, total: number) => void
): Promise<ExportSectionItem[]> {
  const result: ExportSectionItem[] = [];
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const { chapter, section } = items[i];
    const res = await getSectionVerses(chapter.id, section.sectionNumber);
    result.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      sectionNumber: section.sectionNumber,
      sectionTitle: section.title,
      openingVerse: section.openingVerse,
      couplets: res.couplets || [],
    });
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return result;
}

/**
 * Helper to sanitize filenames for OS compatibility
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Generates an HTML-based Microsoft Word document (.doc) with Persian RTL styles
 */
export function generateWordDocument(
  sections: ExportSectionItem[],
  options: ExportOptions
): Blob {
  let bodyContent = '';

  bodyContent += `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #d4af37; padding-bottom: 20px;">
      <h1 style="font-size: 24pt; color: #8b0000; margin: 0; font-family: 'B Nazanin', 'Vazirmatn', Tahoma, sans-serif;">شاهنامه فردوسی</h1>
      <h2 style="font-size: 18pt; color: #333333; margin: 8px 0; font-weight: normal;">${options.documentTitle}</h2>
      <p style="font-size: 11pt; color: #666666;">بر اساس نسخه‌شناسی و دسته‌بندی پایگاه گنجور • سامانه شاهنامه فردوسی</p>
    </div>
  `;

  let currentChapterId: number | null = null;

  for (const sec of sections) {
    if (sec.chapterId !== currentChapterId) {
      currentChapterId = sec.chapterId;
      if (options.includeHeaderInfo) {
        bodyContent += `
          <div style="margin-top: 35px; margin-bottom: 15px; page-break-before: ${bodyContent.length > 500 ? 'always' : 'auto'};">
            <h2 style="font-size: 18pt; color: #7f1d1d; border-right: 4px solid #d97706; padding-right: 12px; margin: 0;">
              ${sec.chapterTitle}
            </h2>
          </div>
        `;
      }
    }

    bodyContent += `
      <div style="margin-top: 25px; margin-bottom: 20px;">
        <h3 style="font-size: 14pt; color: #92400e; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
          بخش ${toPersianDigits(sec.sectionNumber)}: ${sec.sectionTitle}
        </h3>
        <p style="font-size: 10.5pt; color: #6b7280; font-style: italic; margin-top: 2px; margin-bottom: 12px;">
          مصراع آغازین: « ${sec.openingVerse} »
        </p>
    `;

    if (sec.couplets.length === 0) {
      bodyContent += `<p style="font-size: 11pt; color: #999;">ابیاتی برای این بخش ثبت نشده است.</p></div>`;
      continue;
    }

    bodyContent += `
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
    `;

    sec.couplets.forEach((c, idx) => {
      const verseNum = options.includeVerseNumbers ? `(${toPersianDigits(idx + 1)})` : '';

      if (options.layout === 'couplet') {
        bodyContent += `
          <tr style="border-bottom: 1px dotted #e5e7eb;">
            <td style="width: 46%; text-align: right; font-size: 12pt; padding: 6px 4px; font-weight: bold; color: #1e293b;">
              « ${c.m1} »
            </td>
            <td style="width: 8%; text-align: center; font-size: 9pt; color: #94a3b8;">
              ${verseNum}
            </td>
            <td style="width: 46%; text-align: left; font-size: 12pt; padding: 6px 4px; font-weight: bold; color: #1e293b;">
              « ${c.m2} »
            </td>
          </tr>
        `;
      } else {
        bodyContent += `
          <tr style="border-bottom: 1px dotted #e5e7eb;">
            <td style="text-align: right; font-size: 12pt; padding: 4px; font-weight: bold; color: #1e293b;">
              <span style="color: #94a3b8; font-size: 9pt; margin-left: 6px;">${verseNum}</span>
              ${c.m1} / ${c.m2}
            </td>
          </tr>
        `;
      }

      if (options.includeMeaning && c.summary) {
        bodyContent += `
          <tr>
            <td colspan="${options.layout === 'couplet' ? '3' : '1'}" style="padding: 2px 8px 8px 8px; font-size: 10pt; color: #64748b; background-color: #f8fafc; border-radius: 4px;">
              <span style="color: #b45309; font-weight: bold;">معنی: </span>${c.summary}
            </td>
          </tr>
        `;
      }
    });

    bodyContent += `</table></div>`;
  }

  const htmlDocument = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>${options.documentTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 45pt 45pt 45pt 45pt;
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
            mso-gutter-direction: rtl;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'B Nazanin', 'Vazirmatn', 'Traditional Arabic', Tahoma, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${bodyContent}
        </div>
      </body>
    </html>
  `;

  return new Blob(['\ufeff' + htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
}

/**
 * Builds standard clean HTML markup for PDF generation
 */
export function buildHtmlForPdf(
  sections: ExportSectionItem[],
  options: ExportOptions
): string {
  let html = `
    <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; text-align: right; color: #1e293b; padding: 15px; line-height: 1.6;">
      <div style="text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 14px; margin-bottom: 24px;">
        <h1 style="color: #7f1d1d; font-size: 22px; margin: 0 0 4px 0;">شاهنامه فردوسی</h1>
        <h2 style="color: #334155; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">${options.documentTitle}</h2>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">بر پایه دسته‌بندی گنجور • سامانه شاهنامه فردوسی</p>
      </div>
  `;

  let currentChapterId: number | null = null;

  for (const sec of sections) {
    if (sec.chapterId !== currentChapterId) {
      currentChapterId = sec.chapterId;
      if (options.includeHeaderInfo) {
        html += `
          <div style="color: #881337; font-size: 18px; font-weight: bold; border-right: 4px solid #d97706; padding-right: 8px; margin: 24px 0 12px 0; page-break-after: avoid;">
            ${sec.chapterTitle}
          </div>
        `;
      }
    }

    html += `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <div style="color: #92400e; font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          بخش ${toPersianDigits(sec.sectionNumber)}: ${sec.sectionTitle}
        </div>
        <div style="font-size: 11.5px; color: #64748b; margin-bottom: 10px;">مصراع آغازین: « ${sec.openingVerse} »</div>
    `;

    sec.couplets.forEach((c, idx) => {
      const vNum = options.includeVerseNumbers ? `<span style="font-size: 10px; color: #94a3b8; margin: 0 6px;">(${toPersianDigits(idx + 1)})</span>` : '';
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #e2e8f0; font-size: 14px;">
          <div style="width: 47%; text-align: right;">« ${c.m1} »</div>
          ${vNum}
          <div style="width: 47%; text-align: left;">« ${c.m2} »</div>
        </div>
      `;

      if (options.includeMeaning && c.summary) {
        html += `
          <div style="background: #f8fafc; border-radius: 4px; padding: 4px 8px; font-size: 11px; color: #475569; margin: 3px 0 6px 0;">
            <strong style="color: #b45309;">معنی: </strong>${c.summary}
          </div>
        `;
      }
    });

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Directly downloads a PDF file to user's computer without opening any preview window
 */
export async function downloadDirectPdf(
  sections: ExportSectionItem[],
  options: ExportOptions,
  filename: string
): Promise<void> {
  // Create an off-screen container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // ~A4 width in 96dpi
  container.style.background = '#ffffff';
  container.innerHTML = buildHtmlForPdf(sections, options);

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 1.8, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(container).save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generates a clean text file (.txt)
 */
export function generateTextDocument(
  sections: ExportSectionItem[],
  options: ExportOptions
): Blob {
  let text = `==================================================\n`;
  text += `شاهنامه فردوسی - ${options.documentTitle}\n`;
  text += `بر پایه داده‌های وب‌سایت گنجور\n`;
  text += `==================================================\n\n`;

  let currentChapterId: number | null = null;

  for (const sec of sections) {
    if (sec.chapterId !== currentChapterId) {
      currentChapterId = sec.chapterId;
      if (options.includeHeaderInfo) {
        text += `\n##################################################\n`;
        text += `${sec.chapterTitle}\n`;
        text += `##################################################\n\n`;
      }
    }

    text += `--- بخش ${toPersianDigits(sec.sectionNumber)}: ${sec.sectionTitle} ---\n`;
    text += `مصراع آغازین: ${sec.openingVerse}\n\n`;

    sec.couplets.forEach((c, idx) => {
      const num = options.includeVerseNumbers ? `[${toPersianDigits(idx + 1)}] ` : '';
      text += `${num}${c.m1} / ${c.m2}\n`;
      if (options.includeMeaning && c.summary) {
        text += `   معنی: ${c.summary}\n`;
      }
    });

    text += `\n`;
  }

  return new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
}

/**
 * Generates JSON blob for sections
 */
export function generateJsonDocument(
  sections: ExportSectionItem[],
  options: ExportOptions
): Blob {
  const data = {
    title: options.documentTitle,
    generatedAt: new Date().toISOString(),
    totalSections: sections.length,
    items: sections,
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

/**
 * Generates a ZIP archive containing separate files for each individual section or chapter.
 * Fulfills the user requirement:
 * "اگر ۱۳ بخش را انتخاب کرد، فایل بصورت تک به تک در فایلی جدا آورده شود"
 */
export async function generateZipArchive(
  sections: ExportSectionItem[],
  options: ExportOptions,
  groupBy: 'by-section' | 'by-chapter',
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const format = options.format;
  const ext = format === 'word' ? 'doc' : format === 'txt' ? 'txt' : format === 'json' ? 'json' : 'doc';

  if (groupBy === 'by-section') {
    // Generate individual file for EACH section
    const total = sections.length;
    for (let i = 0; i < total; i++) {
      const sec = sections[i];
      const sectionOpt: ExportOptions = {
        ...options,
        documentTitle: `${sec.chapterTitle} - بخش ${sec.sectionNumber} (${sec.sectionTitle})`,
      };

      const fileName = `فصل_${toPersianDigits(sec.chapterId)}_بخش_${toPersianDigits(sec.sectionNumber)}_${sanitizeFileName(sec.sectionTitle)}.${ext}`;

      if (format === 'word' || format === 'pdf') {
        // In zip, word (.doc) format gives rich RTL formatted individual documents
        const blob = generateWordDocument([sec], sectionOpt);
        zip.file(fileName, blob);
      } else if (format === 'txt') {
        const blob = generateTextDocument([sec], sectionOpt);
        zip.file(fileName, blob);
      } else if (format === 'json') {
        const blob = generateJsonDocument([sec], sectionOpt);
        zip.file(fileName, blob);
      }

      if (onProgress) {
        const pct = Math.round(((i + 1) / total) * 90);
        onProgress(pct, `افزودن بخش ${toPersianDigits(i + 1)} از ${toPersianDigits(total)} به فایل فشرده...`);
      }
    }
  } else {
    // Group by chapter: Generate individual file for EACH chapter
    const chapterMap = new Map<number, ExportSectionItem[]>();
    for (const sec of sections) {
      if (!chapterMap.has(sec.chapterId)) {
        chapterMap.set(sec.chapterId, []);
      }
      chapterMap.get(sec.chapterId)!.push(sec);
    }

    const chapterEntries = Array.from(chapterMap.entries());
    const total = chapterEntries.length;

    for (let i = 0; i < total; i++) {
      const [chId, chSections] = chapterEntries[i];
      const chapterTitle = chSections[0]?.chapterTitle || `فصل ${chId}`;
      const chapterOpt: ExportOptions = {
        ...options,
        documentTitle: chapterTitle,
      };

      const fileName = `فصل_${toPersianDigits(chId)}_${sanitizeFileName(chapterTitle)}.${ext}`;

      if (format === 'word' || format === 'pdf') {
        const blob = generateWordDocument(chSections, chapterOpt);
        zip.file(fileName, blob);
      } else if (format === 'txt') {
        const blob = generateTextDocument(chSections, chapterOpt);
        zip.file(fileName, blob);
      } else if (format === 'json') {
        const blob = generateJsonDocument(chSections, chapterOpt);
        zip.file(fileName, blob);
      }

      if (onProgress) {
        const pct = Math.round(((i + 1) / total) * 90);
        onProgress(pct, `افزودن فصل ${toPersianDigits(i + 1)} از ${toPersianDigits(total)} به فایل فشرده...`);
      }
    }
  }

  if (onProgress) {
    onProgress(95, 'در حال فشرده‌سازی نهایی فایل ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Triggers direct browser download of a blob
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
