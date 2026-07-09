import { createLoadingProgress, formatLoadingText } from "./loading-progress.js";
import {
  bindJanaImageCarousel,
  bindJanaSwipeCarousel,
  bindJanaSwiperCarousel,
  preloadJanaImages,
  preloadJanaSlideNeighbors,
  shouldUseJanaSwiperCarousel
} from "./jana-swiper.js";
import {
  HOTEL_IMAGE_ROOT,
  buildCandidateUrls,
  buildOptimisticMainGallery,
  clearImageProbeCache,
  resolveFolderGalleryImages,
  resolveMainGalleryForSlug,
  setImageProbeCacheToken
} from "./hotel-image-probe.js";
import {
  appendCloudinaryCacheBust,
  getAddImageLogicalPath,
  resolveHotelImageUrl
} from "./hotel-cloudinary.js";

const LOCAL_JSON_URL = "/data/hotels.json";
const WHATSAPP_NUMBER = "971501771927";
const HOTEL_PLACEHOLDER_IMAGE = "/assets/images/add_image.webp";
const GOOGLE_SHEETS_HOTELS_URL = "";
const HOTEL_IMAGE_BASE_PATHS = [HOTEL_IMAGE_ROOT];
const HOTEL_VIEW_STATE_PREFIX = "jana:hotelViewState:";
const HOTEL_DATA_CACHE_PREFIX = "jana:hotelData:";
const HOTEL_DATA_CACHE_TTL_MINUTES = 5;
const HOTEL_DATA_CACHE_TTL_MS = HOTEL_DATA_CACHE_TTL_MINUTES * 60 * 1000;
const HOTEL_DATA_CACHE_CLEANUP_INTERVAL_MS = 60 * 1000;
const HOTEL_MEDIA_CACHE_VERSION = 14;

/** Stable daily token keyed to HOTEL_MEDIA_CACHE_VERSION — lets CDN cache hits land while still busting when images are updated. */
let mediaDeliveryCacheBust = 0;
let hotelDataCacheCleanupTimerId = null;

function loadJsonData(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveImagePath(path, transformKey = "default") {
  const url = resolveHotelImageUrl(path, transformKey);
  if (!url || !mediaDeliveryCacheBust) return url;
  return appendCloudinaryCacheBust(url, mediaDeliveryCacheBust);
}

function resolveDeliveryUrls(candidates, transformKey = "default") {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  return list
    .map((entry) => {
      const value = String(entry || "").trim();
      if (!value) return "";
      if (/^https?:\/\//i.test(value) || value.startsWith("/assets/images/")) return value;
      return resolveImagePath(value, transformKey);
    })
    .filter(Boolean);
}

function buildImageCandidatesForSlot(folderPath, index) {
  return buildCandidateUrls(folderPath, String(index));
}

function serializeImageFallbacks(candidates, transformKey = "default") {
  const fallbacks = resolveDeliveryUrls(
    Array.isArray(candidates) ? candidates.slice(1) : [],
    transformKey
  );
  return escapeHtml(JSON.stringify(fallbacks));
}

function imageFallbackOnErrorAttr() {
  return 'onerror="window.janaHotelImageFallback&&window.janaHotelImageFallback(this)"';
}

function janaHotelImageFallback(img) {
  if (!img) return;
  let fallbacks = [];
  try {
    fallbacks = JSON.parse(img.dataset.fallbacks || "[]");
  } catch (error) {
    fallbacks = [];
  }
  const next = fallbacks.shift();
  if (next) {
    img.dataset.fallbacks = JSON.stringify(fallbacks);
    img.src = next;
    return;
  }
  img.onerror = null;
  const thumbButton = img.closest(".section-thumb-btn");
  if (thumbButton) {
    thumbButton.remove();
    return;
  }
  if (img.classList.contains("room-image-main")) {
    const folderPath = String(img.dataset.folderPath || "").trim();
    if (folderPath) {
      const folderAdd = resolveImagePath(`${folderPath.replace(/\/$/, "")}/add_image`, "default");
      if (folderAdd) {
        img.src = folderAdd;
        return;
      }
    }
  }
  if (img.classList.contains("room-image-main") || img.id === "hotelMainImage" || img.id === "hotelLightboxImage") {
    const slug = String(img.dataset.hotelSlug || "").trim();
    const addImage = slug ? resolveImagePath(getAddImageLogicalPath(slug), "hero") : "";
    img.src = addImage || HOTEL_PLACEHOLDER_IMAGE;
  }
}

if (typeof window !== "undefined") {
  window.janaHotelImageFallback = janaHotelImageFallback;
}

function createWhatsAppLink(hotelName) {
  const normalizedName = String(hotelName || "").trim() || "this hotel package";
  const text = `Hello, I'm interested in ${normalizedName}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function createRoomWhatsAppLink(hotelName, roomName) {
  const normalizedHotel = String(hotelName || "").trim() || "this hotel package";
  const normalizedRoom = String(roomName || "").trim() || "this";
  const text = `Hello, I'm interested in ${normalizedHotel}, ${normalizedRoom}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function formatRating(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} star`;
  return raw;
}

function formatDistanceFromAirport(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Not specified";
  if (/\bkm\b/i.test(raw)) return raw;
  return `${raw} km`;
}

function formatIslandSize(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Not specified";
  if (/\b(ha|hectares?)\b/i.test(raw)) return raw;
  if (/\bsq\.?\s*km\b/i.test(raw)) return raw;
  if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} ha`;
  return raw;
}

function parseStarRating(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const numericMatch = raw.match(/^\d+(\.\d+)?/);
  if (!numericMatch) return 0;
  const parsed = Number(numericMatch[0]);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(5, Math.round(parsed)));
}

function buildStarRatingMarkup(starCount) {
  if (!starCount) return "";
  const stars = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < starCount;
    return `<span class="hotel-rating-star${isFilled ? " is-filled" : ""}" aria-hidden="true">&#9733;</span>`;
  }).join("");
  return `<div class="hotel-rating-stars" aria-label="Rated ${starCount} out of 5 stars">${stars}</div>`;
}

/**
 * Drop focus from an arrow button after a *mouse* click so that the chrome
 * doesn't stay visible due to lingering focus on the button when the cursor
 * later moves/scrolls away. We deliberately keep focus on keyboard clicks
 * (`event.detail === 0`) so keyboard users can press Enter repeatedly.
 */
function blurAfterMouseClick(button, event) {
  if (!button || typeof button.blur !== "function") return;
  if (event && typeof event.detail === "number" && event.detail === 0) {
    return; // keyboard-driven click: leave focus alone
  }
  button.blur();
}

/**
 * Toggle an `is-hover` class on an image-viewer container based on actual
 * mouse position. Used because pure CSS `:hover` becomes unreliable when
 * Swiper captures pointer events on inner elements: arrows could fail to
 * appear on hover, or get stuck visible after a swipe ends. mouseenter /
 * mouseleave fire on the bound element's geometric bounds and aren't
 * affected by descendant pointer-capture, so the chrome state stays in sync.
 * Also force-clears when the page is hidden or the window loses focus to
 * recover from a stuck state if a modal opens or the user alt-tabs away
 * mid-swipe.
 */
const HOVER_CHROME_REGISTRY = new Set();
const HOVER_CHROME_REGISTRY_RESETS = new Set();
let hoverChromeGlobalListenersBound = false;

function clearAllHoverChrome() {
  HOVER_CHROME_REGISTRY.forEach((el) => {
    if (el && el.classList) el.classList.remove("is-hover");
  });
  HOVER_CHROME_REGISTRY_RESETS.forEach((reset) => {
    try {
      reset();
    } catch (error) {
      // Ignore reset failures.
    }
  });
}

function ensureHoverChromeGlobalListeners() {
  if (hoverChromeGlobalListenersBound) return;
  hoverChromeGlobalListenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearAllHoverChrome();
  });
  window.addEventListener("blur", clearAllHoverChrome);
}

