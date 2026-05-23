/**
 * Shared hotel image discovery (static hosting friendly — uses Image decode, not HEAD).
 */

export const HOTEL_IMAGE_ROOT = '/assets/hotel_images';
export const HOTEL_IMAGE_SLOTS = [1, 2, 3, 4];
export const HOTEL_ROOT_IMAGE_NAMES = ['1', '2', '3', '4', 'add_image'];
export const HOTEL_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
export const HOTEL_IMAGE_EXT_PRIORITY = ['jpg', 'avif', 'webp', 'jpeg', 'png'];

const IMAGE_OK_CACHE = new Map();
const IMAGE_FAIL_CACHE = new Set();
const IMAGE_PROBE_INFLIGHT = new Map();
const MAX_CONCURRENT_PROBES = 18;
let activeProbes = 0;
const probeQueue = [];

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

export function probeImageExists(url) {
    const normalized = String(url || '').trim();
    if (!normalized) return Promise.resolve(false);
    if (IMAGE_OK_CACHE.has(normalized)) return Promise.resolve(true);
    if (IMAGE_FAIL_CACHE.has(normalized)) return Promise.resolve(false);
    if (IMAGE_PROBE_INFLIGHT.has(normalized)) return IMAGE_PROBE_INFLIGHT.get(normalized);

    const pending = runWithProbeLimit(
        () =>
            new Promise((resolve) => {
                const img = new Image();
                const finish = (ok) => {
                    if (ok) IMAGE_OK_CACHE.set(normalized, true);
                    else IMAGE_FAIL_CACHE.add(normalized);
                    resolve(ok);
                };
                img.onload = () => finish(true);
                img.onerror = () => finish(false);
                img.decoding = 'async';
                img.src = normalized;
            })
    );

    IMAGE_PROBE_INFLIGHT.set(normalized, pending);
    return pending.finally(() => IMAGE_PROBE_INFLIGHT.delete(normalized));
}

export function buildCandidateUrls(folderPath, baseName) {
    const folder = String(folderPath || '').replace(/\/$/, '');
    if (!folder) return [];
    const urls = [];
    for (const ext of HOTEL_IMAGE_EXT_PRIORITY) {
        urls.push(`${folder}/${baseName}.${ext}`);
    }
    for (const ext of HOTEL_IMAGE_EXTENSIONS) {
        const candidate = `${folder}/${baseName}.${ext}`;
        if (!urls.includes(candidate)) urls.push(candidate);
    }
    return urls;
}

export async function findFirstExistingImage(folderPath, baseName) {
    const candidates = buildCandidateUrls(folderPath, baseName);
    if (!candidates.length) return '';

    const results = await Promise.all(
        candidates.map(async (url) => [url, await probeImageExists(url)])
    );
    const match = results.find(([, exists]) => exists);
    return match ? match[0] : '';
}

/** Resolve numbered images (1–4) in a hotel subfolder (room, restaurant, etc.). */
export async function resolveFolderGalleryImages(folderPath) {
    const folder = String(folderPath || '').replace(/\/$/, '');
    if (!folder) return { images: [], imageCandidates: [] };

    const candidatesBySlot = HOTEL_IMAGE_SLOTS.map((slotIndex) =>
        buildCandidateUrls(folder, String(slotIndex))
    );
    const resolved = await Promise.all(
        HOTEL_IMAGE_SLOTS.map((slotIndex) => findFirstExistingImage(folder, String(slotIndex)))
    );

    const images = [];
    const imageCandidates = [];
    resolved.forEach((url, index) => {
        if (!url) return;
        images.push(url);
        imageCandidates.push([url, ...candidatesBySlot[index].filter((candidate) => candidate !== url)]);
    });

    return { images, imageCandidates };
}

export function buildMainGallerySlotCandidates(slug, slotIndex) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return [];
    const folderPath = `${HOTEL_IMAGE_ROOT}/${normalizedSlug}`;
    return buildCandidateUrls(folderPath, String(slotIndex));
}

export function buildOptimisticMainGallery(slug) {
    return HOTEL_IMAGE_SLOTS.map((slotIndex) => buildMainGallerySlotCandidates(slug, slotIndex));
}

export async function resolveMainGalleryForSlug(slug) {
    const candidatesBySlot = buildOptimisticMainGallery(slug);
    const resolved = await Promise.all(
        HOTEL_IMAGE_SLOTS.map((slotIndex) => findFirstExistingImage(`${HOTEL_IMAGE_ROOT}/${slug}`, String(slotIndex)))
    );

    const images = [];
    const imageCandidates = [];

    resolved.forEach((url, index) => {
        if (!url) return;
        images.push(url);
        imageCandidates.push([url, ...candidatesBySlot[index].filter((candidate) => candidate !== url)]);
    });

    if (!images.length) {
        const fallback = await findFirstExistingImage(`${HOTEL_IMAGE_ROOT}/${slug}`, 'add_image');
        if (fallback) {
            images.push(fallback);
            imageCandidates.push([fallback, ...buildCandidateUrls(`${HOTEL_IMAGE_ROOT}/${slug}`, 'add_image').filter((c) => c !== fallback)]);
        }
    }

    return { images, imageCandidates: imageCandidates.length ? imageCandidates : images.map((src) => [src]) };
}

export async function hotelHasListingImage(slug) {
    const folderPath = `${HOTEL_IMAGE_ROOT}/${String(slug || '').trim()}`;
    if (await findFirstExistingImage(folderPath, '1')) return true;
    if (await findFirstExistingImage(folderPath, 'add_image')) return true;
    return false;
}

export async function collectRootGalleryImagesForSlug(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return [];

    const folderPath = `${HOTEL_IMAGE_ROOT}/${normalizedSlug}`;
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
