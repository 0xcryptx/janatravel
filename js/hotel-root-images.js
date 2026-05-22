/**
 * Gallery images: root files only under /assets/hotel_images/{slug}/
 * (never rooms, restaurants, wellness, facilities, etc.)
 *
 * A hotel is included only when it would appear on the Hotels page:
 * - Active in the Google Sheet
 * - Has a name and slug
 * - Has at least one listing image at the folder root (1.* or add_image.*)
 *
 * New folder + matching active sheet row + root images → loads on refresh (no code edits).
 */

export const HOTEL_IMAGE_ROOT = '/assets/hotel_images';
export const ROOT_GALLERY_IMAGE_NAMES = ['1', '2', '3', '4', 'add_image'];
export const HOTEL_MEDIA_SUBFOLDERS = new Set([
    'rooms',
    'restaurants',
    'wellness',
    'facilities',
    'bars',
    'experiences'
]);

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const IMAGE_EXISTS_CACHE = new Map();

function slugifyHotelName(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getCaseInsensitiveField(row, keys) {
    const keyMap = Object.keys(row || {}).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = key;
        return acc;
    }, {});
    for (const key of keys) {
        const normalized = key.toLowerCase().trim();
        if (keyMap[normalized]) return row[keyMap[normalized]];
    }
    return '';
}

export function isHotelActive(value) {
    if (value === false) return false;
    const normalized = String(value ?? '').toLowerCase().trim();
    if (!normalized) return true;
    return normalized !== 'false' && normalized !== 'no' && normalized !== '0';
}

/** Same row shape as hotels-catalog.js uses from the sheet. */
export function normalizeHotelFromSheetRow(row) {
    if (row && (row.slug || row.name || row.description)) {
        const slug = slugifyHotelName(row.slug || row.name || '');
        const name = String(row.name || '').trim();
        return {
            slug,
            name,
            active: row.active
        };
    }
    const name = String(getCaseInsensitiveField(row, ['name', 'Name']) || '').trim();
    const rawSlug = String(getCaseInsensitiveField(row, ['slug', 'Slug']) || '').trim();
    return {
        slug: slugifyHotelName(rawSlug || name),
        name,
        active: getCaseInsensitiveField(row, ['active', 'Active'])
    };
}

/** True when URL is a file directly under hotel_images/{slug}/ (not a subfolder). */
export function isHotelRootImageUrl(url) {
    try {
        const pathname = new URL(url, window.location.origin).pathname;
        const prefix = `${HOTEL_IMAGE_ROOT}/`;
        if (!pathname.startsWith(prefix)) return false;
        const remainder = pathname.slice(prefix.length);
        const segments = remainder.split('/').filter(Boolean);
        if (segments.length !== 2) return false;
        if (HOTEL_MEDIA_SUBFOLDERS.has(segments[0].toLowerCase())) return false;
        const stem = segments[1].toLowerCase().replace(/\.[^.]+$/, '');
        return ROOT_GALLERY_IMAGE_NAMES.includes(stem);
    } catch {
        return false;
    }
}

async function doesImageExist(url) {
    if (IMAGE_EXISTS_CACHE.has(url)) return IMAGE_EXISTS_CACHE.get(url);
    const pendingCheck = (async () => {
        try {
            const headResponse = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            if (headResponse.ok) return true;
            if (headResponse.status !== 405) return false;
        } catch {
            // Try GET fallback below.
        }
        try {
            const getResponse = await fetch(url, { cache: 'no-store' });
            return getResponse.ok;
        } catch {
            return false;
        }
    })();
    IMAGE_EXISTS_CACHE.set(url, pendingCheck);
    return pendingCheck;
}

async function findFirstExistingImage(baseFolderPath, baseName) {
    const candidates = IMAGE_EXTENSIONS.map((ext) => `${baseFolderPath}/${baseName}.${ext}`);
    const checks = await Promise.all(candidates.map((url) => doesImageExist(url)));
    const matchedIndex = checks.findIndex(Boolean);
    return matchedIndex >= 0 ? candidates[matchedIndex] : '';
}

/**
 * Matches hotels-catalog resolveHotelImageSet — hotel is listed on /hotels/ when this is true.
 */
export async function hotelHasWebsiteListingImage(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return false;

    const folderPath = `${HOTEL_IMAGE_ROOT}/${normalizedSlug}`;
    if (await findFirstExistingImage(folderPath, '1')) return true;
    if (await findFirstExistingImage(folderPath, 'add_image')) return true;
    if (await doesImageExist(`${folderPath}/add_image.webp`)) return true;
    return false;
}

/** Collect 1–4 and add_image files from the hotel folder root only. */
export async function collectRootImagesForHotelSlug(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return [];

    const folderPath = `${HOTEL_IMAGE_ROOT}/${normalizedSlug}`;
    const images = [];

    for (const baseName of ROOT_GALLERY_IMAGE_NAMES) {
        const url = await findFirstExistingImage(folderPath, baseName);
        if (url && isHotelRootImageUrl(url)) images.push(url);
    }

    return images;
}

/** Active hotels from the sheet that qualify for the public site (same rules as the catalog). */
export async function fetchPublishedHotelsFromSheet() {
    try {
        const sourceUrl = (window.JANA_HOTELS_SHEET_URL || '').trim() || '/data/hotels.json';
        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) {
            console.warn('Gallery: could not load hotel sheet for published hotels.');
            return [];
        }

        const rawHotels = await response.json();
        if (!Array.isArray(rawHotels) || !rawHotels.length) return [];

        return rawHotels
            .map((row) => normalizeHotelFromSheetRow(row || {}))
            .filter((hotel) => hotel.slug && hotel.name && isHotelActive(hotel.active));
    } catch (error) {
        console.warn('Gallery: failed to load published hotels from sheet.', error);
        return [];
    }
}

/**
 * Root gallery images for every hotel that is active on the sheet and listed on the website.
 * Folder name must match the sheet slug (e.g. assets/hotel_images/my-hotel-slug/).
 */
export async function loadAllHotelRootGalleryImages() {
    const publishedHotels = await fetchPublishedHotelsFromSheet();
    const images = [];

    for (const hotel of publishedHotels) {
        const listed = await hotelHasWebsiteListingImage(hotel.slug);
        if (!listed) continue;

        const rootImages = await collectRootImagesForHotelSlug(hotel.slug);
        images.push(...rootImages);
    }

    return [...new Set(images.filter(isHotelRootImageUrl))];
}
