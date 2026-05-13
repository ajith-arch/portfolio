#!/usr/bin/env node
/**
 * Scans assets/solar or assets/assest and writes manifest.json with files
 * ordered by English number words (one…twenty), not alphabetical.
 *
 * Usage: node scripts/generate-solar-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const WORD_ORDER = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  ninteen: 19,
  twenty: 20,
};

const MEDIA_EXT = new Set(['.webp', '.gif', '.jpg', '.jpeg', '.png', '.avif', '.mp4', '.webm', '.mov']);

const EXT_RANK = {
  '.webp': 0,
  '.jpg': 0,
  '.jpeg': 0,
  '.png': 0,
  '.avif': 0,
  '.gif': 1,
  '.mp4': 2,
  '.webm': 2,
  '.mov': 3,
};

function parseOrderKey(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  const n = WORD_ORDER[base];
  if (n == null) return null;
  return { base, n };
}

function rankExt(filename) {
  const ext = path.extname(filename).toLowerCase();
  return EXT_RANK[ext] ?? 99;
}

function pickAssetDir() {
  const assest = path.join(root, 'assets', 'assest');
  const solar = path.join(root, 'assets', 'solar');
  if (fs.existsSync(assest) && fs.statSync(assest).isDirectory()) return assest;
  return solar;
}

function main() {
  const dir = pickAssetDir();
  const relFromRoot = path.relative(root, dir).split(path.sep).join('/');
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => MEDIA_EXT.has(path.extname(name).toLowerCase()))
    .filter((name) => name.toLowerCase() !== 'manifest.json');

  const parsed = files
    .map((name) => ({ name, key: parseOrderKey(name) }))
    .filter((x) => x.key != null);

  const skipped = files.filter((name) => parseOrderKey(name) == null);
  if (skipped.length) {
    console.warn('Skipping files without recognized word prefix:', skipped.join(', '));
  }

  parsed.sort((a, b) => {
    if (a.key.n !== b.key.n) return a.key.n - b.key.n;
    return rankExt(a.name) - rankExt(b.name);
  });

  const manifest = {
    version: 1,
    base: `../${relFromRoot}/`,
    generated: new Date().toISOString(),
    items: parsed.map((p) => ({ file: p.name })),
  };

  const outPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${outPath} (${manifest.items.length} items) from ${dir}`);
}

main();
