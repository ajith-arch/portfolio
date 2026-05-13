#!/usr/bin/env node
/**
 * Writes manifest.json next to WebP assets in:
 *   assets/university of utah campus store-apple/
 * (numeric filename sort)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'assets', 'university of utah campus store-apple');

const files = fs
  .readdirSync(root)
  .filter((f) => /\.(webp|png|jpe?g|gif|webm|mp4)$/i.test(f))
  .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));

const manifest = {
  version: 1,
  base: '../assets/university%20of%20utah%20campus%20store-apple/',
  generated: new Date().toISOString(),
  items: files.map((f) => ({ file: f })),
};

const out = path.join(root, 'manifest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Wrote ${out} (${files.length} items)`);
