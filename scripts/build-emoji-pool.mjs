/**
 * RGI + emoji-test(자격 유형) + iamcal + JoyPixels + FE0F 확장 → 약 1만 개 이모지 문자열
 * 실행: node scripts/build-emoji-pool.mjs  (저장소 루트에서, 네트워크로 데이터 다운로드)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function download(url, dest) {
  execSync(`curl.exe -sL "${url}" -o "${dest}"`, { stdio: 'inherit' });
}

function parseSequencesText(text) {
  const set = new Set();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(';');
    if (idx === -1) continue;
    const left = line.slice(0, idx).trim();
    if (!left) continue;
    if (left.includes('..')) {
      const [a, b] = left.split('..').map((s) => s.trim());
      if (a.includes(' ') || b.includes(' ')) continue;
      const start = parseInt(a, 16);
      const end = parseInt(b, 16);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      for (let cp = start; cp <= end; cp += 1) {
        try {
          set.add(String.fromCodePoint(cp));
        } catch {
          /* skip */
        }
      }
    } else {
      const cps = left.split(/\s+/).map((h) => parseInt(h, 16)).filter((n) => !Number.isNaN(n));
      if (cps.length === 0) continue;
      try {
        set.add(String.fromCodePoint(...cps));
      } catch {
        /* skip */
      }
    }
  }
  return set;
}

function parseEmojiTest(text) {
  const set = new Set();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const semi = line.indexOf(';');
    if (semi < 0) continue;
    const left = line.slice(0, semi).trim();
    const rest = line.slice(semi + 1);
    const typ = rest.trim().split(/\s+/)[0];
    if (!['fully-qualified', 'minimally-qualified', 'unqualified', 'component'].includes(typ)) continue;
    const cps = left.split(/\s+/).filter(Boolean).map((x) => parseInt(x, 16));
    try {
      set.add(String.fromCodePoint(...cps));
    } catch {
      /* skip */
    }
  }
  return set;
}

function addIamcal(jsonPath, set) {
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  function addUnified(u) {
    if (!u) return;
    const cps = u.split('-').map((h) => parseInt(h, 16));
    try {
      set.add(String.fromCodePoint(...cps));
    } catch {
      /* skip */
    }
  }
  for (const e of j) {
    addUnified(e.unified);
    if (e.skin_variations) {
      for (const k of Object.keys(e.skin_variations)) {
        addUnified(e.skin_variations[k].unified);
      }
    }
  }
}

function addJoyPixels(jsonPath, set) {
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  function addHex(h) {
    if (!h) return;
    const cps = h.split('-').map((x) => parseInt(x, 16));
    try {
      set.add(String.fromCodePoint(...cps));
    } catch {
      /* skip */
    }
  }
  for (const k of Object.keys(j)) {
    const e = j[k];
    addHex(e.code_points?.fully_qualified);
    addHex(e.code_points?.base);
    if (e.diversity_children) {
      for (const c of e.diversity_children) {
        addHex(j[c]?.code_points?.fully_qualified);
      }
    }
  }
}

function expandFe0f(set) {
  for (const s of [...set]) {
    if (!s.endsWith('\uFE0F')) set.add(s + '\uFE0F');
  }
}

const cache = path.join(root, '.emoji-build-cache');
if (!fs.existsSync(cache)) fs.mkdirSync(cache, { recursive: true });

const fSeq = path.join(cache, 'emoji-sequences.txt');
const fZwj = path.join(cache, 'emoji-zwj-sequences.txt');
const fTest = path.join(cache, 'emoji-test.txt');
const fCal = path.join(cache, 'emoji-cal.json');
const fJoy = path.join(cache, 'joypixels-emoji.json');

if (!fs.existsSync(fSeq)) {
  download('https://unicode.org/Public/emoji/15.1/emoji-sequences.txt', fSeq);
}
if (!fs.existsSync(fZwj)) {
  download('https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt', fZwj);
}
if (!fs.existsSync(fTest)) {
  download('https://unicode.org/Public/emoji/15.1/emoji-test.txt', fTest);
}
if (!fs.existsSync(fCal)) {
  download('https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json', fCal);
}
if (!fs.existsSync(fJoy)) {
  download('https://raw.githubusercontent.com/joypixels/emoji-toolkit/master/emoji.json', fJoy);
}

const all = new Set([
  ...parseSequencesText(fs.readFileSync(fSeq, 'utf8')),
  ...parseSequencesText(fs.readFileSync(fZwj, 'utf8')),
]);
addIamcal(fCal, all);
for (const x of parseEmojiTest(fs.readFileSync(fTest, 'utf8'))) {
  all.add(x);
}
expandFe0f(all);
addJoyPixels(fJoy, all);
expandFe0f(all);

const arr = [...all];
arr.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const outPath = path.join(root, 'emoji-pool.js');
const banner = `/* ${arr.length} emoji strings — rebuild: node scripts/build-emoji-pool.mjs */\n`;
const body = `${banner}(function (g) {
  'use strict';
  g.__GAME_EMOJI_POOL__ = ${JSON.stringify(arr)};
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(outPath, body, 'utf8');
console.log('Wrote', outPath, '—', arr.length, 'strings,', (Buffer.byteLength(body, 'utf8') / 1024).toFixed(1), 'KiB');
