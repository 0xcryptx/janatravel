import { createLoadingProgress, formatLoadingText } from "./loading-progress.js";

const LOCAL_JSON_URL = "../data/hotels.json";
const WHATSAPP_NUMBER = "971501771927";
const HOTEL_PLACEHOLDER_IMAGE = "../assets/images/add_image.webp";
const GOOGLE_SHEETS_HOTELS_URL = "";
const HOTEL_IMAGE_BASE_PATHS = ["../hotel_images", "../assets/hotel_images"];
const IMAGE_INDEXES = [1, 2, 3, 4];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
const HOTEL_VIEW_STATE_PREFIX = "jana:hotelViewState:";
const HOTEL_DATA_CACHE_PREFIX = "jana:hotelData:";
const HOTEL_DATA_CACHE_TTL_MINUTES = 5;
const HOTEL_DATA_CACHE_TTL_MS = HOTEL_DATA_CACHE_TTL_MINUTES * 60 * 1000;
const HOTEL_DATA_CACHE_CLEANUP_INTERVAL_MS = 60 * 1000;
const IMAGE_EXISTS_CACHE = new Map();
const IMAGE_PROBE_TIMEOUT_MS = 450;
let hotelDataCacheCleanupTimerId = null;

function loadJsonData(url) {
  return fetch(url, { cache: "no-store" }).then((res) => {
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

function resolveImagePath(path) {
  if (!path) return "";
  return path;
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

function getDestinationPageUrl(destination) {
  const normalized = String(destination || "").toLowerCase().trim();
  if (!normalized) return "";
  if (normalized.includes("maldives")) return "../maldives/";
  if (normalized.includes("seychelles")) return "../seychelles/";
  if (normalized.includes("mauritius")) return "../mauritius/";
  return "";
}

/** Destination total land area (display). Single source — change here to update hotel pages everywhere. Not read from sheets/forms. */
const DESTINATION_LAND_AREA_SQ_KM_DISPLAY = Object.freeze({
  maldives: "298 sq km",
  seychelles: "457 sq km",
  mauritius: "2,040 sq km"
});

function getDestinationIslandAreaDisplay(destination) {
  const normalized = String(destination || "").toLowerCase().trim();
  if (!normalized) return "";
  if (normalized.includes("maldives")) return DESTINATION_LAND_AREA_SQ_KM_DISPLAY.maldives;
  if (normalized.includes("seychelles")) return DESTINATION_LAND_AREA_SQ_KM_DISPLAY.seychelles;
  if (normalized.includes("mauritius")) return DESTINATION_LAND_AREA_SQ_KM_DISPLAY.mauritius;
  return "";
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
    return parsed.data || null;
  } catch (error) {
    return null;
  }
}

function saveCachedHotelData(slug, signature, hotelData) {
  const key = getHotelDataCacheKey(slug);
  try {
    const payload = {
      expiresAt: Date.now() + HOTEL_DATA_CACHE_TTL_MS,
      signature,
      data: hotelData
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage issues.
  }
}

async function doesImageExist(url) {
  if (IMAGE_EXISTS_CACHE.has(url)) {
    return IMAGE_EXISTS_CACHE.get(url);
  }

  const pendingCheck = (async () => {
    const withTimeout = async (requestUrl, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMAGE_PROBE_TIMEOUT_MS);
      try {
        return await fetch(requestUrl, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      const headResponse = await withTimeout(url, { method: "HEAD", cache: "force-cache" });
      if (headResponse.ok) return true;
      if (headResponse.status !== 405) return false;
    } catch (error) {
      // Ignore and attempt GET fallback.
    }
    try {
      const getResponse = await withTimeout(url, { method: "GET", cache: "force-cache" });
      return getResponse.ok;
    } catch (error) {
      return false;
    }
  })();

  IMAGE_EXISTS_CACHE.set(url, pendingCheck);
  return pendingCheck;
}

async function resolveHotelImageBasePath(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;
  for (const basePath of HOTEL_IMAGE_BASE_PATHS) {
    const folderPath = `${basePath}/${normalizedSlug}`;
    const firstImage = await findFirstExistingImage(folderPath, "1");
    if (firstImage) {
      return { basePath, firstImage };
    }
    const fallbackImage = await findFirstExistingImage(folderPath, "add_image");
    if (fallbackImage) {
      return { basePath, firstImage: fallbackImage };
    }
  }
  return null;
}

async function findFirstExistingImage(folderPath, baseName) {
  const candidates = IMAGE_EXTENSIONS.map((ext) => `${folderPath}/${baseName}.${ext}`);
  const checks = await Promise.all(candidates.map((candidate) => doesImageExist(candidate)));
  const matchedIndex = checks.findIndex(Boolean);
  return matchedIndex >= 0 ? candidates[matchedIndex] : "";
}

async function collectNumberedImages(folderPath) {
  const firstImage = await findFirstExistingImage(folderPath, "1");
  if (!firstImage) {
    const fallbackImage = await findFirstExistingImage(folderPath, "add_image");
    return fallbackImage ? [fallbackImage] : [];
  }

  const imageUrls = [firstImage];
  const preferredExt = (firstImage.match(/\.([a-z0-9]+)(?:$|\?)/i) || [])[1]?.toLowerCase() || "";
  const otherIndexes = IMAGE_INDEXES.filter((index) => index !== 1);

  const resolved = await Promise.all(
    otherIndexes.map(async (index) => {
      if (preferredExt) {
        const preferredUrl = `${folderPath}/${index}.${preferredExt}`;
        if (await doesImageExist(preferredUrl)) return preferredUrl;
      }
      return findFirstExistingImage(folderPath, String(index));
    })
  );

  for (const imageUrl of resolved) {
    if (imageUrl) imageUrls.push(imageUrl);
  }

  return imageUrls;
}

async function collectMainGalleryImages(basePath, slug, firstImage) {
  const folderPath = `${basePath}/${slug}`;
  const hasNumberedPattern = /\/1\.[a-z0-9]+(?:$|\?)/i.test(firstImage);
  if (!hasNumberedPattern) return [firstImage];

  const indexedImages = new Map([[1, firstImage]]);
  const resolved = await Promise.all(
    IMAGE_INDEXES.filter((index) => index !== 1).map(async (index) => ({
      index,
      image: await findFirstExistingImage(folderPath, String(index))
    }))
  );

  for (const item of resolved) {
    if (item.image) indexedImages.set(item.index, item.image);
  }

  return IMAGE_INDEXES.map((index) => indexedImages.get(index)).filter(Boolean);
}

function buildIndexedSectionItems(basePath, slug, sectionFolder, itemPrefix, entries) {
  return entries.map((entry, index) => ({
    label: entry.label,
    description: entry.description || "",
    folderPath: `${basePath}/${slug}/${sectionFolder}/${itemPrefix}${index + 1}`,
    images: [],
    loaded: false
  }));
}

function areSectionItemsHydrated(items) {
  if (!Array.isArray(items) || !items.length) return true;
  return items.every((item) => item.loaded);
}

async function hydrateSectionItems(section, onProgress) {
  if (!section || !Array.isArray(section.items) || section.itemsLoaded) return;
  const items = section.items;
  if (areSectionItemsHydrated(items)) {
    section.itemsLoaded = true;
    return;
  }

  const total = items.length || 1;
  let completed = 0;

  const hydratedItems = await Promise.all(
    items.map(async (item) => {
      if (item.loaded) return item;
      const images = await collectNumberedImages(item.folderPath);
      completed += 1;
      if (typeof onProgress === "function") {
        onProgress(Math.round((completed / total) * 100));
      }
      return { ...item, images, loaded: true };
    })
  );

  section.items = hydratedItems;
  section.itemsLoaded = true;
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

async function prepareHotelMedia(hotel, onProgress) {
  if (!hotel) return null;
  const slug = String(hotel.slug || "").trim();
  if (!slug || !String(hotel.name || "").trim() || !isHotelActive(hotel.active)) return null;

  if (typeof onProgress === "function") onProgress(62);
  const imageBaseResult = await resolveHotelImageBasePath(slug);
  if (!imageBaseResult) return null;
  if (typeof onProgress === "function") onProgress(72);
  const imageBasePath = imageBaseResult.basePath;
  const firstImage = imageBaseResult.firstImage;
  const mainImages = await collectMainGalleryImages(imageBasePath, slug, firstImage);
  if (!mainImages.length) return null;
  if (typeof onProgress === "function") onProgress(85);

  const roomTypeItemsText = parseNamedItemsWithDescription(hotel.roomTypes);
  const facilityItemsText = parseNamedItemsWithDescription(hotel.facilities);
  const wellnessItemsText = parseNamedItemsWithDescription(hotel.wellness);
  const restaurantItemsText = parseNamedItemsWithDescription(hotel.restaurantNames);

  const roomSection = {
    items: buildIndexedSectionItems(imageBasePath, slug, "rooms", "room", roomTypeItemsText),
    itemsLoaded: false
  };
  const facilitySection = {
    items: buildIndexedSectionItems(imageBasePath, slug, "facilities", "fac", facilityItemsText),
    itemsLoaded: false
  };
  const wellnessSection = {
    items: buildIndexedSectionItems(imageBasePath, slug, "wellness", "well", wellnessItemsText),
    itemsLoaded: false
  };
  const restaurantSection = {
    items: buildIndexedSectionItems(imageBasePath, slug, "restaurants", "res", restaurantItemsText),
    itemsLoaded: false
  };

  if (typeof onProgress === "function") onProgress(88);
  await hydrateAllHotelSections([roomSection, facilitySection, wellnessSection, restaurantSection]);

  const roomTypeItems = roomSection.items;
  const facilityItems = facilitySection.items;
  const wellnessItems = wellnessSection.items;
  const restaurantItems = restaurantSection.items;

  return {
    ...hotel,
    slug,
    imageBasePath,
    mainImages,
    imageUrl: String(hotel.imageUrl || "").trim() || mainImages[0] || HOTEL_PLACEHOLDER_IMAGE,
    galleryImages: mainImages,
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

  const preparedHotels = await Promise.all(hotels.map((hotel) => prepareHotelMedia(hotel)));
  return preparedHotels.filter(Boolean);
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
  if (cachedHotel) {
    if (typeof onProgress === "function") onProgress(96);
    return cachedHotel;
  }
  const preparedHotel = await prepareHotelMedia(matchedHotel, (mediaProgress) => {
    if (typeof onProgress === "function") {
      onProgress(55 + Math.round(mediaProgress * 0.4));
    }
  });
  if (preparedHotel) {
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

function setupImageLightbox(contentEl) {
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
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isTouchSwiping = false;
  const swipeThreshold = 55;

  const setLightboxImage = (nextIndex) => {
    if (!currentImages.length) return;
    const normalizedIndex = ((nextIndex % currentImages.length) + currentImages.length) % currentImages.length;
    currentIndex = normalizedIndex;
    lightboxImage.src = resolveImagePath(currentImages[currentIndex]);
    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
  };

  const closeLightbox = () => {
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("lightbox-open");
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

  const openLightbox = (images, startIndex = 0) => {
    if (!Array.isArray(images) || !images.length) return;
    currentImages = images;
    setLightboxImage(startIndex);
    lightbox.removeAttribute("hidden");
    document.body.classList.add("lightbox-open");
  };

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", () => setLightboxImage(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setLightboxImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hasAttribute("hidden")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") setLightboxImage(currentIndex - 1);
    if (event.key === "ArrowRight") setLightboxImage(currentIndex + 1);
  });

  // Touch-swipe support for fullscreen image navigation on phones.
  lightbox.addEventListener("touchstart", (event) => {
    if (lightbox.hasAttribute("hidden")) return;
    touchStartX = event.touches[0].clientX;
    touchCurrentX = touchStartX;
    isTouchSwiping = true;
  }, { passive: true });

  lightbox.addEventListener("touchmove", (event) => {
    if (!isTouchSwiping || lightbox.hasAttribute("hidden")) return;
    touchCurrentX = event.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", () => {
    if (!isTouchSwiping || lightbox.hasAttribute("hidden")) return;
    const diff = touchCurrentX - touchStartX;
    isTouchSwiping = false;
    if (Math.abs(diff) < swipeThreshold) return;
    if (diff > 0) {
      setLightboxImage(currentIndex - 1);
    } else {
      setLightboxImage(currentIndex + 1);
    }
  });

  return { open: openLightbox };
}

function setupHotelGallery(contentEl, images, hotelName, lightboxApi, options = {}) {
  const mainImageEl = contentEl.querySelector("#hotelMainImage");
  const thumbButtons = Array.from(contentEl.querySelectorAll(".thumb-btn"));
  const maximizeBtn = contentEl.querySelector("#hotelMaximizeBtn");
  const prevBtn = contentEl.querySelector("#hotelGalleryPrev");
  const nextBtn = contentEl.querySelector("#hotelGalleryNext");
  const counterEl = contentEl.querySelector("#hotelGalleryCounter");
  const lightboxEl = contentEl.querySelector("#hotelImageLightbox");
  if (!mainImageEl || !thumbButtons.length) return;

  const galleryImages = images.length ? images : [HOTEL_PLACEHOLDER_IMAGE];
  let currentIndex = 0;
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isTouchSwiping = false;
  const swipeThreshold = 55;
  const initialIndex = Number(options.initialIndex || 0);
  const onGalleryIndexChange = typeof options.onGalleryIndexChange === "function" ? options.onGalleryIndexChange : null;

  const setActiveImage = (nextIndex) => {
    if (!galleryImages.length) return;
    const normalizedIndex = ((nextIndex % galleryImages.length) + galleryImages.length) % galleryImages.length;
    currentIndex = normalizedIndex;
    const nextSrc = resolveImagePath(galleryImages[currentIndex]) || HOTEL_PLACEHOLDER_IMAGE;
    mainImageEl.src = nextSrc;
    mainImageEl.alt = `${hotelName} view ${currentIndex + 1}`;
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
    thumbButtons.forEach((btn, index) => {
      btn.classList.toggle("is-active", index === currentIndex);
    });
    if (onGalleryIndexChange) onGalleryIndexChange(currentIndex);
  };

  thumbButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index || 0);
      setActiveImage(Number.isFinite(idx) ? idx : 0);
      btn.blur();
    });
  });

  const openMainLightbox = () => lightboxApi.open(galleryImages, currentIndex);
  if (prevBtn) prevBtn.addEventListener("click", () => setActiveImage(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setActiveImage(currentIndex + 1));
  if (maximizeBtn) maximizeBtn.addEventListener("click", openMainLightbox);
  mainImageEl.addEventListener("click", openMainLightbox);

  document.addEventListener("keydown", (event) => {
    if (!contentEl.isConnected) return;
    if (lightboxEl && !lightboxEl.hasAttribute("hidden")) return;
    if (event.key === "ArrowLeft") setActiveImage(currentIndex - 1);
    if (event.key === "ArrowRight") setActiveImage(currentIndex + 1);
  });

  // Touch-swipe support for the main hotel hero image on phones.
  mainImageEl.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
    touchCurrentX = touchStartX;
    isTouchSwiping = true;
  }, { passive: true });

  mainImageEl.addEventListener("touchmove", (event) => {
    if (!isTouchSwiping) return;
    touchCurrentX = event.touches[0].clientX;
  }, { passive: true });

  mainImageEl.addEventListener("touchend", () => {
    if (!isTouchSwiping) return;
    const diff = touchCurrentX - touchStartX;
    isTouchSwiping = false;
    if (Math.abs(diff) < swipeThreshold) return;
    if (diff > 0) {
      setActiveImage(currentIndex - 1);
    } else {
      setActiveImage(currentIndex + 1);
    }
  });

  setActiveImage(Number.isFinite(initialIndex) ? initialIndex : 0);
}

function renderSectionItemsHtml(items, sectionKey, options = {}) {
  const hotelName = String(options.hotelName || "").trim();
  if (!items.length) {
    return `<p class="info-empty">Not specified yet.</p>`;
  }
  const renderedItems = items
    .map((item, itemIndex) => `
      <article class="section-item${sectionKey === "rooms" ? " section-item--room" : ""}">
        <h4 class="section-item__title">${escapeHtml(item.label)}</h4>
        ${
          item.images.length
            ? sectionKey === "rooms"
              ? `<div class="room-image-viewer" data-room-item-index="${itemIndex}">
                  <button type="button" class="room-image-nav room-image-nav--prev" data-room-nav="prev" aria-label="Previous room image">&#10094;</button>
                  <img class="room-image-main" src="${escapeHtml(item.images[0])}" alt="${escapeHtml(item.label)} image 1">
                  <button type="button" class="room-image-nav room-image-nav--next" data-room-nav="next" aria-label="Next room image">&#10095;</button>
                  <span class="room-image-counter">1 / ${item.images.length}</span>
                </div>`
              : `<div class="section-item__thumbs">
                  ${item.images
                    .map((imageUrl, imageIndex) => `
                      <button
                        type="button"
                        class="section-thumb-btn"
                        data-section-key="${sectionKey}"
                        data-item-index="${itemIndex}"
                        data-image-index="${imageIndex}"
                        aria-label="Open image ${imageIndex + 1}"
                      >
                        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.label)} image ${imageIndex + 1}">
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
    `)
    .join("");

  if (sectionKey === "rooms") {
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
  if (!tabs.length || !panelTitle || !panelBody) return Promise.resolve();

  const bindSectionThumbs = () => {
    panelBody.querySelectorAll(".section-thumb-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sectionKey = btn.dataset.sectionKey || "";
        const itemIndex = Number(btn.dataset.itemIndex || 0);
        const imageIndex = Number(btn.dataset.imageIndex || 0);
        const section = sectionData[sectionKey];
        if (!section || !section.items[itemIndex]) return;
        lightboxApi.open(section.items[itemIndex].images, imageIndex);
        btn.blur();
      });
    });
  };

  const bindRoomImageViewers = () => {
    panelBody.querySelectorAll(".room-image-viewer").forEach((viewer) => {
      const itemIndex = Number(viewer.dataset.roomItemIndex || 0);
      const roomSection = sectionData.rooms;
      const roomItem = roomSection && Array.isArray(roomSection.items) ? roomSection.items[itemIndex] : null;
      const images = roomItem && Array.isArray(roomItem.images) ? roomItem.images.filter(Boolean) : [];
      const mainImageEl = viewer.querySelector(".room-image-main");
      const counterEl = viewer.querySelector(".room-image-counter");
      const prevBtn = viewer.querySelector('[data-room-nav="prev"]');
      const nextBtn = viewer.querySelector('[data-room-nav="next"]');
      if (!mainImageEl || !counterEl || !prevBtn || !nextBtn || !images.length) return;

      let currentIndex = 0;
      const setActiveImage = (nextIndex) => {
        const normalizedIndex = ((nextIndex % images.length) + images.length) % images.length;
        currentIndex = normalizedIndex;
        mainImageEl.src = resolveImagePath(images[currentIndex]);
        mainImageEl.alt = `${roomItem?.label || "Room"} image ${currentIndex + 1}`;
        counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
      };

      prevBtn.addEventListener("click", () => setActiveImage(currentIndex - 1));
      nextBtn.addEventListener("click", () => setActiveImage(currentIndex + 1));
      mainImageEl.addEventListener("click", () => {
        lightboxApi.open(images, currentIndex);
      });

      setActiveImage(0);
      if (images.length <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
    });
  };

  const setActiveTab = async (key) => {
    const section = sectionData[key];
    if (!section) return;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.infoSection === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    panelTitle.textContent = section.title;
    const needsHydration =
      !section.itemsLoaded && section.items.some((item) => item.folderPath && !item.loaded);
    if (needsHydration) {
      const sectionProgress = createLoadingProgress({
        baseMessage: `Loading ${section.title.toLowerCase()}`,
        estimateMs: 4000,
        onUpdate: (text) => {
          panelBody.innerHTML = `<p class="info-empty loading-with-progress">${escapeHtml(text)}</p>`;
        }
      });
      sectionProgress.start();
      sectionProgress.setProgress(4);
      await hydrateSectionItems(section, (itemPercent) => {
        sectionProgress.setProgress(8 + Math.round(itemPercent * 0.9));
      });
      sectionProgress.stop();
    }
    panelBody.innerHTML = renderSectionItemsHtml(section.items, key, { hotelName });
    bindSectionThumbs();
    bindRoomImageViewers();
    if (onTabChange) onTabChange(key);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.infoSection || "rooms");
    });
  });

  return setActiveTab(sectionData[initialTab] ? initialTab : "rooms");
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

  const galleryImages = Array.isArray(hotel.mainImages) && hotel.mainImages.length ? hotel.mainImages : [HOTEL_PLACEHOLDER_IMAGE];
  const mainImage = galleryImages[0] || HOTEL_PLACEHOLDER_IMAGE;
  const ratingLabel = formatRating(hotel.rating);
  const starCount = parseStarRating(hotel.rating);
  const destinationValue = String(hotel.destination || "").trim();
  const destinationPageUrl = getDestinationPageUrl(destinationValue);
  const mapUrl = String(hotel.googleMapsLink || "").trim();
  const hasMapUrl = /^https?:\/\//i.test(mapUrl);
  const locationValue = String(hotel.location || "").trim() || "Not specified yet";
  const distanceFromAirportValue = String(hotel.distanceFromAirport || "").trim() || "Not specified yet";
  const restaurantsCount = String(hotel.restaurants || "").trim() || "Not specified yet";

  const roomsCount = String(hotel.rooms || "").trim() || "Not specified yet";
  const barsCount = String(hotel.bars || "").trim() || "Not specified yet";
  const islandSizeDisplay = getDestinationIslandAreaDisplay(destinationValue) || "Not specified yet";

  const details = [
    ["Location", locationValue],
    ["Distance from Airport", distanceFromAirportValue],
    ["Rating", ratingLabel],
    ["Island Size", islandSizeDisplay],
    ["Reef Type", hotel.reefType],
    ["No. of Rooms", roomsCount],
    ["Meal Plan", hotel.mealPlan],
    ["No. of Restaurants", restaurantsCount],
    ["No. of Bars", barsCount],
    ["Transfer Type", hotel.transferType],
    ["Experience", hotel.experience]
  ];

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
        ? `<a class="hotel-subtitle-link" href="${destinationPageUrl}">${escapeHtml(destinationValue)}</a>`
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
        <img id="hotelMainImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} view 1">
        <button type="button" class="hero-nav hero-nav--next" id="hotelGalleryNext" aria-label="Next image">&#10095;</button>
        <span class="hero-counter" id="hotelGalleryCounter">1 / ${galleryImages.length}</span>
        <button type="button" class="maximize-btn" id="hotelMaximizeBtn">Click to expand</button>
      </div>
      <div class="thumb-strip" id="hotelThumbStrip" role="list" aria-label="Hotel image previews">
      ${galleryImages
        .map((img, index) => `
          <button type="button" class="thumb-btn${index === 0 ? " is-active" : ""}" data-index="${index}" role="listitem" aria-label="Show image ${index + 1}">
            <img src="${escapeHtml(resolveImagePath(img))}" alt="${escapeHtml(hotelName)} thumbnail ${index + 1}">
          </button>
        `)
        .join("")}
      </div>
    </div>
    <div class="image-lightbox" id="hotelImageLightbox" hidden>
      <button type="button" class="lightbox-close" id="hotelLightboxClose" aria-label="Close image viewer">&times;</button>
      <button type="button" class="lightbox-nav lightbox-nav--prev" id="hotelLightboxPrev" aria-label="Previous image">&#10094;</button>
      <span class="lightbox-counter" id="hotelLightboxCounter">1 / ${galleryImages.length}</span>
      <img id="hotelLightboxImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} preview">
      <button type="button" class="lightbox-nav lightbox-nav--next" id="hotelLightboxNext" aria-label="Next image">&#10095;</button>
    </div>
    <h2>Hotel Details</h2>
    <div class="details-grid">
      ${details
        .map(([label, value]) => `
          <div class="detail-card${label === "Experience" ? " detail-card--wide" : ""}">
            <span class="label">${escapeHtml(label)}</span>
            ${
              label === "Destination" && destinationPageUrl && value
                ? `<a class="value value-link" href="${destinationPageUrl}">${escapeHtml(value)}</a>`
                : label === "Location" && hasMapUrl
                  ? `<a class="value value-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value || "Not specified yet")}</a>`
                  : `<span class="value">${escapeHtml(value || "Not specified yet")}</span>`
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

  const lightboxApi = setupImageLightbox(contentEl);
  setupHotelGallery(contentEl, galleryImages, hotelName, lightboxApi, {
    initialIndex: Number(persistedState.galleryIndex || 0),
    onGalleryIndexChange: (index) => saveHotelViewState(hotel.slug, { galleryIndex: index })
  });
  animateNumericDetailValues(contentEl);

  // Main gallery + details are visible — hide the page-level loader now.
  if (onPrimaryReady) onPrimaryReady();

  // Rooms / restaurants tabs load images in the background (can take several seconds).
  void setupHotelInfoTabs(contentEl, infoSections, lightboxApi, {
    initialTab: String(persistedState.activeTab || "rooms"),
    hotelName,
    onTabChange: (tabKey) => saveHotelViewState(hotel.slug, { activeTab: tabKey })
  }).catch((error) => {
    console.error("Failed to initialize hotel info tabs:", error);
  });
}

async function initHotelsRoutePage() {
  startHotelDataCacheAutoCleanup();
  const pageProgress = createLoadingProgress({
    baseMessage: "Loading hotel package",
    estimateMs: 14000,
    onUpdate: (text, percent) => updateState("loading", text, percent)
  });
  pageProgress.start();
  pageProgress.setProgress(2);

  try {
    const params = new URLSearchParams(window.location.search);
    const slug = String(params.get("id") || "").trim().toLowerCase();
    if (!slug) {
      pageProgress.stop();
      updateState("error", "Missing hotel id in URL.");
      return;
    }

    const hotel = await loadHotelBySlug(slug, (percent) => pageProgress.setProgress(percent));
    if (!hotel) {
      pageProgress.stop();
      updateState("empty", "Hotel package not found.");
      return;
    }

    pageProgress.setProgress(96);
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