function bindHoverChromeToggle(el) {
  if (!el || el.dataset.hoverChromeBound === "1") return;
  el.dataset.hoverChromeBound = "1";
  HOVER_CHROME_REGISTRY.add(el);
  ensureHoverChromeGlobalListeners();

  // Track hover and keyboard-focus state independently so a mouse click on
  // an arrow (which leaves the button focused) doesn't keep the chrome stuck
  // visible after the cursor moves away. Only keyboard-driven focus
  // (matched via :focus-visible) keeps the chrome on; mouse-induced focus is
  // ignored, matching the CSS fallback that uses :has(:focus-visible).
  let isHovered = false;
  let isFocusVisible = false;

  const sync = () => {
    el.classList.toggle("is-hover", isHovered || isFocusVisible);
  };

  el.addEventListener(
    "mouseenter",
    () => {
      isHovered = true;
      sync();
    },
    { passive: true }
  );
  el.addEventListener(
    "mouseleave",
    () => {
      isHovered = false;
      sync();
    },
    { passive: true }
  );
  el.addEventListener(
    "focusin",
    (event) => {
      const target = event.target;
      if (target && typeof target.matches === "function") {
        try {
          if (target.matches(":focus-visible")) {
            isFocusVisible = true;
            sync();
          }
        } catch (error) {
          // Older browsers may throw on :focus-visible; fall back to true.
          isFocusVisible = true;
          sync();
        }
      }
    },
    { passive: true }
  );
  el.addEventListener("focusout", (event) => {
    if (!el.contains(event.relatedTarget)) {
      isFocusVisible = false;
      sync();
    }
  });
  el.addEventListener(
    "pointercancel",
    () => {
      isHovered = false;
      sync();
    },
    { passive: true }
  );
  el.addEventListener(
    "touchend",
    () => {
      isHovered = false;
      sync();
    },
    { passive: true }
  );

  // Force-reset hooks: registry's clearAllHoverChrome() removes the class on
  // visibilitychange/blur. Make sure our internal flags reset too so a later
  // mouseenter/focusin can re-light the chrome.
  HOVER_CHROME_REGISTRY_RESETS.add(() => {
    isHovered = false;
    isFocusVisible = false;
  });
}

const DESTINATION_COUNTRY_PAGES = {
  maldives: "/maldives/",
  seychelles: "/seychelles/",
  mauritius: "/mauritius/"
};

function resolveDestinationCountrySlug(destination) {
  const normalized = String(destination || "").toLowerCase().trim();
  if (!normalized) return "";
  if (normalized.includes("seychelles")) return "seychelles";
  if (normalized.includes("mauritius")) return "mauritius";
  if (normalized.includes("maldives")) return "maldives";
  return "";
}

function getDestinationPageUrl(destination) {
  const countrySlug = resolveDestinationCountrySlug(destination);
  return countrySlug ? DESTINATION_COUNTRY_PAGES[countrySlug] : "";
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
  return "";
}

