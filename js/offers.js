/**
 * Offers page: render hotel-discount cards from a Google Sheet.
 * Sheet columns: Hotel Slug, Discount %, Details.
 * Hotel name + image are looked up from the main hotels sheet / image folder.
 */

import { getListingImageLogicalPath } from "./hotel-image-probe.js";
import { getAddImageLogicalPath, resolveHotelImageUrl } from "./hotel-cloudinary.js";
import { preloadJanaImages } from "./jana-swiper.js";
import { createLoadingProgress, formatLoadingText } from "./loading-progress.js";

const WHATSAPP_NUMBER = "971501771927";
const OFFER_FALLBACK_IMAGE = "/assets/images/maldives_1.jpg";

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const escapeAttr = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;");

function getCaseInsensitiveField(row, keys) {
    if (!row || typeof row !== "object") return "";
    const keyMap = Object.keys(row).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = key;
        return acc;
    }, {});
    for (const key of keys) {
        const matched = keyMap[key.toLowerCase().trim()];
        if (matched) return row[matched];
    }
    return "";
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function titleCaseFromSlug(slug) {
    return String(slug || "")
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function isHotelActive(value) {
    if (value === false) return false;
    const normalized = String(value ?? "").toLowerCase().trim();
    if (!normalized) return true;
    return normalized !== "false" && normalized !== "no" && normalized !== "0";
}

function parseDiscountValue(rawValue) {
    const raw = String(rawValue ?? "").trim();
    if (!raw) return "";
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    if (!match) return raw;
    const num = Number(match[0]);
    if (!Number.isFinite(num)) return raw;
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function buildOfferWhatsAppLink(hotelName, discountValue) {
    const cleanName = String(hotelName || "").trim() || "this hotel";
    const discountText = discountValue ? `${discountValue}% off ` : "";
    const message = `Hello, I'm interested in the ${discountText}offer at ${cleanName}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function loadOffersFromSheet() {
    const sheetUrl = (window.JANA_OFFERS_SHEET_URL || "").trim();
    if (!sheetUrl) return [];
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Failed to load offers sheet (${response.status})`);
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows
        .map((row) => {
            const slug = slugify(getCaseInsensitiveField(row, ["Hotel Slug", "Slug"]));
            const discount = parseDiscountValue(
                getCaseInsensitiveField(row, [
                    "Discount %",
                    "Discount%",
                    "Discount Percent",
                    "Discount Percentage",
                    "Discount",
                    "Percentage",
                    "Percent",
                    "%"
                ])
            );
            const details = String(
                getCaseInsensitiveField(row, ["Details", "Description"]) || ""
            ).trim();
            const active = getCaseInsensitiveField(row, ["Active", "Is Active", "Enabled"]);
            return slug ? { slug, discount, details, active } : null;
        })
        .filter((offer) => offer && isHotelActive(offer.active));
}

async function loadHotelsLookup() {
    const sheetUrl = (window.JANA_HOTELS_SHEET_URL || "").trim();
    if (!sheetUrl) return new Map();
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) return new Map();
        const rows = await response.json();
        if (!Array.isArray(rows)) return new Map();
        const lookup = new Map();
        rows.forEach((row) => {
            const rawName = String(getCaseInsensitiveField(row, ["Name", "Hotel Name"]) || "").trim();
            const rawSlug = String(getCaseInsensitiveField(row, ["Slug", "Hotel Slug"]) || "").trim();
            const active = getCaseInsensitiveField(row, ["Active"]);
            const slug = slugify(rawSlug || rawName);
            if (!slug) return;
            lookup.set(slug, {
                name: rawName || titleCaseFromSlug(slug),
                active: isHotelActive(active)
            });
        });
        return lookup;
    } catch (error) {
        console.warn("Offers: failed to load hotels lookup.", error);
        return new Map();
    }
}

function resolveOfferImage(slug) {
    const logical = getListingImageLogicalPath(slug);
    if (logical) {
        const primary = resolveHotelImageUrl(logical, "card");
        if (primary) return primary;
        const addImage = resolveHotelImageUrl(getAddImageLogicalPath(slug), "card");
        if (addImage) return addImage;
    }
    return OFFER_FALLBACK_IMAGE;
}

