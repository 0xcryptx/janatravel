/**
 * Cloudinary delivery URLs for hotel media.
 * Logical paths stay under /assets/hotel_images/…; public IDs are hotel_images/…
 */

export const CLOUDINARY_CLOUD_NAME = 'dnehzxjhl';
export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/** Logical base path used when building folder/slot paths (unchanged from local hosting). */
export const HOTEL_IMAGE_LOGICAL_ROOT = '/assets/hotel_images';

/** @deprecated Use HOTEL_IMAGE_LOGICAL_ROOT — kept for existing imports. */
export const HOTEL_IMAGE_ROOT = HOTEL_IMAGE_LOGICAL_ROOT;

export const IMAGE_TRANSFORMS = {
    default: 'q_auto,f_auto,c_limit,w_1200',
    hero: 'q_auto,f_auto,c_limit,w_1600',
    /** Hotel grid / offer cards — smaller delivery than hero (faster LCP). */
    card: 'q_auto,f_auto,c_fill,w_480,h_320,dpr_auto',
    thumb: 'q_auto,f_auto,c_fill,w_300,h_220',
    /** Tiny requests when verifying that an asset exists on Cloudinary. */
    probe: 'q_auto,f_auto,c_limit,w_40'
};

const STRIP_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif|bmp|svg|apng|ico)$/i;

/**
 * Convert a logical hotel image path to a Cloudinary public ID (no extension).
 * @param {string} path
 * @returns {string}
 */
export function toHotelImagePublicId(path) {
    let clean = String(path || '').trim();
    if (!clean) return '';
    clean = clean.replace(/^\/assets\/hotel_images\//, 'hotel_images/');
    clean = clean.replace(/^assets\/hotel_images\//, 'hotel_images/');
    if (clean.startsWith('/')) clean = clean.slice(1);
    clean = clean.replace(STRIP_EXT_RE, '');
    return clean;
}

/**
 * Build a Cloudinary delivery URL from a logical path or public id.
 * @param {string} path
 * @param {string} [transform]
 * @returns {string}
 */
export function getCloudinaryImageUrl(path, transform = IMAGE_TRANSFORMS.default) {
    const publicId = toHotelImagePublicId(path);
    if (!publicId) return '';
    const transformSegment = String(transform || IMAGE_TRANSFORMS.default).trim();
    return `${CLOUDINARY_BASE_URL}/${transformSegment}/${publicId}`;
}

/**
 * Bust browser/CDN caches for Cloudinary delivery URLs (ignored for placeholders).
 * @param {string} url
 * @param {string|number} bustToken
 */
export function appendCloudinaryCacheBust(url, bustToken) {
    const value = String(url || '').trim();
    if (!value || !bustToken) return value;
    if (!value.includes('res.cloudinary.com')) return value;
    try {
        const parsed = new URL(value);
        parsed.searchParams.set('_jana', String(bustToken));
        return parsed.toString();
    } catch {
        const sep = value.includes('?') ? '&' : '?';
        return `${value}${sep}_jana=${encodeURIComponent(String(bustToken))}`;
    }
}

/**
 * @param {string} folderPath e.g. /assets/hotel_images/{slug}/rooms/room1
 * @param {string} baseName e.g. 1 or add_image
 * @returns {string}
 */
export function buildLogicalImagePath(folderPath, baseName) {
    const folder = String(folderPath || '').replace(/\/$/, '');
    const name = String(baseName || '').trim();
    if (!folder || !name) return '';
    return `${folder}/${name}`;
}

/**
 * @param {string} slug
 * @param {...string} segments
 * @returns {string}
 */
export function buildLogicalHotelFolderPath(slug, ...segments) {
    const parts = [
        HOTEL_IMAGE_LOGICAL_ROOT,
        String(slug || '').trim(),
        ...segments.map((s) => String(s || '').trim()).filter(Boolean)
    ].filter(Boolean);
    return parts.join('/');
}

/**
 * @param {string} pathOrFolder logical path or folder
 * @returns {string}
 */
export function getHotelSlugFromLogicalPath(pathOrFolder) {
    const value = String(pathOrFolder || '');
    const match =
        value.match(/(?:^|\/)assets\/hotel_images\/([^/]+)/) ||
        value.match(/(?:^|\/)hotel_images\/([^/]+)/);
    return match ? match[1] : '';
}

/**
 * @param {string} folderPathOrSlug
 * @returns {string}
 */
export function getAddImageLogicalPath(folderPathOrSlug) {
    const slug = String(folderPathOrSlug || '').includes('/')
        ? getHotelSlugFromLogicalPath(folderPathOrSlug)
        : String(folderPathOrSlug || '').trim();
    if (!slug) return '';
    return buildLogicalHotelFolderPath(slug, 'add_image');
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isLogicalHotelImagePath(path) {
    const p = String(path || '').trim();
    return (
        p.startsWith(`${HOTEL_IMAGE_LOGICAL_ROOT}/`) ||
        p.startsWith('hotel_images/')
    );
}

/**
 * Resolve a stored path to a delivery URL. Leaves absolute http(s) URLs and
 * site placeholders (/assets/images/…) unchanged.
 * @param {string} path
 * @param {'default'|'hero'|'card'|'thumb'} [transformKey]
 * @returns {string}
 */
export function resolveHotelImageUrl(path, transformKey = 'default') {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/assets/images/')) return p;
    if (isLogicalHotelImagePath(p)) {
        const transform = IMAGE_TRANSFORMS[transformKey] || IMAGE_TRANSFORMS.default;
        return getCloudinaryImageUrl(p, transform);
    }
    return p;
}

/**
 * @param {string[]} candidates logical paths
 * @param {'default'|'hero'|'card'|'thumb'} [transformKey]
 * @returns {string[]}
 */
export function resolveHotelImageCandidates(candidates, transformKey = 'default') {
    if (!Array.isArray(candidates)) return [];
    return candidates.map((c) => resolveHotelImageUrl(c, transformKey)).filter(Boolean);
}