function normalizeGalleryImages(rawValue) {
  if (Array.isArray(rawValue)) return rawValue.filter(Boolean);
  if (typeof rawValue !== "string") return [];
  return rawValue
    .split(/\||\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFeaturedValue(value) {
  const normalized = String(value || "").toLowerCase().trim();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function isHotelActive(value) {
  if (value === false) return false;
  const normalized = String(value ?? "").toLowerCase().trim();
  if (!normalized) return true;
  return normalized !== "false" && normalized !== "no" && normalized !== "0";
}

function slugifyHotelName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDashSeparatedItems(value) {
  const text = String(value || "");
  const parts = text.includes(" - ")
    ? text.split(/\s+-\s+/)
    : text.split("- ");
  return parts
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNamedItemsWithDescription(value) {
  return parseDashSeparatedItems(value).map((entry) => {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex < 0) {
      return {
        label: entry,
        description: ""
      };
    }
    const label = entry.slice(0, separatorIndex).trim();
    const description = entry.slice(separatorIndex + 1).trim();
    return {
      label: label || entry,
      description
    };
  });
}

function getHotelStateStorageKey(slug) {
  return `${HOTEL_VIEW_STATE_PREFIX}${String(slug || "").trim().toLowerCase()}`;
}

function loadHotelViewState(slug) {
  const key = getHotelStateStorageKey(slug);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveHotelViewState(slug, nextState) {
  const key = getHotelStateStorageKey(slug);
  try {
    const current = loadHotelViewState(slug);
    const merged = { ...current, ...nextState };
    sessionStorage.setItem(key, JSON.stringify(merged));
  } catch (error) {
    // Ignore storage issues.
  }
}

function clearHotelViewState(slug) {
  const key = getHotelStateStorageKey(slug);
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    // Ignore storage issues.
  }
}

function getHotelDataCacheKey(slug) {
  return `${HOTEL_DATA_CACHE_PREFIX}${String(slug || "").trim().toLowerCase()}`;
}

function clearExpiredHotelDataCache() {
  const now = Date.now();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key || !key.startsWith(HOTEL_DATA_CACHE_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        sessionStorage.removeItem(key);
        continue;
      }
      try {
        const parsed = JSON.parse(raw);
        const expiresAt = Number(parsed?.expiresAt || 0);
        if (!Number.isFinite(expiresAt) || now > expiresAt) {
          sessionStorage.removeItem(key);
        }
      } catch (error) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    // Ignore storage access issues.
  }
}

function startHotelDataCacheAutoCleanup() {
  clearExpiredHotelDataCache();
  if (hotelDataCacheCleanupTimerId !== null) return;
  hotelDataCacheCleanupTimerId = window.setInterval(
    clearExpiredHotelDataCache,
    HOTEL_DATA_CACHE_CLEANUP_INTERVAL_MS
  );
}

function loadCachedHotelData(slug, signature) {
  const key = getHotelDataCacheKey(slug);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const expiresAt = Number(parsed.expiresAt || 0);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    if (signature && parsed.signature !== signature) {
      return null;
    }
    if (parsed.mediaCacheVersion !== HOTEL_MEDIA_CACHE_VERSION) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data || null;
  } catch (error) {
    return null;
  }
}

function hotelDataForSessionCache(hotelData) {
  if (!hotelData || typeof hotelData !== "object") return hotelData;
  const copy = { ...hotelData };
  copy.mainImages = [];
  copy.galleryImages = [];
  copy.mainImageCandidates = [];
  for (const key of ["roomTypeItems", "facilityItems", "wellnessItems", "restaurantItems"]) {
    if (!Array.isArray(copy[key])) continue;
    copy[key] = copy[key].map((item) => ({
      ...item,
      images: [],
      imageCandidates: [],
      loaded: false
    }));
  }
  return copy;
}

function saveCachedHotelData(slug, signature, hotelData) {
  const key = getHotelDataCacheKey(slug);
  try {
    const payload = {
      expiresAt: Date.now() + HOTEL_DATA_CACHE_TTL_MS,
      signature,
      mediaCacheVersion: HOTEL_MEDIA_CACHE_VERSION,
      data: hotelDataForSessionCache(hotelData)
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage issues.
  }
}

function buildIndexedSectionItems(basePath, slug, sectionFolder, itemPrefix, entries) {
  return entries.map((entry, index) => {
    const folderPath = `${basePath}/${slug}/${sectionFolder}/${itemPrefix}${index + 1}`;
    return {
      label: entry.label,
      description: entry.description || "",
      folderPath,
      imageCandidates: [],
      images: [],
      loaded: false
    };
  });
}

function getSectionItemDisplayImages(item) {
  if (!item) return [];
  return Array.isArray(item.images) ? item.images.filter(Boolean) : [];
}

function getSectionItemImageCandidates(item, slideIndex) {
  if (!item) return [];
  const images = getSectionItemDisplayImages(item);
  const logical = images[slideIndex];
  if (!logical) return [];

  const fromResolved = item.imageCandidates?.[slideIndex];
  if (Array.isArray(fromResolved) && fromResolved.length) {
    const list = fromResolved.filter(Boolean);
    if (list[0] === logical) return list;
    return [logical, ...list.filter((candidate) => candidate !== logical)];
  }

  const slotName = String(logical).split("/").pop();
  if (item.folderPath && /^\d+$/.test(slotName)) {
    return buildCandidateUrls(item.folderPath, slotName);
  }
  return [logical];
}

function destroyPanelCardSwipers(container) {
  if (!container) return;
  container.querySelectorAll(".room-image-viewer").forEach((viewer) => {
    try {
      viewer._janaCardSwipe?.destroy?.();
    } catch (error) {
      // Ignore teardown failures on replaced nodes.
    }
    viewer._janaCardSwipe = null;
  });
}

function areSectionItemsHydrated(items) {
  if (!Array.isArray(items) || !items.length) return true;
  return items.every((item) => item.loaded);
}

function mergeHydratedSectionItem(item, resolved) {
  const images = Array.isArray(resolved.images) ? resolved.images.filter(Boolean) : [];
  const imageCandidates = images.length
    ? resolved.imageCandidates
    : item.imageCandidates;
  return { ...item, images, imageCandidates, loaded: true };
}

function resetHotelSectionHydration(hotel) {
  if (!hotel || typeof hotel !== "object") return hotel;
  for (const key of ["roomTypeItems", "facilityItems", "wellnessItems", "restaurantItems"]) {
    if (!Array.isArray(hotel[key])) continue;
    hotel[key] = hotel[key].map((item) => ({
      ...item,
      loaded: false,
      images: []
    }));
  }
  return hotel;
}

async function hydrateSectionItems(section) {
  if (!section || !Array.isArray(section.items)) return;
  if (section.itemsLoaded && areSectionItemsHydrated(section.items)) return;
  if (section.itemsLoaded && !areSectionItemsHydrated(section.items)) {
    section.itemsLoaded = false;
  }
  if (areSectionItemsHydrated(section.items)) {
    section.itemsLoaded = true;
    return;
  }

  await Promise.all(
    section.items.map(async (item, index) => {
      if (item.loaded) {
        section._itemListeners?.forEach((fn) => fn(index, item));
        return;
      }
      const resolved = await resolveFolderGalleryImages(item.folderPath, { cacheVersion: HOTEL_MEDIA_CACHE_VERSION });
      const hydratedItem = mergeHydratedSectionItem(item, resolved);
      section.items[index] = hydratedItem;
      section._itemListeners?.forEach((fn) => fn(index, hydratedItem));
    })
  );

  section.itemsLoaded = true;
}

function ensureSectionHydrated(section, onHydrated, onItemHydrated) {
  if (!section) {
    if (typeof onHydrated === "function") onHydrated();
    return Promise.resolve();
  }
  if (section.itemsLoaded && areSectionItemsHydrated(section.items)) {
    if (typeof onItemHydrated === "function") {
      section.items.forEach((item, index) => onItemHydrated(index, item));
    }
    if (typeof onHydrated === "function") onHydrated();
    return Promise.resolve();
  }
  if (section.itemsLoaded && !areSectionItemsHydrated(section.items)) {
    section.itemsLoaded = false;
  }
  if (typeof onItemHydrated === "function") {
    if (!section._itemListeners) section._itemListeners = [];
    section._itemListeners.push(onItemHydrated);
    // Immediately notify for items already resolved during a concurrent hydration.
    section.items.forEach((item, index) => {
      if (item.loaded) onItemHydrated(index, item);
    });
  }
  if (section._hydratePromise) {
    return section._hydratePromise.then(() => {
      if (typeof onHydrated === "function") onHydrated();
    });
  }
  section._hydratePromise = hydrateSectionItems(section)
    .then(() => {
      section._itemListeners = [];
      if (typeof onHydrated === "function") onHydrated();
    })
    .finally(() => {
      section._hydratePromise = null;
    });
  return section._hydratePromise;
}

function prewarmHotelSections(sectionData) {
  const sections = Object.values(sectionData).filter(
    (section) => section && Array.isArray(section.items) && section.items.length
  );
  let chain = Promise.resolve();
  sections.forEach((section) => {
    chain = chain.then(() => ensureSectionHydrated(section));
  });
  return chain;
}

async function hydrateAllHotelSections(sections) {
  const pending = sections.filter(
    (section) => section && Array.isArray(section.items) && section.items.length && !section.itemsLoaded
  );
  if (!pending.length) return;
  await Promise.all(pending.map((section) => hydrateSectionItems(section)));
}

function normalizeSheetHotel(row) {
  const name = String(getCaseInsensitiveField(row, ["name", "Name"]) || "").trim();
  const rawSlug = String(getCaseInsensitiveField(row, ["slug", "Slug"]) || "").trim();
  const slug = slugifyHotelName(rawSlug || name);
  return {
    slug,
    name,
    active: getCaseInsensitiveField(row, ["active", "Active"]),
    destination: getCaseInsensitiveField(row, ["destination", "Destination"]),
    location: getCaseInsensitiveField(row, ["location", "Location"]),
    distanceFromAirport: getCaseInsensitiveField(row, [
      "distanceFromAirport",
      "Distance from Airport",
      "Distance From Airport"
    ]),
    googleMapsLink: getCaseInsensitiveField(row, [
      "googleMapsLink",
      "Google Maps Link",
      "Google Map",
      "Google Maps",
      "Map Link",
      "Location Link"
    ]),
    rating: getCaseInsensitiveField(row, ["rating", "Rating"]),
    islandSize: getCaseInsensitiveField(row, [
      "islandSize",
      "Island Size",
      "Island size",
      "island size"
    ]),
    reefType: getCaseInsensitiveField(row, ["reefType", "Reef Type"]),
    experience: getCaseInsensitiveField(row, ["experience", "Experience"]),
    mealPlan: getCaseInsensitiveField(row, ["mealPlan", "Meal Plan"]),
    rooms: getCaseInsensitiveField(row, [
      "rooms",
      "Rooms",
      "No. of Rooms",
      "No Of Rooms",
      "No.of Rooms",
      "Number of Rooms",
      "# of Rooms",
      "# of rooms"
    ]),
    roomTypes: getCaseInsensitiveField(row, ["roomTypes", "Room Types"]),
    restaurants: getCaseInsensitiveField(row, [
      "restaurants",
      "Restaurants",
      "No. of Restaurants",
      "No Of Restaurants",
      "No.of Restaurants",
      "Number of Restaurants",
      "# of Restaurants"
    ]),
    restaurantNames: getCaseInsensitiveField(row, ["restaurantNames", "Restaurant Names"]),
    bars: getCaseInsensitiveField(row, [
      "bars",
      "Bars",
      "No. of Bars",
      "No Of Bars",
      "No.of Bars",
      "Number of Bars",
      "# of Bars"
    ]),
    transferType: getCaseInsensitiveField(row, ["transferType", "Transfer Type"]),
    facilities: getCaseInsensitiveField(row, ["facilities", "Facilities"]),
    wellness: getCaseInsensitiveField(row, ["wellness", "Wellness"]),
    description: getCaseInsensitiveField(row, ["description", "Description"]),
    imageUrl: getCaseInsensitiveField(row, ["imageUrl", "Image URL"]),
    galleryImages: normalizeGalleryImages(getCaseInsensitiveField(row, ["galleryImages", "Gallery Images"])),
    whatsappMessage: getCaseInsensitiveField(row, ["whatsappMessage", "WhatsApp Message"]),
    featured: parseFeaturedValue(getCaseInsensitiveField(row, ["featured", "Featured"]))
  };
}

function prepareHotelMedia(hotel, onProgress) {
  if (!hotel) return null;
  const slug = String(hotel.slug || "").trim();
  if (!slug || !String(hotel.name || "").trim() || !isHotelActive(hotel.active)) return null;

  if (typeof onProgress === "function") onProgress(72);
  const imageBasePath = HOTEL_IMAGE_BASE_PATHS.find((path) => path.includes("assets")) || HOTEL_IMAGE_BASE_PATHS[0];
  const mainImageCandidates = buildOptimisticMainGallery(slug);
  const mainImages = mainImageCandidates
    .map((candidates) => candidates[0])
    .filter(Boolean);
  const heroImage = mainImages[0] || HOTEL_PLACEHOLDER_IMAGE;

  const roomTypeItemsText = parseNamedItemsWithDescription(hotel.roomTypes);
  const facilityItemsText = parseNamedItemsWithDescription(hotel.facilities);
  const wellnessItemsText = parseNamedItemsWithDescription(hotel.wellness);
  const restaurantItemsText = parseNamedItemsWithDescription(hotel.restaurantNames);

  const roomTypeItems = buildIndexedSectionItems(imageBasePath, slug, "rooms", "room", roomTypeItemsText);
  const facilityItems = buildIndexedSectionItems(imageBasePath, slug, "facilities", "fac", facilityItemsText);
  const wellnessItems = buildIndexedSectionItems(imageBasePath, slug, "wellness", "well", wellnessItemsText);
  const restaurantItems = buildIndexedSectionItems(imageBasePath, slug, "restaurants", "res", restaurantItemsText);

  if (typeof onProgress === "function") onProgress(95);

  return {
    ...hotel,
    slug,
    imageBasePath,
    mainImageCandidates,
    mainImages: mainImages.length ? mainImages : [heroImage],
    imageUrl: String(hotel.imageUrl || "").trim() || heroImage,
    galleryImages: mainImages.length ? mainImages : [heroImage],
    roomTypeItemsText,
    facilityItemsText,
    wellnessItemsText,
    restaurantItemsText,
    roomTypeItems,
    facilityItems,
    wellnessItems,
    restaurantItems
  };
}

async function loadHotelsData() {
  const runtimeUrl = (window.JANA_HOTELS_SHEET_URL || "").trim();
  const sourceUrl = runtimeUrl || GOOGLE_SHEETS_HOTELS_URL;

  let hotels = [];
  if (sourceUrl) {
    const raw = await loadJsonData(sourceUrl);
    if (Array.isArray(raw)) {
      hotels = raw.map(normalizeSheetHotel);
    }
  } else {
    const local = await loadJsonData(LOCAL_JSON_URL);
    hotels = Array.isArray(local) ? local : [];
  }

  return hotels.map((hotel) => prepareHotelMedia(hotel)).filter(Boolean);
}

async function loadHotelBySlug(slug, onProgress) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return null;

  const runtimeUrl = (window.JANA_HOTELS_SHEET_URL || "").trim();
  const sourceUrl = runtimeUrl || GOOGLE_SHEETS_HOTELS_URL;

  if (typeof onProgress === "function") onProgress(8);
  let hotels = [];
  if (sourceUrl) {
    const raw = await loadJsonData(sourceUrl);
    if (typeof onProgress === "function") onProgress(32);
    if (Array.isArray(raw)) {
      hotels = raw.map(normalizeSheetHotel);
    }
  } else {
    const local = await loadJsonData(LOCAL_JSON_URL);
    if (typeof onProgress === "function") onProgress(32);
    hotels = Array.isArray(local) ? local : [];
  }

  if (typeof onProgress === "function") onProgress(45);
  const matchedHotel = hotels.find(
    (item) => String(item?.slug || "").trim().toLowerCase() === normalizedSlug
  );
  if (!matchedHotel || !isHotelActive(matchedHotel.active)) return null;
  if (typeof onProgress === "function") onProgress(52);
  const hotelSignature = JSON.stringify(matchedHotel);
  const cachedHotel = loadCachedHotelData(normalizedSlug, hotelSignature);

  mediaDeliveryCacheBust = `${HOTEL_MEDIA_CACHE_VERSION}_${Math.floor(Date.now() / 86400000)}`;
  setImageProbeCacheToken(mediaDeliveryCacheBust);

  // Reuse cached sheet-derived data when available (skips re-parsing + section URL building),
  // but ALWAYS re-resolve galleries from Cloudinary. Section items are re-hydrated on each visit.
  const preparedHotel = cachedHotel
    ? resetHotelSectionHydration({ ...cachedHotel })
    : prepareHotelMedia(matchedHotel, (mediaProgress) => {
        if (typeof onProgress === "function") {
          onProgress(55 + Math.round(mediaProgress * 0.4));
        }
      });

  if (preparedHotel) {
    const resolvedGallery = await resolveMainGalleryForSlug(normalizedSlug);
    if (resolvedGallery.images.length) {
      preparedHotel.mainImages = resolvedGallery.images;
      preparedHotel.mainImageCandidates = resolvedGallery.imageCandidates;
      preparedHotel.galleryImages = resolvedGallery.images;
      preparedHotel.imageUrl = resolvedGallery.images[0];
    } else {
      preparedHotel.mainImages = [HOTEL_PLACEHOLDER_IMAGE];
      preparedHotel.galleryImages = [HOTEL_PLACEHOLDER_IMAGE];
      preparedHotel.imageUrl = HOTEL_PLACEHOLDER_IMAGE;
    }
    saveCachedHotelData(normalizedSlug, hotelSignature, preparedHotel);
  }
  if (typeof onProgress === "function") onProgress(96);
  return preparedHotel;
}

function updateState(type, message, percent) {
  const stateEl = document.getElementById("hotelPageState");
  if (!stateEl) return;
  stateEl.className = `page-state ${type}`;
  if (type === "loading" && typeof percent === "number") {
    stateEl.textContent = formatLoadingText(message, percent);
    return;
  }
  stateEl.textContent = message;
}

function hideHotelPageLoading(progress) {
  if (progress) progress.stop();
  updateState("success", "");
}

function normalizeLightboxPayload(payload, startIndex = 0) {
  if (Array.isArray(payload)) {
    return {
      images: payload.filter(Boolean),
      imageCandidatesByIndex: payload.map((src) => [resolveImagePath(src) || HOTEL_PLACEHOLDER_IMAGE]),
      startIndex
    };
  }
  if (!payload || typeof payload !== "object") {
    return { images: [], imageCandidatesByIndex: [], startIndex: 0 };
  }
  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
  const imageCandidatesByIndex = Array.isArray(payload.imageCandidatesByIndex)
    ? payload.imageCandidatesByIndex
    : images.map((src) => [resolveImagePath(src) || HOTEL_PLACEHOLDER_IMAGE]);
  const normalizedStart = Number.isFinite(Number(payload.startIndex))
    ? Number(payload.startIndex)
    : startIndex;
  return {
    images,
    imageCandidatesByIndex,
    startIndex: normalizedStart,
    resolvedSrc: String(payload.resolvedSrc || "").trim()
  };
}

async function setupImageLightbox(contentEl) {
  const lightbox = contentEl.querySelector("#hotelImageLightbox");
  const lightboxImage = contentEl.querySelector("#hotelLightboxImage");
  const lightboxCounter = contentEl.querySelector("#hotelLightboxCounter");
  const closeBtn = contentEl.querySelector("#hotelLightboxClose");
  const prevBtn = contentEl.querySelector("#hotelLightboxPrev");
  const nextBtn = contentEl.querySelector("#hotelLightboxNext");

  if (!lightbox || !lightboxImage) {
    return { open: () => {} };
  }

  let currentImages = [];
  let currentIndex = 0;
  let lightboxContext = {
    images: [],
    imageCandidatesByIndex: [],
    resolvedAtIndex: new Map()
  };

  const cacheResolvedLightboxSrc = (slideIndex, imgEl = null) => {
    const target =
      imgEl || lightboxSwipe?.getActiveImage?.() || lightboxImage;
    const src = target?.currentSrc || target?.src;
    if (!src) return;
    lightboxContext.resolvedAtIndex.set(slideIndex, src);
  };

  const getLightboxSlideSources = (slideIndex) => {
    const count = lightboxContext.images.length;
    if (!count) return { candidates: [HOTEL_PLACEHOLDER_IMAGE] };
    const normalized = ((slideIndex % count) + count) % count;
    const resolved = lightboxContext.resolvedAtIndex.get(normalized);
    const slotCandidates = lightboxContext.imageCandidatesByIndex[normalized];
    if (Array.isArray(slotCandidates) && slotCandidates.length) {
      const resolvedList = resolveDeliveryUrls(slotCandidates, "default");
      if (resolved) {
        return {
          candidates: [
            resolved,
            ...resolvedList.filter((candidate) => candidate !== resolved)
          ]
        };
      }
      return { candidates: resolvedList };
    }
    const fallback =
      resolveImagePath(lightboxContext.images[normalized], "default") ||
      HOTEL_PLACEHOLDER_IMAGE;
    return { candidates: [fallback] };
  };

  const updateLightboxCounter = () => {
    if (lightboxCounter && currentImages.length) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
    }
  };

  const applyLightboxSlide = (imgEl, slideIndex) => {
    const { candidates } = getLightboxSlideSources(slideIndex);
    applyImageWithFallbacks(imgEl, candidates, { transformKey: "default" });
  };

  let lightboxSwipe = null;
  let lightboxSwipeKind = null;

  const getLightboxCarouselKind = (count) => {
    if (count <= 1) return "none";
    return shouldUseJanaSwiperCarousel(count) ? "swiper" : "track";
  };

  const lightboxCarouselOptions = {
    mountBefore: lightboxImage,
    mainImageEl: lightboxImage,
    viewportClass: "lightbox-swipe-viewport",
    getSlideCount: () => currentImages.length,
    applySlideToImage: applyLightboxSlide,
    onIndexChange: (slideIndex) => {
      currentIndex = slideIndex;
      updateLightboxCounter();
      cacheResolvedLightboxSrc(slideIndex, lightboxSwipe?.getActiveImage?.());
    }
  };

  const mountLightboxCarousel = async () => {
    const count = currentImages.length;
    const kind = getLightboxCarouselKind(count);
    if (kind === lightboxSwipeKind && lightboxSwipe) {
      lightboxSwipe.refresh?.();
      return lightboxSwipe;
    }
    lightboxSwipe?.destroy?.();
    lightboxSwipe = null;
    lightboxSwipeKind = kind;
    if (kind === "none") return null;
    lightboxSwipe =
      kind === "swiper"
        ? await bindJanaSwiperCarousel(lightboxCarouselOptions)
        : bindJanaSwipeCarousel(lightboxCarouselOptions);
    return lightboxSwipe;
  };

  const setLightboxImage = (nextIndex) => {
    if (!currentImages.length) return;
    const normalizedIndex = ((nextIndex % currentImages.length) + currentImages.length) % currentImages.length;
    currentIndex = normalizedIndex;
    if (lightboxSwipe) {
      lightboxSwipe.setIndex(normalizedIndex, { silent: true });
    } else {
      applyImageWithFallbacks(lightboxImage, getLightboxSlideSources(normalizedIndex).candidates, {
        transformKey: "default"
      });
    }
    updateLightboxCounter();
    cacheResolvedLightboxSrc(normalizedIndex, lightboxSwipe?.getActiveImage?.() || lightboxImage);
  };

  const closeLightbox = () => {
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("lightbox-open");
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

  const openLightbox = async (payload, startIndex = 0) => {
    const normalizedPayload = normalizeLightboxPayload(payload, startIndex);
    if (!normalizedPayload.images.length) return;

    currentImages = normalizedPayload.images;
    const normalizedStart =
      ((normalizedPayload.startIndex % currentImages.length) + currentImages.length) %
      currentImages.length;
    lightboxContext = {
      images: normalizedPayload.images,
      imageCandidatesByIndex: normalizedPayload.imageCandidatesByIndex,
      resolvedAtIndex: new Map()
    };
    if (normalizedPayload.resolvedSrc) {
      lightboxContext.resolvedAtIndex.set(normalizedStart, normalizedPayload.resolvedSrc);
    }

    if (prevBtn && nextBtn) {
      const showNav = currentImages.length > 1;
      prevBtn.hidden = !showNav;
      nextBtn.hidden = !showNav;
    }

    await mountLightboxCarousel();
    setLightboxImage(normalizedStart);
    const deliveryImages = currentImages.map((src) => resolveImagePath(src, "default"));
    preloadJanaImages(deliveryImages);
    preloadJanaSlideNeighbors(deliveryImages, normalizedStart);
    lightbox.removeAttribute("hidden");
    document.body.classList.add("lightbox-open");
  };

  lightboxImage.addEventListener("load", () => {
    if (currentIndex === 0) {
      cacheResolvedLightboxSrc(0, lightboxImage);
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", () => setLightboxImage(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setLightboxImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !lightbox.contains(target)) return;
    if (target.closest(".lightbox-close, .lightbox-nav, .lightbox-counter")) return;
    if (target.closest(".lightbox-swipe-viewport img, .image-lightbox > img")) return;
    closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hasAttribute("hidden")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") setLightboxImage(currentIndex - 1);
    if (event.key === "ArrowRight") setLightboxImage(currentIndex + 1);
  });

  return { open: openLightbox };
}

function applyImageWithFallbacks(imgEl, candidates, options = {}) {
  if (!imgEl) return;
  const transformKey = options.transformKey || "default";
  const list = resolveDeliveryUrls(
    Array.isArray(candidates) ? candidates.filter(Boolean) : [],
    transformKey
  );
  if (!list.length) {
    imgEl.removeAttribute("data-fallbacks");
    if (!options.preserveVisibleSrc) {
      imgEl.src = HOTEL_PLACEHOLDER_IMAGE;
    }
    return;
  }
  const primary = list[0];
  const visibleSrc = options.preserveVisibleSrc || "";
  const nextSrc = visibleSrc || primary;
  const fallbacks = visibleSrc
    ? list.filter((candidate) => candidate !== visibleSrc)
    : list.slice(1);
  imgEl.dataset.fallbacks = JSON.stringify(fallbacks);
  const currentSrc = imgEl.currentSrc || imgEl.src || "";
  if (!currentSrc || currentSrc !== nextSrc) {
    imgEl.src = nextSrc;
  }
  imgEl.onerror = () => janaHotelImageFallback(imgEl);
}

async function setupHotelGallery(contentEl, images, hotelName, lightboxApi, options = {}) {
  const mainImageEl = contentEl.querySelector("#hotelMainImage");
  const thumbButtons = Array.from(contentEl.querySelectorAll(".thumb-btn"));
  const maximizeBtn = contentEl.querySelector("#hotelMaximizeBtn");
  const prevBtn = contentEl.querySelector("#hotelGalleryPrev");
  const nextBtn = contentEl.querySelector("#hotelGalleryNext");
  const counterEl = contentEl.querySelector("#hotelGalleryCounter");
  const lightboxEl = contentEl.querySelector("#hotelImageLightbox");
  if (!mainImageEl || !thumbButtons.length) return;

  const galleryImages = images.length ? images : [HOTEL_PLACEHOLDER_IMAGE];
  const imageCandidatesByIndex = Array.isArray(options.imageCandidates) ? options.imageCandidates : [];
  let currentIndex = 0;
  const initialIndex = Number(options.initialIndex || 0);
  const onGalleryIndexChange = typeof options.onGalleryIndexChange === "function" ? options.onGalleryIndexChange : null;

  const updateGalleryUi = (normalizedIndex) => {
    currentIndex = normalizedIndex;
    mainImageEl.alt = `${hotelName} view ${currentIndex + 1}`;
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
    thumbButtons.forEach((btn, index) => {
      btn.classList.toggle("is-active", index === currentIndex);
    });
    if (onGalleryIndexChange) onGalleryIndexChange(currentIndex);
  };

  const getGallerySlideSources = (slideIndex) => {
    const slotCandidates = imageCandidatesByIndex[slideIndex];
    const fallbackCandidates =
      Array.isArray(slotCandidates) && slotCandidates.length
        ? slotCandidates
        : [galleryImages[slideIndex] || ""].filter(Boolean);
    return { candidates: fallbackCandidates };
  };

  const applyGallerySlide = (imgEl, slideIndex) => {
    applyImageWithFallbacks(imgEl, getGallerySlideSources(slideIndex).candidates, {
      transformKey: "hero"
    });
  };

  const gallerySwipe = await bindJanaImageCarousel({
    mountBefore: mainImageEl,
    mainImageEl,
    viewportClass: "hero-swipe-viewport",
    getSlideCount: () => galleryImages.length,
    applySlideToImage: applyGallerySlide,
    onIndexChange: updateGalleryUi,
    initialIndex: Number.isFinite(initialIndex) ? initialIndex : 0
  });

  const setActiveImage = (nextIndex) => {
    if (!galleryImages.length) return;
    const normalizedIndex = ((nextIndex % galleryImages.length) + galleryImages.length) % galleryImages.length;
    if (gallerySwipe) {
      gallerySwipe.setIndex(normalizedIndex, { silent: true });
      updateGalleryUi(normalizedIndex);
      return;
    }
    updateGalleryUi(normalizedIndex);
    const fallbackCandidates = getGallerySlideSources(normalizedIndex).candidates;
    applyImageWithFallbacks(mainImageEl, fallbackCandidates, { transformKey: "hero" });
  };

  thumbButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index || 0);
      setActiveImage(Number.isFinite(idx) ? idx : 0);
      btn.blur();
    });
  });

  const openMainLightbox = () => {
    const activeImg = gallerySwipe?.getActiveImage?.() || mainImageEl;
    lightboxApi.open({
      images: galleryImages,
      imageCandidatesByIndex,
      startIndex: currentIndex,
      resolvedSrc: activeImg.currentSrc || activeImg.src
    });
  };
  if (prevBtn) {
    prevBtn.addEventListener("click", (event) => {
      setActiveImage(currentIndex - 1);
      blurAfterMouseClick(prevBtn, event);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", (event) => {
      setActiveImage(currentIndex + 1);
      blurAfterMouseClick(nextBtn, event);
    });
  }
  if (maximizeBtn) maximizeBtn.addEventListener("click", openMainLightbox);
  const heroEl = contentEl.querySelector(".hero--interactive");
  if (heroEl) {
    heroEl.addEventListener("click", (event) => {
      if (!event.target.closest("img")) return;
      if (gallerySwipe?.didDrag?.()) return;
      openMainLightbox();
    });
    bindHoverChromeToggle(heroEl);
  }

  document.addEventListener("keydown", (event) => {
    if (!contentEl.isConnected) return;
    if (lightboxEl && !lightboxEl.hasAttribute("hidden")) return;
    if (event.key === "ArrowLeft") setActiveImage(currentIndex - 1);
    if (event.key === "ArrowRight") setActiveImage(currentIndex + 1);
  });

  if (!gallerySwipe) {
    setActiveImage(Number.isFinite(initialIndex) ? initialIndex : 0);
  }
}

