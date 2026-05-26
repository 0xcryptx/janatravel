/**
 * Shared hotel image discovery (static hosting friendly — uses Image decode, not HEAD).
 */

export const HOTEL_IMAGE_ROOT = '/assets/hotel_images';
export const HOTEL_IMAGE_SLOTS = [1, 2, 3, 4];
export const HOTEL_ROOT_IMAGE_NAMES = ['1', '2', '3', '4', 'add_image'];

/**
 * All browser-renderable image formats we probe for. Includes uppercase and
 * common mixed-case variants because most production hosts (GitHub Pages,
 * Linux/Nginx) serve URLs case-sensitively, so `1.JPG` and `1.jpg` are
 * distinct files. Browsers cannot decode HEIC/HEIF/TIFF/RAW natively — those
 * still need to be converted to a web format before upload.
 */
const HOTEL_IMAGE_EXT_BASE = [
    'jpg', 'jpeg', 'png', 'webp', 'avif',
    'gif', 'bmp', 'svg', 'apng', 'ico'
];
const HOTEL_IMAGE_EXT_CASE_VARIANTS = HOTEL_IMAGE_EXT_BASE.flatMap((ext) => {
    const upper = ext.toUpperCase();
    const titled = ext.charAt(0).toUpperCase() + ext.slice(1);
    return [ext, upper, titled];
});
export const HOTEL_IMAGE_EXTENSIONS = [...new Set(HOTEL_IMAGE_EXT_CASE_VARIANTS)];
export const HOTEL_IMAGE_EXT_PRIORITY = [
    'jpg', 'avif', 'webp', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'apng', 'ico'
];

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

/**
 * Resolve numbered images in a hotel subfolder (room, restaurant, etc.).
 *
 * Has no fixed slot cap — discovers as many consecutively-numbered images as
 * exist (1.jpg, 2.jpg, 3.jpg, ...). Probes a batch of slots in parallel and
 * stops as soon as a slot is missing, so users only need to drop files in
 * sequence to grow a gallery. `maxSlots` is a safety upper bound to prevent
 * runaway probing in case of unexpected naming.
 */
export async function resolveFolderGalleryImages(folderPath, options = {}) {
    const folder = String(folderPath || '').replace(/\/$/, '');
    if (!folder) return { images: [], imageCandidates: [] };

    const batchSize = Math.max(1, options.batchSize || 4);
    const maxSlots = Math.max(1, options.maxSlots || 200);

    const images = [];
    const imageCandidates = [];

    let nextSlot = 1;
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
