#!/usr/bin/env node
/**
 * Enumerate hotel media on Cloudinary once, at build time, and write
 * data/hotel-media.json.
 *
 * The browser used to discover images by requesting candidate URLs and watching
 * for 404s — ~623 requests per hotel page, 81% of them misses. That work is the
 * same either way; doing it here means visitors never pay for it.
 *
 * Run after adding, removing, or renaming any image in the Cloudinary
 * hotel_images/ folder:
 *
 *     node scripts/build-hotel-media-manifest.mjs
 *
 * A folder listed in `folders` has been exhaustively checked: if one of its
 * images is absent from `images`, it does not exist. Folders NOT listed are
 * unknown, and the site falls back to probing them at runtime — so a hotel
 * added to the sheet before the next manifest build still renders.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'data/hotel-media.json');

const SHEET_URL =
  'https://opensheet.elk.sh/1v3F_YYEJl1mhoN9Hs2F6ee8SzXjsbJdGvXqczB9LKL4/Form%20Responses%201';
const CLOUD_NAME = 'dnehzxjhl';
const PROBE_TRANSFORM = 'q_auto,f_auto,c_limit,w_40';
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const LOGICAL_ROOT = '/assets/hotel_images';

/** Root-folder image names, mirroring HOTEL_ROOT_IMAGE_NAMES. */
const ROOT_IMAGE_NAMES = ['1', '2', '3', '4', 'add_image'];
/** Section folders keep numbering contiguously; stop after this many misses. */
const LOOKAHEAD = 2;
const MAX_SLOTS = 40;
const CONCURRENCY = 12;

const SECTIONS = [
  { key: 'rooms', prefix: 'room', field: 'Room Types' },
  { key: 'restaurants', prefix: 'res', field: 'Restaurant Names' },
  { key: 'facilities', prefix: 'fac', field: 'Facilities' },
  { key: 'wellness', prefix: 'well', field: 'Wellness' }
];

/** Mirrors slugifyHotelName() in js/hotels-route.js. */
function slugifyHotelName(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Mirrors parseDashSeparatedItems() in js/hotels-route.js. */
function parseDashSeparatedItems(value) {
  const text = String(value || '');
  const parts = text.includes(' - ') ? text.split(/\s+-\s+/) : text.split('- ');
  return parts.map((item) => item.trim()).filter(Boolean);
}

function toPublicId(logicalPath) {
  return logicalPath.replace(/^\/assets\//, '');
}

let active = 0;
const queue = [];
function withLimit(task) {
  if (active < CONCURRENCY) {
    active += 1;
    return Promise.resolve()
      .then(task)
      .finally(() => {
        active -= 1;
        const next = queue.shift();
        if (next) next();
      });
  }
  return new Promise((res, rej) => queue.push(() => withLimit(task).then(res, rej)));
}

let requests = 0;
async function imageExists(logicalPath) {
  return withLimit(async () => {
    requests += 1;
    const url = `${BASE}/${PROBE_TRANSFORM}/${toPublicId(logicalPath)}`;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await fetch(url, { method: 'GET' });
        await res.arrayBuffer();
        if (res.status === 200) return true;
        if (res.status === 404) return false;
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
    throw new Error(`Could not determine existence of ${logicalPath}`);
  });
}

/** Contiguous numbered images in a section folder, plus add_image if present. */
async function enumerateSectionFolder(folder) {
  const found = [];
  let slot = 1;
  let misses = 0;
  while (slot <= MAX_SLOTS && misses < LOOKAHEAD) {
    const path = `${folder}/${slot}`;
    if (await imageExists(path)) {
      if (misses > 0) break; // a gap ends the gallery, matching runtime semantics
      found.push(path);
    } else {
      misses += 1;
    }
    slot += 1;
  }
  const addImage = `${folder}/add_image`;
  if (await imageExists(addImage)) found.push(addImage);
  return found;
}

async function enumerateRootFolder(folder) {
  const results = await Promise.all(
    ROOT_IMAGE_NAMES.map(async (name) => ((await imageExists(`${folder}/${name}`)) ? `${folder}/${name}` : ''))
  );
  return results.filter(Boolean);
}

async function main() {
  process.stdout.write('Fetching hotel sheet…\n');
  const rows = await fetch(SHEET_URL).then((r) => r.json());

  const images = new Set();
  const folders = new Set();
  const started = Date.now();

  for (const row of rows) {
    const slug = slugifyHotelName(row.Slug || row.Name || '');
    if (!slug) continue;

    const rootFolder = `${LOGICAL_ROOT}/${slug}`;
    const rootImages = await enumerateRootFolder(rootFolder);
    folders.add(rootFolder);
    rootImages.forEach((p) => images.add(p));

    let count = 0;
    for (const section of SECTIONS) {
      const items = parseDashSeparatedItems(row[section.field]);
      const perItem = await Promise.all(
        items.map((_, index) => enumerateSectionFolder(`${rootFolder}/${section.key}/${section.prefix}${index + 1}`))
      );
      items.forEach((_, index) => folders.add(`${rootFolder}/${section.key}/${section.prefix}${index + 1}`));
      perItem.flat().forEach((p) => images.add(p));
      count += perItem.flat().length;
    }
    process.stdout.write(`  ${slug.padEnd(38)} root=${rootImages.length} section=${count}\n`);
  }

  const manifest = {
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    cloudName: CLOUD_NAME,
    folders: [...folders].sort(),
    images: [...images].sort()
  };

  await writeFile(OUT, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `\nWrote ${OUT}\n  ${manifest.images.length} images across ${manifest.folders.length} folders\n` +
      `  ${requests} build-time requests in ${((Date.now() - started) / 1000).toFixed(1)}s\n`
  );
}

main().catch((error) => {
  process.stderr.write(`\nManifest build failed: ${error.message}\n`);
  process.stderr.write('Existing data/hotel-media.json left untouched.\n');
  process.exit(1);
});