const INFO_CARD_SECTIONS = new Set(["rooms", "restaurants", "facilities", "wellness"]);

function isInfoCardSection(sectionKey) {
  return INFO_CARD_SECTIONS.has(sectionKey);
}

function renderSectionItemsHtml(items, sectionKey, options = {}) {
  const hotelName = String(options.hotelName || "").trim();
  const hotelSlug = String(options.hotelSlug || "").trim();
  const useCardLayout = isInfoCardSection(sectionKey);
  if (!items.length) {
    return `<p class="info-empty">Not specified.</p>`;
  }
  const renderedItems = items
    .map((item, itemIndex) => {
      const displayImages = getSectionItemDisplayImages(item);
      const pendingMedia = Boolean(item.folderPath) && !item.loaded;
      return `
      <article class="section-item${useCardLayout ? " section-item--room" : ""}" data-item-index="${itemIndex}">
        <h4 class="section-item__title">${escapeHtml(item.label)}</h4>
        ${
          pendingMedia
            ? useCardLayout
              ? `<div class="room-image-viewer room-image-viewer--pending" aria-busy="true" aria-label="Loading photos for ${escapeHtml(item.label)}">
                  <span class="room-image-placeholder">Loading photos…</span>
                </div>`
              : `<p class="section-media-pending" aria-busy="true">Loading photos…</p>`
            : displayImages.length
              ? useCardLayout
                ? `<div class="room-image-viewer" data-section-key="${sectionKey}" data-item-index="${itemIndex}" data-folder-path="${escapeHtml(item.folderPath || "")}">
                  <button type="button" class="room-image-nav room-image-nav--prev" data-room-nav="prev" aria-label="Previous image">&#10094;</button>
                  <img class="room-image-main" src="${escapeHtml(resolveImagePath(displayImages[0], "default"))}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-folder-path="${escapeHtml(item.folderPath || "")}" data-fallbacks="${serializeImageFallbacks(getSectionItemImageCandidates(item, 0).slice(1), "default")}" ${imageFallbackOnErrorAttr()} alt="${escapeHtml(item.label)} image 1" loading="eager" decoding="async" fetchpriority="high">
                  <button type="button" class="room-image-nav room-image-nav--next" data-room-nav="next" aria-label="Next image">&#10095;</button>
                  <span class="room-image-counter">1 / ${displayImages.length}</span>
                  <span class="room-expand-hint" aria-hidden="true">Click to expand</span>
                </div>`
                : `<div class="section-item__thumbs">
                  ${displayImages
                    .map((imageUrl, imageIndex) => `
                      <button
                        type="button"
                        class="section-thumb-btn"
                        data-section-key="${sectionKey}"
                        data-item-index="${itemIndex}"
                        data-image-index="${imageIndex}"
                        aria-label="Open image ${imageIndex + 1}"
                      >
                        <img src="${escapeHtml(resolveImagePath(imageUrl, "thumb"))}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-folder-path="${escapeHtml(item.folderPath || "")}" data-fallbacks="${serializeImageFallbacks(getSectionItemImageCandidates(item, imageIndex).slice(1), "thumb")}" alt="${escapeHtml(item.label)} image ${imageIndex + 1}" loading="lazy" decoding="async" ${imageFallbackOnErrorAttr()}>
                      </button>
                    `)
                    .join("")}
                </div>`
              : ""
        }
        ${item.description ? `<p class="section-item__desc">${escapeHtml(item.description)}</p>` : ""}
        ${
          sectionKey === "rooms"
            ? `<div class="section-item__actions">
                <a class="section-inquire-link" href="${escapeHtml(createRoomWhatsAppLink(hotelName, item.label))}" target="_blank" rel="noopener noreferrer">Check Availability</a>
              </div>`
            : ""
        }
      </article>
    `;
    })
    .join("");

  if (useCardLayout) {
    return `<div class="section-room-grid">${renderedItems}</div>`;
  }
  return renderedItems;
}

