/**
 * Shared hotel image discovery (probes Cloudinary delivery URLs).
 */

import {
    HOTEL_IMAGE_LOGICAL_ROOT,
    HOTEL_IMAGE_ROOT,
    appendCloudinaryCacheBust,
    buildLogicalImagePath,
    getAddImageLogicalPath,
    getCloudinaryImageUrl,
    getHotelSlugFromLogicalPath,
    IMAGE_TRANSFORMS
} from './hotel-cloudinary.js';

export { HOTEL_IMAGE_ROOT, HOTEL_IMAGE_LOGICAL_ROOT };

export const HOTEL_IMAGE_SLOTS = [1, 2, 3, 4];
export const HOTEL_ROOT_IMAGE_NAMES = ['1', '2', '3', '4', 'add_image'];

/** Known-missing URLs (per session) — avoids hammering dead slots. */
const IMAGE_FAIL_CACHE = new Set();
const IMAGE_PROBE_INFLIGHT = new Map();
/** Browsers limit ~6 concurrent requests per host; keep headroom for real image loads. */
const MAX_CONCURRENT_PROBES = 5;
const PROBE_ATTEMPTS = 3;
const PROBE_RETRY_DELAY_MS = 280;
let activeProbes = 0;
const probeQueue = [];

function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function runWithProbeLimit(task) {
    if (activeProbes < MAX_CONCURRENT_PROBES) {
        activeProbes += 1;
        return Promise.resolve()
            .then(task)
            .finally(() => {
                activeProbes -= 1;
                const next = probeQueue.shift();
                if (next) next();
            });
    }
    return new Promise((resolve, reject) => {
        probeQueue.push(() => runWithProbeLimit(task).then(resolve, reject));
    });
}

function probeImageExistsOnce(url) {
    const normalized = String(url || '').trim();
    if (!normalized) return Promise.resolve(false);

    return runWithProbeLimit(
        () =>
            new Promise((resolve) => {
                const img = new Image();
                let settled = false;
                const finish = (ok) => {
                    if (settled) return;
                    settled = true;
                    resolve(Boolean(ok));
                };
                const timeoutId = window.setTimeout(() => finish(false), 12000);
                img.onload = () => {
                    window.clearTimeout(timeoutId);
                    finish(true);
                };
                img.onerror = () => {
                    window.clearTimeout(timeoutId);
                    finish(false);
                };
                img.decoding = 'async';
                img.src = normalized;
            })
    );
}

/** Drop in-memory probe results (e.g. after deleting assets in Cloudinary). */
export function clearImageProbeCache() {
    IMAGE_FAIL_CACHE.clear();
    IMAGE_PROBE_INFLIGHT.clear();
}

export function probeImageExists(url) {
    const normalized = String(url || '').trim();
    if (!normalized) return Promise.resolve(false);
    if (IMAGE_FAIL_CACHE.has(normalized)) return Promise.resolve(false);
    if (IMAGE_PROBE_INFLIGHT.has(normalized)) return IMAGE_PROBE_INFLIGHT.get(normalized);

    const pending = (async () => {
        for (let attempt = 0; attempt < PROBE_ATTEMPTS; attempt += 1) {
            if (attempt > 0) await delay(PROBE_RETRY_DELAY_MS);
            const probeUrl = appendCloudinaryCacheBust(normalized, `${Date.now()}_${attempt}`);
            if (await probeImageExistsOnce(probeUrl)) {
                IMAGE_FAIL_CACHE.delete(normalized);
                return true;
            }
        }
        IMAGE_FAIL_CACHE.add(normalized);
        return false;
    })();

    IMAGE_PROBE_INFLIGHT.set(normalized, pending);
    return pending.finally(() => IMAGE_PROBE_INFLIGHT.delete(normalized));
}

/** Logical path candidates for a slot (folder add_image, then hotel root add_image on main gallery only). */
export function buildCandidateUrls(folderPath, baseName) {
    const logical = buildLogicalImagePath(folderPath, baseName);
    if (!logical) return [];
    const candidates = [logical];
    const folderAddImage = buildLogicalImagePath(folderPath, 'add_image');
    if (folderAddImage && folderAddImage !== logical) candidates.push(folderAddImage);

    const folderNorm = String(folderPath || '').replace(/\/$/, '');
    const slug = getHotelSlugFromLogicalPath(folderNorm);
    const isHotelRootFolder =
        Boolean(slug) && folderNorm === `${HOTEL_IMAGE_LOGICAL_ROOT}/${slug}`;
    if (isHotelRootFolder) {
        const hotelAddImage = getAddImageLogicalPath(slug);
        if (hotelAddImage && !candidates.includes(hotelAddImage)) candidates.push(hotelAddImage);
    }
    return candidates;
}

export function getListingImageLogicalPath(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return '';
    return buildLogicalImagePath(`${HOTEL_IMAGE_LOGICAL_ROOT}/${normalizedSlug}`, '1');
}

/** Listing cards: predictable slot-1 path, no network probe (detail page probes later). */
export function resolveListingImageSet(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return null;
    const primary = getListingImageLogicalPath(normalizedSlug);
    if (!primary) return null;
    return { basePath: HOTEL_IMAGE_ROOT, images: [primary] };
}