function renderOfferCard({ slug, name, image, discount, details, hotelPageHref }) {
    const discountBadge = discount
        ? `
            <div class="offer-card-discount">
                <span class="offer-card-discount-value">${escapeHtml(discount)}%</span>
                <span class="offer-card-discount-label">OFF</span>
            </div>
        `
        : "";

    const whatsAppLink = buildOfferWhatsAppLink(name, discount);

    return `
        <article class="offer-card" data-offer-slug="${escapeAttr(slug)}">
            <div class="offer-card-image" style="background-image: url('${escapeAttr(image)}');" aria-hidden="true"></div>
            <div class="offer-card-shade" aria-hidden="true"></div>
            ${discountBadge}
            <div class="offer-card-content">
                <h3 class="offer-card-title">
                    <a href="${escapeAttr(hotelPageHref)}">${escapeHtml(name)}</a>
                </h3>
                ${details ? `<p class="offer-card-description">${escapeHtml(details)}</p>` : ""}
                <a class="offer-card-cta" href="${escapeAttr(whatsAppLink)}" target="_blank" rel="noopener noreferrer">
                    <svg class="offer-card-cta-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.12 1.6 5.92L0 24l6.42-1.68a11.85 11.85 0 0 0 5.62 1.43h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.43zm-8.48 18.2h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.81 1 .99-3.71-.23-.38a9.83 9.83 0 0 1-1.5-5.18c0-5.43 4.42-9.85 9.85-9.85 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.97c0 5.43-4.42 9.84-9.75 9.84zm5.4-7.37c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34z"/>
                    </svg>
                    Claim This Offer
                </a>
            </div>
        </article>
    `;
}

const LOADING_STATE_ID = "offersLoadingState";

function setStatus(grid, message) {
    grid.innerHTML = `<p class="offers-status" id="${LOADING_STATE_ID}">${escapeHtml(message)}</p>`;
}

function updateLoadingText(text) {
    const el = document.getElementById(LOADING_STATE_ID);
    if (el) el.textContent = text;
}

async function initOffersPage() {
    const grid = document.getElementById("offersGrid");
    if (!grid) return;

    setStatus(grid, formatLoadingText("Loading offers", 0));

    const progress = createLoadingProgress({
        baseMessage: "Loading offers",
        estimateMs: 6000,
        onUpdate: (text) => updateLoadingText(text)
    });
    progress.start();
    progress.setProgress(4);

    let offers = [];
    let hotelsLookup = new Map();

    try {
        const [offersResult, hotelsResult] = await Promise.all([
            loadOffersFromSheet(),
            loadHotelsLookup()
        ]);
        offers = offersResult;
        hotelsLookup = hotelsResult;
    } catch (error) {
        console.error("Offers: failed to load sheet.", error);
        progress.stop();
        setStatus(grid, "We couldn't load offers right now. Please try again later.");
        return;
    }

    // Hide offers whose hotel row is marked inactive in the hotels sheet.
    // Offers whose slug has no matching hotel row are left visible (current fallback behavior).
    offers = offers.filter((offer) => {
        const hotelInfo = hotelsLookup.get(offer.slug);
        if (!hotelInfo) return true;
        return hotelInfo.active !== false;
    });

    progress.setProgress(48);

    if (!offers.length) {
        progress.stop();
        setStatus(grid, "No offers available right now. Check back soon!");
        return;
    }

    const totalOffers = offers.length;
    let resolvedCount = 0;

    const enriched = await Promise.all(
        offers.map(async (offer) => {
            const hotelInfo = hotelsLookup.get(offer.slug) || null;
            const name = hotelInfo?.name || titleCaseFromSlug(offer.slug);
            const image = await resolveOfferImage(offer.slug);
            resolvedCount += 1;
            progress.setProgress(48 + Math.round((resolvedCount / totalOffers) * 48));
            return {
                ...offer,
                name,
                image,
                hotelPageHref: `/hotels/package/?id=${encodeURIComponent(offer.slug)}`
            };
        })
    );

    preloadJanaImages(enriched.map((offer) => offer.image));

    grid.innerHTML = enriched.map(renderOfferCard).join("");
    progress.complete();
}

document.addEventListener("DOMContentLoaded", () => {
    initOffersPage().catch((error) => {
        console.error("Offers: unexpected error initializing page.", error);
    });
});
