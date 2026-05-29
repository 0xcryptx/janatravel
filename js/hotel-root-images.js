/**
 * Gallery images: root files only under /assets/hotel_images/{slug}/
 */

import {
    HOTEL_IMAGE_LOGICAL_ROOT,
    HOTEL_IMAGE_ROOT
} from './hotel-cloudinary.js';
import {
    HOTEL_ROOT_IMAGE_NAMES,
    collectRootGalleryImagesForSlug,
    hotelHasListingImage
} from './hotel-image-probe.js';

export { HOTEL_IMAGE_ROOT, HOTEL_ROOT_IMAGE_NAMES as ROOT_GALLERY_IMAGE_NAMES };

export const HOTEL_MEDIA_SUBFOLDERS = new Set([
    'rooms',
    'restaurants',
    'wellness',
    'facilities',
    'bars',
    'experiences'
]);

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

export function normalizeHotelFromSheetRow(row) {
    if (row && (row.slug || row.name || row.description)) {
        const slug = slugifyHotelName(row.slug || row.name || '');
        const name = String(row.name || '').trim();
        return { slug, name, active: row.active };
    }
    const name = String(getCaseInsensitiveField(row, ['name', 'Name']) || '').trim();
    const rawSlug = String(getCaseInsensitiveField(row, ['slug', 'Slug']) || '').trim();
    return {
        slug: slugifyHotelName(rawSlug || name),
        name,
        active: getCaseInsensitiveField(row, ['active', 'Active'])
    };
}

function isRootImageStem(stem) {
    return HOTEL_ROOT_IMAGE_NAMES.includes(String(stem || '').toLowerCase().replace(/\.[^.]+$/, ''));
}

export function isHotelRootImageUrl(urlOrPath) {
    const value = String(urlOrPath || '').trim();
    if (!value) return false;

    if (value.startsWith(`${HOTEL_IMAGE_LOGICAL_ROOT}/`)) {
        const remainder = value.slice(HOTEL_IMAGE_LOGICAL_ROOT.length + 1);
        const segments = remainder.split('/').filter(Boolean);
        if (segments.length !== 2) return false;
        if (HOTEL_MEDIA_SUBFOLDERS.has(segments[0].toLowerCase())) return false;
        return isRootImageStem(segments[1]);
    }

    try {
        const pathname = new URL(value, window.location.origin).pathname;
        const cloudMatch = pathname.match(/\/hotel_images\/([^/]+)\/([^/]+)$/);
        if (cloudMatch) {
            return isRootImageStem(cloudMatch[2]);
        }
        const prefix = `${HOTEL_IMAGE_ROOT}/`;
        if (!pathname.startsWith(prefix)) return false;
        const remainder = pathname.slice(prefix.length);
        const segments = remainder.split('/').filter(Boolean);
        if (segments.length !== 2) return false;
        if (HOTEL_MEDIA_SUBFOLDERS.has(segments[0].toLowerCase())) return false;
        return isRootImageStem(segments[1]);
    } catch {
        return false;
    }
}

export async function hotelHasWebsiteListingImage(slug) {
    return hotelHasListingImage(slug);
}

export async function collectRootImagesForHotelSlug(slug) {
    return collectRootGalleryImagesForSlug(slug);
}

export async function fetchPublishedHotelsFromSheet() {
    try {
        const sourceUrl = (window.JANA_HOTELS_SHEET_URL || '').trim() || '/data/hotels.json';
        const response = await fetch(sourceUrl);
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

export async function loadAllHotelRootGalleryImages() {
    const publishedHotels = await fetchPublishedHotelsFromSheet();
    if (!publishedHotels.length) return [];

    const images = [];
    const batchSize = 4;

    for (let offset = 0; offset < publishedHotels.length; offset += batchSize) {
        const batch = publishedHotels.slice(offset, offset + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (hotel) => {
                const listed = await hotelHasListingImage(hotel.slug);
                if (!listed) return [];
                return collectRootGalleryImagesForSlug(hotel.slug);
            })
        );
        batchResults.forEach((urls) => images.push(...urls));
    }

    return [...new Set(images.filter(isHotelRootImageUrl))];
}