function setupHotelInfoTabs(contentEl, sectionData, lightboxApi, options = {}) {
  const initialTab = String(options.initialTab || "rooms");
  const onTabChange = typeof options.onTabChange === "function" ? options.onTabChange : null;
  const hotelName = String(options.hotelName || "").trim();

  const tabs = Array.from(contentEl.querySelectorAll(".info-tab"));
  const panelTitle = contentEl.querySelector("#hotelInfoPanelTitle");
  const panelBody = contentEl.querySelector("#hotelInfoPanelBody");
  if (!tabs.length || !panelTitle || !panelBody) return null;

  const bindSectionThumbs = () => {
    panelBody.querySelectorAll(".section-thumb-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sectionKey = btn.dataset.sectionKey || "";
        const itemIndex = Number(btn.dataset.itemIndex || 0);
        const imageIndex = Number(btn.dataset.imageIndex || 0);
        const section = sectionData[sectionKey];
        const item = section?.items?.[itemIndex];
        const itemImages = item ? getSectionItemDisplayImages(item) : [];
        if (!itemImages.length) return;
        const thumbImg = btn.querySelector("img");
        lightboxApi.open({
          images: itemImages,
          imageCandidatesByIndex: itemImages.map((_, slideIndex) =>
            getSectionItemImageCandidates(item, slideIndex)
          ),
          startIndex: imageIndex,
          resolvedSrc: thumbImg?.currentSrc || thumbImg?.src
        });
        btn.blur();
      });
    });
  };

  let activeTabKey = initialTab;

  const bindCardImageViewers = (bindGenerationId, specificViewers = null) => {
    const viewers = specificViewers ?? Array.from(panelBody.querySelectorAll(".room-image-viewer"));
    const isStaleBind = () =>
      String(panelBody.dataset.cardBindGeneration || "") !== String(bindGenerationId);

    return Promise.all(
      Array.from(viewers).map(async (viewer) => {
      const sectionKey = viewer.dataset.sectionKey || "rooms";
      const itemIndex = Number(viewer.dataset.itemIndex || 0);
      const getLiveItem = () => {
        const section = sectionData[sectionKey];
        return section && Array.isArray(section.items) ? section.items[itemIndex] : null;
      };
      const getLiveImages = () => getSectionItemDisplayImages(getLiveItem());

      const mainImageEl = viewer.querySelector(".room-image-main");
      const counterEl = viewer.querySelector(".room-image-counter");
      const prevBtn = viewer.querySelector('[data-room-nav="prev"]');
      const nextBtn = viewer.querySelector('[data-room-nav="next"]');
      const images = getLiveImages();
      if (!mainImageEl || !counterEl || !prevBtn || !nextBtn || !images.length) return;
      if (isStaleBind()) return;

      let currentIndex = 0;
      const updateViewerUi = (normalizedIndex) => {
        currentIndex = normalizedIndex;
        const item = getLiveItem();
        const liveImages = getLiveImages();
        mainImageEl.alt = `${item?.label || "Image"} ${currentIndex + 1}`;
        counterEl.textContent = `${currentIndex + 1} / ${liveImages.length}`;
      };

      const applyCardSlide = (imgEl, slideIndex) => {
        const candidates = getSectionItemImageCandidates(getLiveItem(), slideIndex);
        applyImageWithFallbacks(imgEl, candidates, { transformKey: "default" });
      };

      let cardSwipe = null;
      try {
        cardSwipe = await bindJanaImageCarousel({
          mountBefore: mainImageEl,
          mainImageEl,
          viewportClass: "room-swipe-viewport",
          getSlideCount: () => getLiveImages().length,
          applySlideToImage: applyCardSlide,
          onIndexChange: updateViewerUi
        });
      } catch (cardSwipeError) {
        console.error("Room image carousel failed to initialize:", cardSwipeError);
      }

      if (isStaleBind()) {
        cardSwipe?.destroy?.();
        return;
      }
      viewer._janaCardSwipe = cardSwipe;

      const setActiveImage = (nextIndex) => {
        const liveImages = getLiveImages();
        if (!liveImages.length) return;
        const normalizedIndex = ((nextIndex % liveImages.length) + liveImages.length) % liveImages.length;
        if (cardSwipe) {
          cardSwipe.setIndex(normalizedIndex, { silent: true });
          updateViewerUi(normalizedIndex);
          return;
        }
        updateViewerUi(normalizedIndex);
        applyImageWithFallbacks(
          mainImageEl,
          getSectionItemImageCandidates(getLiveItem(), normalizedIndex),
          { transformKey: "default" }
        );
      };

      const openCardLightbox = () => {
        if (cardSwipe?.didDrag?.()) return;
        const item = getLiveItem();
        const liveImages = getLiveImages();
        const activeImg = cardSwipe?.getActiveImage?.() || mainImageEl;
        lightboxApi.open({
          images: liveImages,
          imageCandidatesByIndex: liveImages.map((_, slideIndex) =>
            getSectionItemImageCandidates(item, slideIndex)
          ),
          startIndex: currentIndex,
          resolvedSrc: activeImg.currentSrc || activeImg.src
        });
      };

      prevBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        setActiveImage(currentIndex - 1);
        blurAfterMouseClick(prevBtn, event);
      });
      nextBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        setActiveImage(currentIndex + 1);
        blurAfterMouseClick(nextBtn, event);
      });
      viewer.addEventListener("click", (event) => {
        if (event.target.closest(".room-image-nav")) return;
        if (!event.target.closest("img")) return;
        if (cardSwipe?.didDrag?.()) return;
        openCardLightbox();
      });
      mainImageEl.setAttribute("role", "button");
      mainImageEl.setAttribute("tabindex", "0");
      mainImageEl.setAttribute("aria-label", `View ${getLiveItem()?.label || "image"} fullscreen`);
      mainImageEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCardLightbox();
        }
      });

      if (!cardSwipe) setActiveImage(0);
      const liveCount = getLiveImages().length;
      if (liveCount <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
      bindHoverChromeToggle(viewer);
      })
    );
  };

  const patchSectionItemInPanel = (sectionKey, itemIndex, item, bindGenerationId) => {
    const article = panelBody.querySelector(`article[data-item-index="${itemIndex}"]`);
    if (!article) return;
    const isStale = () =>
      String(panelBody.dataset.cardBindGeneration || "") !== String(bindGenerationId);
    if (isStale()) return;
    const useCardLayout = isInfoCardSection(sectionKey);
    const displayImages = getSectionItemDisplayImages(item);
    const hotelSlug = String(options.hotelSlug || "").trim();
    if (useCardLayout) {
      const placeholder = article.querySelector(".room-image-viewer--pending");
      if (!placeholder) return;
      if (!displayImages.length) { placeholder.remove(); return; }
      placeholder.outerHTML = `<div class="room-image-viewer" data-section-key="${sectionKey}" data-item-index="${itemIndex}" data-folder-path="${escapeHtml(item.folderPath || "")}">
        <button type="button" class="room-image-nav room-image-nav--prev" data-room-nav="prev" aria-label="Previous image">&#10094;</button>
        <img class="room-image-main" src="${escapeHtml(resolveImagePath(displayImages[0], "default"))}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-folder-path="${escapeHtml(item.folderPath || "")}" data-fallbacks="${serializeImageFallbacks(getSectionItemImageCandidates(item, 0).slice(1), "default")}" ${imageFallbackOnErrorAttr()} alt="${escapeHtml(item.label)} image 1" loading="eager" decoding="async" fetchpriority="high">
        <button type="button" class="room-image-nav room-image-nav--next" data-room-nav="next" aria-label="Next image">&#10095;</button>
        <span class="room-image-counter">1 / ${displayImages.length}</span>
        <span class="room-expand-hint" aria-hidden="true">Click to expand</span>
      </div>`;
      if (isStale()) return;
      const newViewer = article.querySelector(`.room-image-viewer[data-item-index="${itemIndex}"]`);
      if (newViewer) void bindCardImageViewers(bindGenerationId, [newViewer]);
    } else {
      const placeholder = article.querySelector(".section-media-pending");
      if (!placeholder) return;
      if (!displayImages.length) { placeholder.remove(); return; }
      placeholder.outerHTML = `<div class="section-item__thumbs">
        ${displayImages.map((imageUrl, imageIndex) => `
          <button type="button" class="section-thumb-btn" data-section-key="${sectionKey}" data-item-index="${itemIndex}" data-image-index="${imageIndex}" aria-label="Open image ${imageIndex + 1}">
            <img src="${escapeHtml(resolveImagePath(imageUrl, "thumb"))}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-folder-path="${escapeHtml(item.folderPath || "")}" data-fallbacks="${serializeImageFallbacks(getSectionItemImageCandidates(item, imageIndex).slice(1), "thumb")}" alt="${escapeHtml(item.label)} image ${imageIndex + 1}" loading="lazy" decoding="async" ${imageFallbackOnErrorAttr()}>
          </button>
        `).join("")}
      </div>`;
      if (!isStale()) bindSectionThumbs();
    }
  };

  const renderActivePanel = (key) => {
    const section = sectionData[key];
    if (!section) return;
    destroyPanelCardSwipers(panelBody);
    const bindGenerationId = String(Number(panelBody.dataset.cardBindGeneration || 0) + 1);
    panelBody.dataset.cardBindGeneration = bindGenerationId;
    panelTitle.textContent = section.title;
    panelBody.innerHTML = renderSectionItemsHtml(section.items, key, { hotelName, hotelSlug: options.hotelSlug });
    panelBody.classList.toggle("info-panel__body--hydrating", !section.itemsLoaded);
    bindSectionThumbs();
    void bindCardImageViewers(bindGenerationId);
  };

  const setActiveTab = (key) => {
    const section = sectionData[key];
    if (!section) return;
    activeTabKey = key;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.infoSection === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    renderActivePanel(key);
    const bindGeneration = String(panelBody.dataset.cardBindGeneration || "");
    ensureSectionHydrated(
      section,
      () => {
        if (activeTabKey === key) panelBody.classList.remove("info-panel__body--hydrating");
      },
      (itemIndex, item) => {
        if (activeTabKey === key) patchSectionItemInPanel(key, itemIndex, item, bindGeneration);
      }
    );
    if (onTabChange) onTabChange(key);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.infoSection || "rooms");
    });
  });

  prewarmHotelSections(sectionData);

  const firstTab = sectionData[initialTab] ? initialTab : "rooms";
  setActiveTab(firstTab);
  return (key) => setActiveTab(key);
}