export function getOptimisticSlotPathsFromCandidates(imageCandidates) {
    if (!Array.isArray(imageCandidates)) return [];
    return imageCandidates
        .map((slot) => (Array.isArray(slot) ? slot[0] : ''))
        .filter(Boolean);
}

export async function findFirstExistingImage(folderPath, baseName) {
    const candidates = buildCandidateUrls(folderPath, baseName);
    for (const logical of candidates) {
        const deliveryUrl = getCloudinaryImageUrl(logical, IMAGE_TRANSFORMS.probe);
        if (await probeImageExists(deliveryUrl)) return logical;
    }
    return '';
}

/**
 * Resolve numbered images in a hotel subfolder (room, restaurant, etc.).
 *
 * Has no fixed slot cap — discovers as many consecutively-numbered images as
 * exist (1, 2, 3, …). Probes a batch of slots in parallel and stops as soon as
 * a slot is missing.
 */
export async function resolveFolderGalleryImages(folderPath, options = {}) {
    const folder = String(folderPath || '').replace(/\/$/, '');
    if (!folder) return { images: [], imageCandidates: [] };

    const batchSize = Math.max(1, options.batchSize || 4);
    const maxSlots = Math.max(1, options.maxSlots || 200);

    const images = [];
    const imageCandidates = [];

    const slot1Resolved = await findFirstExistingImage(folder, '1');
    if (slot1Resolved) {
        const slot1Candidates = buildCandidateUrls(folder, '1');
        images.push(slot1Resolved);
        imageCandidates.push([
            slot1Resolved,
            ...slot1Candidates.filter((candidate) => candidate !== slot1Resolved)
        ]);
    }

    let nextSlot = 2;
    let stopped = false;
    while (!stopped && nextSlot <= maxSlots) {
        const batchEnd = Math.min(nextSlot + batchSize - 1, maxSlots);
        const slotsInBatch = [];
        for (let s = nextSlot; s <= batchEnd; s += 1) slotsInBatch.push(s);

        const batchResults = await Promise.all(
            slotsInBatch.map(async (slot) => ({
                slot,
                url: await findFirstExistingImage(folder, String(slot))
            }))
        );

        for (const { slot, url } of batchResults) {
            if (!url) {
                stopped = true;
                break;
            }
            const candidates = buildCandidateUrls(folder, String(slot));
            images.push(url);
            imageCandidates.push([url, ...candidates.filter((candidate) => candidate !== url)]);
        }

        nextSlot = batchEnd + 1;
    }

    return { images, imageCandidates };
}

export function buildMainGallerySlotCandidates(slug, slotIndex) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return [];
    const folderPath = `${HOTEL_IMAGE_LOGICAL_ROOT}/${normalizedSlug}`;
    return buildCandidateUrls(folderPath, String(slotIndex));
}

export function buildOptimisticMainGallery(slug) {
    return HOTEL_IMAGE_SLOTS.map((slotIndex) => buildMainGallerySlotCandidates(slug, slotIndex));
}

export async function resolveMainGalleryForSlug(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return { images: [], imageCandidates: [] };

    const folderPath = `${HOTEL_IMAGE_LOGICAL_ROOT}/${normalizedSlug}`;
    const candidatesBySlot = buildOptimisticMainGallery(normalizedSlug);
    const resolved = await Promise.all(
        HOTEL_IMAGE_SLOTS.map((slotIndex) => findFirstExistingImage(folderPath, String(slotIndex)))
    );

    const images = [];
    const imageCandidates = [];

    resolved.forEach((logicalPath, index) => {
        if (!logicalPath) return;
        images.push(logicalPath);
        imageCandidates.push([
            logicalPath,
            ...candidatesBySlot[index].filter((candidate) => candidate !== logicalPath)
        ]);
    });

    if (!images.length) {
        const fallback = await findFirstExistingImage(folderPath, 'add_image');
        if (fallback) {
            images.push(fallback);
            imageCandidates.push([
                fallback,
                ...buildCandidateUrls(folderPath, 'add_image').filter((c) => c !== fallback)
            ]);
        }
    }

    return {
        images,
        imageCandidates: imageCandidates.length
            ? imageCandidates
            : images.map((src) => [src])
    };
}

export async function hotelHasListingImage(slug) {
    const folderPath = `${HOTEL_IMAGE_LOGICAL_ROOT}/${String(slug || '').trim()}`;
    if (await findFirstExistingImage(folderPath, '1')) return true;
    if (await findFirstExistingImage(folderPath, 'add_image')) return true;
    return false;
}

export async function collectRootGalleryImagesForSlug(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return [];

    const folderPath = `${HOTEL_IMAGE_LOGICAL_ROOT}/${normalizedSlug}`;
    const found = await Promise.all(
        HOTEL_ROOT_IMAGE_NAMES.map((baseName) => findFirstExistingImage(folderPath, baseName))
    );
    return [...new Set(found.filter(Boolean))];
}

export function serializeImageFallbacks(candidates) {
    const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    return JSON.stringify(list.slice(1));
}

export function imageFallbackOnErrorAttr() {
    return 'onerror="window.janaHotelImageFallback&&window.janaHotelImageFallback(this)"';
}
