// Platinum Road — a GTA VI trophy guide for gta6-trophy-guide-01 (Node 22, standard
// library only). The guide itself lives in app/: plain static files a browser opens
// at app/index.html — HTML, ES modules and CSS, no build step, and nothing fetched
// over the network while it runs. Its trophy data is app/data/trophies.json: the 55
// official PlayStation 5 trophies (1 platinum, 2 gold, 6 silver, 46 bronze), each
// with a guide written in our own words, a six-phase roadmap to the platinum, a
// missables view, filters, a spoiler setting, and progress saved in the browser
// with export and import. This program is the hand-in: it first checks the trophy
// list is exactly the official 55, then copies app/ and screenshots/ from beside
// this file to /output, and writes /output/dossier.json — the summary the judge
// reads (the screenshots, the first load's files and bytes, and the source) —
// with the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is:
// the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// To run the guide locally: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The official list is 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze.
// Refuse to build if the data has drifted — a wrong list would hand the judge a
// guide that disagrees with the official trophy names, descriptions and grades.
const trophies = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8')).trophies;
const expectedGrades = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const gradeCounts = {};
for (const trophy of trophies) gradeCounts[trophy.grade] = (gradeCounts[trophy.grade] ?? 0) + 1;
if (trophies.length !== 55) throw new Error(`expected 55 trophies, found ${trophies.length}`);
for (const [grade, expected] of Object.entries(expectedGrades)) {
  if (gradeCounts[grade] !== expected) throw new Error(`expected ${expected} ${grade} trophies, found ${gradeCounts[grade] ?? 0}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): text_max_bytes is the only one that
// shapes the bytes; the rest refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB, more than 993 files and directories in app/
// or 48 MiB of app files (app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(`Platinum Road built: ${trophies.length} trophies (${gradeCounts.platinum} platinum, ${gradeCounts.gold} gold, ${gradeCounts.silver} silver, ${gradeCounts.bronze} bronze), dossier.json ${dossierBytes} bytes.`);
