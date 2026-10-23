import https from 'https';
import fs from 'fs';
import path from 'path';

const cats = JSON.parse(fs.readFileSync('src/data/ganjoor_data_cats.json', 'utf8'));

// Read parsed sections count from chapterSections
const sectionsFile = fs.readFileSync('src/data/chapterSections.ts', 'utf8');
const matchSections = sectionsFile.match(/CHAPTER_SECTIONS: Record<number, ChapterSection\[\]> = (\{[\s\S]*?\});/);
const sectionsMap = matchSections ? JSON.parse(matchSections[1]) : {};

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function parseVerses(rawVerses) {
  if (!Array.isArray(rawVerses)) return [];
  const map = {};
  for (const v of rawVerses) {
    const idx = v.CoupletIndex ?? 0;
    if (!map[idx]) map[idx] = { m1: '', m2: '', summary: '' };
    if (v.Position === 'Right') {
      map[idx].m1 = v.Text || '';
      if (v.CoupletSummary) map[idx].summary = v.CoupletSummary;
    } else if (v.Position === 'Left') {
      map[idx].m2 = v.Text || '';
    }
  }
  return Object.values(map).filter((c) => c.m1 && c.m2);
}

// Queue runner with concurrency limit
async function runWithConcurrency(tasks, limit = 20) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`Starting download of verses for 61 chapters...`);
  const outDir = path.resolve('public/data/verses');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const allTasks = [];

  for (let chId = 1; chId <= 61; chId++) {
    const cat = cats[chId - 1];
    const catSlug = cat ? cat.FullUrl.replace('/ferdousi/shahname/', '') : '';
    const chapterSections = sectionsMap[chId] || [];
    const secCount = chapterSections.length;

    allTasks.push({
      chId,
      catSlug,
      title: cat?.Title || `فصل ${chId}`,
      secCount,
    });
  }

  let totalDownloadedVerses = 0;
  let totalDownloadedSections = 0;

  for (const item of allTasks) {
    const { chId, catSlug, title, secCount } = item;
    const destFile = path.join(outDir, `ch_${chId}.json`);

    // Fetch all sections of this chapter
    const sectionTasks = [];
    for (let s = 1; s <= secCount; s++) {
      sectionTasks.push(async () => {
        const url = `https://raw.githubusercontent.com/ganjoor/ganjoor-data/master/poets/ferdousi/shahname/${catSlug}/sh${s}.json`;
        const json = await fetchJson(url);
        if (json && json.Verses) {
          return { secNumber: s, couplets: parseVerses(json.Verses) };
        }
        return { secNumber: s, couplets: [] };
      });
    }

    const secResults = await runWithConcurrency(sectionTasks, 15);
    const sectionsObj = {};
    let chVersesCount = 0;

    for (const res of secResults) {
      sectionsObj[res.secNumber] = res.couplets;
      chVersesCount += res.couplets.length;
      if (res.couplets.length > 0) totalDownloadedSections++;
    }

    totalDownloadedVerses += chVersesCount;

    const outputData = {
      chapterId: chId,
      title,
      sectionsCount: secCount,
      versesCount: chVersesCount,
      sections: sectionsObj,
    };

    fs.writeFileSync(destFile, JSON.stringify(outputData), 'utf8');
    console.log(`Chapter ${chId} (${title}): ${secCount} sections, ${chVersesCount} verses saved.`);
  }

  console.log(`Download finished! Total sections: ${totalDownloadedSections}, Total couplets: ${totalDownloadedVerses}`);
}

main().catch(console.error);