function animateNumericDetailValues(contentEl) {
  const valueNodes = contentEl.querySelectorAll(".detail-card .value, .detail-card .value-link");
  valueNodes.forEach((node, index) => {
    const originalText = String(node.textContent || "").trim();
    const match = originalText.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const targetValue = Number(match[1]);
    if (!Number.isFinite(targetValue)) return;
    const suffix = match[2] || "";
    const hasDecimals = match[1].includes(".");
    const durationMs = 1700;
    const startDelayMs = 220 + (index * 110);

    const update = (startAt, now) => {
      const progress = Math.min(1, (now - startAt) / durationMs);
      // Ease-out cubic for a smoother finish.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetValue * eased;
      const displayNumber = hasDecimals ? current.toFixed(1) : String(Math.floor(current));
      node.textContent = `${displayNumber}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame((nextNow) => update(startAt, nextNow));
      } else {
        node.textContent = `${match[1]}${suffix}`;
        node.classList.remove("counting-up");
      }
    };

    node.classList.add("counting-up");
    setTimeout(() => {
      const startAt = performance.now();
      requestAnimationFrame((now) => update(startAt, now));
    }, startDelayMs);
  });
}

async function renderHotel(hotel, persistedState = {}, options = {}) {
  const onPrimaryReady =
    typeof options.onPrimaryReady === "function" ? options.onPrimaryReady : null;
  const titleEl = document.getElementById("hotelTitle");
  const headerMetaEl = document.getElementById("hotelHeaderMeta");
  const contentEl = document.getElementById("hotelContent");
  if (!contentEl) return;

  const hotelName = hotel.name || "Hotel Package";
  if (titleEl) titleEl.textContent = hotelName;
  document.title = `${hotelName} | JANA Travel`;

  const hotelSlug = String(hotel.slug || "").trim();
  const mainImageCandidates = Array.isArray(hotel.mainImageCandidates) ? hotel.mainImageCandidates : [];
  const galleryImages = Array.isArray(hotel.mainImages) && hotel.mainImages.length ? hotel.mainImages : [HOTEL_PLACEHOLDER_IMAGE];
  const heroCandidates = mainImageCandidates[0]?.length ? mainImageCandidates[0] : galleryImages;
  const mainImageLogical = (Array.isArray(heroCandidates) ? heroCandidates[0] : heroCandidates) || HOTEL_PLACEHOLDER_IMAGE;
  const mainImage = resolveImagePath(mainImageLogical, "hero");
  const heroFallbacksAttr = serializeImageFallbacks(
    Array.isArray(heroCandidates) ? heroCandidates : [mainImageLogical],
    "hero"
  );
  const ratingLabel = formatRating(hotel.rating);
  const starCount = parseStarRating(hotel.rating);
  const destinationValue = String(hotel.destination || "").trim();
  const destinationPageUrl = getDestinationPageUrl(destinationValue);
  const mapUrl = String(hotel.googleMapsLink || "").trim();
  const hasMapUrl = /^https?:\/\//i.test(mapUrl);
  const locationValue = String(hotel.location || "").trim() || "Not specified";
  const distanceFromAirportValue = formatDistanceFromAirport(hotel.distanceFromAirport);
  const restaurantsCount = String(hotel.restaurants || "").trim() || "Not specified";

  const roomsCount = String(hotel.rooms || "").trim() || "Not specified";
  const barsCount = String(hotel.bars || "").trim() || "Not specified";
  const islandSizeDisplay = formatIslandSize(hotel.islandSize);

  const details = [
    ["Location", locationValue],
    ["Distance from Airport", distanceFromAirportValue],
    ["Rating", ratingLabel],
    ["Island Size", islandSizeDisplay],
    ["Reef Type", hotel.reefType],
    ["No. of Rooms", roomsCount],
    ["No. of Restaurants", restaurantsCount],
    ["No. of Bars", barsCount],
    ["Meal Plan", hotel.mealPlan],
    ["Transfer Type", hotel.transferType],
    ["Experience", hotel.experience]
  ];
  const fullWidthDetailLabels = new Set(["Meal Plan", "Transfer Type", "Experience"]);

  const infoSections = {
    rooms: {
      title: "Room Types",
      items: hotel.roomTypeItems || [],
      itemsLoaded: areSectionItemsHydrated(hotel.roomTypeItems)
    },
    restaurants: {
      title: "Restaurants",
      items: hotel.restaurantItems || [],
      itemsLoaded: areSectionItemsHydrated(hotel.restaurantItems)
    },
    facilities: {
      title: "Facilities",
      items: hotel.facilityItems || [],
      itemsLoaded: areSectionItemsHydrated(hotel.facilityItems)
    },
    wellness: {
      title: "Wellness",
      items: hotel.wellnessItems || [],
      itemsLoaded: areSectionItemsHydrated(hotel.wellnessItems)
    }
  };

  if (headerMetaEl) {
    const destinationMarkup = destinationValue
      ? destinationPageUrl
        ? `<a class="hotel-subtitle-link" href="${destinationPageUrl}" aria-label="View ${escapeHtml(destinationValue)} destination page">${escapeHtml(destinationValue)}</a>`
        : `<span class="hotel-subtitle-text">${escapeHtml(destinationValue)}</span>`
      : "";
    headerMetaEl.innerHTML = `
      ${destinationMarkup}
      ${buildStarRatingMarkup(starCount)}
    `;
  }

  contentEl.innerHTML = `
    <div class="media-gallery">
      <div class="hero hero--interactive">
        <button type="button" class="hero-nav hero-nav--prev" id="hotelGalleryPrev" aria-label="Previous image">&#10094;</button>
        <img id="hotelMainImage" src="${escapeHtml(mainImage)}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-fallbacks="${heroFallbacksAttr}" ${imageFallbackOnErrorAttr()} alt="${escapeHtml(hotelName)} view 1" loading="eager" decoding="async" fetchpriority="high">
        <button type="button" class="hero-nav hero-nav--next" id="hotelGalleryNext" aria-label="Next image">&#10095;</button>
        <span class="hero-counter" id="hotelGalleryCounter">1 / ${galleryImages.length}</span>
        <button type="button" class="maximize-btn" id="hotelMaximizeBtn">Click to expand</button>
      </div>
      <div class="thumb-strip" id="hotelThumbStrip" role="list" aria-label="Hotel image previews">
      ${galleryImages
        .map((img, index) => {
          const thumbCandidates = mainImageCandidates[index]?.length
            ? mainImageCandidates[index]
            : [img];
          const thumbLogical = thumbCandidates[0] || HOTEL_PLACEHOLDER_IMAGE;
          const thumbSrc = resolveImagePath(thumbLogical, "thumb");
          return `
          <button type="button" class="thumb-btn${index === 0 ? " is-active" : ""}" data-index="${index}" role="listitem" aria-label="Show image ${index + 1}">
            <img src="${escapeHtml(thumbSrc)}" data-hotel-slug="${escapeHtml(hotelSlug)}" data-fallbacks="${serializeImageFallbacks(thumbCandidates, "thumb")}" ${imageFallbackOnErrorAttr()} alt="${escapeHtml(hotelName)} thumbnail ${index + 1}" loading="lazy" decoding="async">
          </button>`;
        })
        .join("")}
      </div>
    </div>
    <div class="image-lightbox" id="hotelImageLightbox" hidden>
      <button type="button" class="lightbox-close" id="hotelLightboxClose" aria-label="Close image viewer">&times;</button>
      <button type="button" class="lightbox-nav lightbox-nav--prev" id="hotelLightboxPrev" aria-label="Previous image">&#10094;</button>
      <span class="lightbox-counter" id="hotelLightboxCounter">1 / ${galleryImages.length}</span>
      <img id="hotelLightboxImage" src="${escapeHtml(resolveImagePath(mainImageLogical, "default"))}" data-hotel-slug="${escapeHtml(hotelSlug)}" alt="${escapeHtml(hotelName)} preview" loading="eager" decoding="async">
      <button type="button" class="lightbox-nav lightbox-nav--next" id="hotelLightboxNext" aria-label="Next image">&#10095;</button>
    </div>
    <h2>Hotel Details</h2>
    <div class="details-grid">
      ${details
        .map(([label, value]) => `
          <div class="detail-card${label === "Experience" ? " detail-card--wide" : ""}${fullWidthDetailLabels.has(label) ? " detail-card--full" : ""}">
            <span class="label">${escapeHtml(label)}</span>
            ${
              label === "Destination" && destinationPageUrl && value
                ? `<a class="value value-link" href="${destinationPageUrl}">${escapeHtml(value)}</a>`
                : label === "Location" && hasMapUrl
                  ? `<a class="value value-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value || "Not specified")}</a>`
                  : `<span class="value">${escapeHtml(value || "Not specified")}</span>`
            }
          </div>
        `)
        .join("")}
    </div>
    <p class="lead">${escapeHtml(hotel.description || "Discover this curated stay with JANA Travel.")}</p>
    <section class="info-sections">
      <h2>Explore Hotel Sections</h2>
      <div class="info-tabs" role="tablist" aria-label="Hotel information sections">
        <button type="button" class="info-tab is-active" data-info-section="rooms" role="tab" aria-selected="true">Rooms</button>
        <button type="button" class="info-tab" data-info-section="restaurants" role="tab" aria-selected="false">Restaurants</button>
        <button type="button" class="info-tab" data-info-section="facilities" role="tab" aria-selected="false">Facilities</button>
        <button type="button" class="info-tab" data-info-section="wellness" role="tab" aria-selected="false">Wellness</button>
      </div>
      <div class="info-panel" role="region" aria-live="polite">
        <h3 id="hotelInfoPanelTitle">Room Types</h3>
        <div id="hotelInfoPanelBody"></div>
      </div>
    </section>
    <div class="cta">
      <a href="${createWhatsAppLink(hotel.name)}" target="_blank" rel="noopener noreferrer">Plan Your Stay</a>
    </div>
  `;

  let lightboxApi = { open: () => {} };
  try {
    lightboxApi = await setupImageLightbox(contentEl);
    await setupHotelGallery(contentEl, galleryImages, hotelName, lightboxApi, {
      imageCandidates: mainImageCandidates,
      initialIndex: Number(persistedState.galleryIndex || 0),
      onGalleryIndexChange: (index) => saveHotelViewState(hotel.slug, { galleryIndex: index })
    });
  } catch (carouselError) {
    console.error("Hotel image carousel failed to initialize:", carouselError);
  }
  animateNumericDetailValues(contentEl);

  if (onPrimaryReady) onPrimaryReady();

  let setActiveTab = null;
  try {
    setActiveTab = setupHotelInfoTabs(contentEl, infoSections, lightboxApi, {
      initialTab: String(persistedState.activeTab || "rooms"),
      hotelName,
      hotelSlug: String(hotel.slug || "").trim(),
      onTabChange: (tabKey) => saveHotelViewState(hotel.slug, { activeTab: tabKey })
    });
  } catch (tabsError) {
    console.error("Failed to initialize hotel info tabs:", tabsError);
  }


}

function bindHotelMediaCacheRefreshOnNavigation() {
  if (typeof window === "undefined" || window.__janaHotelMediaNavBound) return;
  window.__janaHotelMediaNavBound = true;
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    mediaDeliveryCacheBust = `${HOTEL_MEDIA_CACHE_VERSION}_${Math.floor(Date.now() / 86400000)}`;
    setImageProbeCacheToken(mediaDeliveryCacheBust);
    clearImageProbeCache();
  });
}

async function initHotelsRoutePage() {
  startHotelDataCacheAutoCleanup();
  bindHotelMediaCacheRefreshOnNavigation();
  const pageProgress = createLoadingProgress({
    baseMessage: "Loading hotel package",
    estimateMs: 3500,
    onUpdate: (text, percent) => updateState("loading", text, percent)
  });
  pageProgress.start();
  pageProgress.setProgress(2);

  let hotel = null;

  try {
    const params = new URLSearchParams(window.location.search);
    const slug = String(params.get("id") || "").trim().toLowerCase();
    if (!slug) {
      pageProgress.stop();
      updateState("error", "Missing hotel id in URL.");
      return;
    }

    hotel = await loadHotelBySlug(slug, (percent) => {
      pageProgress.setProgress(Math.min(percent, 94));
    });
    if (!hotel) {
      pageProgress.stop();
      updateState("empty", "Hotel package not found.");
      return;
    }

    pageProgress.setProgress(95);
    const persistedState = loadHotelViewState(slug);
    await renderHotel(hotel, persistedState, {
      onPrimaryReady: () => hideHotelPageLoading(pageProgress)
    });

    const restoreScrollY = Number(persistedState.scrollY);
    if (Number.isFinite(restoreScrollY) && restoreScrollY >= 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, restoreScrollY));
      });
    }

    let scrollSaveTimer = null;
    let shouldPersistViewState = true;
    const persistScroll = () => {
      if (!shouldPersistViewState) return;
      if (scrollSaveTimer) return;
      scrollSaveTimer = window.setTimeout(() => {
        scrollSaveTimer = null;
        saveHotelViewState(slug, { scrollY: window.scrollY || 0 });
      }, 120);
    };
    const clearStateOnBackNavigation = () => {
      shouldPersistViewState = false;
      clearHotelViewState(slug);
    };

    const backLink = document.querySelector(".back-link");
    if (backLink) {
      backLink.addEventListener("click", clearStateOnBackNavigation);
    }

    window.addEventListener("scroll", persistScroll, { passive: true });
    window.addEventListener("popstate", clearStateOnBackNavigation);
    window.addEventListener("beforeunload", () => {
      if (shouldPersistViewState) {
        saveHotelViewState(slug, { scrollY: window.scrollY || 0 });
      } else {
        clearHotelViewState(slug);
      }
    });
    window.addEventListener("pagehide", () => {
      if (shouldPersistViewState) {
        saveHotelViewState(slug, { scrollY: window.scrollY || 0 });
      } else {
        clearHotelViewState(slug);
      }
    });

  } catch (error) {
    pageProgress.stop();
    console.error(error);
    updateState("error", "Failed to load hotel package data.");
  } finally {
    const stateEl = document.getElementById("hotelPageState");
    if (hotel && stateEl && stateEl.classList.contains("loading")) {
      hideHotelPageLoading(pageProgress);
    }
  }
}

window.JanaHotelsRoute = {
  loadJsonData,
  loadHotelsData,
  resolveImagePath,
  createWhatsAppLink,
  renderHotel
};

initHotelsRoutePage();
