const LOCAL_JSON_URL = "../data/hotels.json";
const WHATSAPP_NUMBER = "9607409199";
const HOTEL_PLACEHOLDER_IMAGE = "../assets/images/add_image.webp";
const GOOGLE_SHEETS_HOTELS_URL = "";
const HOTEL_IMAGE_BASE_PATHS = ["../hotel_images", "../assets/hotel_images"];
const IMAGE_INDEXES = [1, 2, 3, 4];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
const HOTEL_VIEW_STATE_PREFIX = "jana:hotelViewState:";
const HOTEL_DATA_CACHE_PREFIX = "jana:hotelData:";
const HOTEL_DATA_CACHE_TTL_MS = 5 * 60 * 1000;

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

function parseDashSeparatedItems(value) {
  return String(value || "")
    .split("-")
    .map((item) => item.trim())
    .filter(Boolean);
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

function loadCachedHotelData(slug) {
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
    return parsed.data || null;
  } catch (error) {
    return null;
  }
}

function saveCachedHotelData(slug, hotelData) {
  const key = getHotelDataCacheKey(slug);
  try {
    const payload = {
      expiresAt: Date.now() + HOTEL_DATA_CACHE_TTL_MS,
      data: hotelData
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage issues.
  }
}

async function doesImageExist(url) {
  const withTimeout = async (requestUrl, options = {}, timeoutMs = 900) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(requestUrl, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const headResponse = await withTimeout(url, { method: "HEAD", cache: "no-store" });
    if (headResponse.ok) return true;
    if (headResponse.status !== 405) return false;
  } catch (error) {
    // Ignore and attempt GET fallback.
  }
  try {
    const getResponse = await withTimeout(url, { cache: "no-store" });
    return getResponse.ok;
  } catch (error) {
    return false;
  }
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
  const imageUrls = [];
  for (const imageIndex of IMAGE_INDEXES) {
    const imageUrl = await findFirstExistingImage(folderPath, String(imageIndex));
    if (imageUrl) imageUrls.push(imageUrl);
  }
  if (!imageUrls.length) {
    const fallbackImage = await findFirstExistingImage(folderPath, "add_image");
    if (fallbackImage) imageUrls.push(fallbackImage);
  }
  return imageUrls;
}

function buildIndexedSectionItems(basePath, slug, sectionFolder, itemPrefix, labels) {
  return labels.map((label, index) => ({
    label,
    folderPath: `${basePath}/${slug}/${sectionFolder}/${itemPrefix}${index + 1}`,
    images: [],
    loaded: false
  }));
}

async function hydrateSectionItems(section) {
  if (!section || !Array.isArray(section.items) || section.itemsLoaded) return;
  const hydratedItems = await Promise.all(
    section.items.map(async (item) => {
      if (item.loaded) return item;
      const images = await collectNumberedImages(item.folderPath);
      return { ...item, images, loaded: true };
    })
  );
  section.items = hydratedItems;
  section.itemsLoaded = true;
}

function normalizeSheetHotel(row) {
  const slug = String(getCaseInsensitiveField(row, ["slug", "Slug"]) || "").trim();
  const name = String(getCaseInsensitiveField(row, ["name", "Name"]) || "").trim();
  return {
    slug,
    name,
    active: getCaseInsensitiveField(row, ["active", "Active"]),
    destination: getCaseInsensitiveField(row, ["destination", "Destination"]),
    location: getCaseInsensitiveField(row, ["location", "Location"]),
    googleMapsLink: getCaseInsensitiveField(row, [
      "googleMapsLink",
      "Google Maps Link",
      "Google Map",
      "Google Maps",
      "Map Link",
      "Location Link"
    ]),
    rating: getCaseInsensitiveField(row, ["rating", "Rating"]),
    islandSize: getCaseInsensitiveField(row, ["islandSize", "Island Size"]),
    reefType: getCaseInsensitiveField(row, ["reefType", "Reef Type"]),
    experience: getCaseInsensitiveField(row, ["experience", "Experience"]),
    mealPlan: getCaseInsensitiveField(row, ["mealPlan", "Meal Plan"]),
    rooms: getCaseInsensitiveField(row, ["rooms", "Rooms"]),
    roomTypes: getCaseInsensitiveField(row, ["roomTypes", "Room Types"]),
    restaurants: getCaseInsensitiveField(row, ["restaurants", "Restaurants"]),
    restaurantNames: getCaseInsensitiveField(row, ["restaurantNames", "Restaurant Names"]),
    bars: getCaseInsensitiveField(row, ["bars", "Bars"]),
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

async function prepareHotelMedia(hotel) {
  if (!hotel) return null;
  const slug = String(hotel.slug || "").trim();
  if (!slug || !String(hotel.name || "").trim() || !isHotelActive(hotel.active)) return null;

  const imageBaseResult = await resolveHotelImageBasePath(slug);
  if (!imageBaseResult) return null;
  const imageBasePath = imageBaseResult.basePath;
  const firstImage = imageBaseResult.firstImage;
  const firstImageExtMatch = String(firstImage).match(/\.([a-z0-9]+)(?:$|\?)/i);
  const firstImageExt = firstImageExtMatch ? firstImageExtMatch[1].toLowerCase() : "";
  const hasNumberedPattern = /\/1\.[a-z0-9]+(?:$|\?)/i.test(firstImage);
  const mainImages = hasNumberedPattern && firstImageExt
    ? IMAGE_INDEXES.map((index) => `${imageBasePath}/${slug}/${index}.${firstImageExt}`)
    : [firstImage];

  const roomTypeItemsText = parseDashSeparatedItems(hotel.roomTypes);
  const facilityItemsText = parseDashSeparatedItems(hotel.facilities);
  const wellnessItemsText = parseDashSeparatedItems(hotel.wellness);
  const restaurantItemsText = parseDashSeparatedItems(hotel.restaurantNames);

  const roomTypeItems = buildIndexedSectionItems(imageBasePath, slug, "rooms", "room", roomTypeItemsText);
  const facilityItems = buildIndexedSectionItems(imageBasePath, slug, "facilities", "fac", facilityItemsText);
  const wellnessItems = buildIndexedSectionItems(imageBasePath, slug, "wellness", "well", wellnessItemsText);
  const restaurantItems = buildIndexedSectionItems(imageBasePath, slug, "restaurants", "res", restaurantItemsText);

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

async function loadHotelBySlug(slug) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return null;
  const cachedHotel = loadCachedHotelData(normalizedSlug);
  if (cachedHotel) return cachedHotel;

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

  const matchedHotel = hotels.find(
    (item) => String(item?.slug || "").trim().toLowerCase() === normalizedSlug
  );
  if (!matchedHotel || !isHotelActive(matchedHotel.active)) return null;
  const preparedHotel = await prepareHotelMedia(matchedHotel);
  if (preparedHotel) {
    saveCachedHotelData(normalizedSlug, preparedHotel);
  }
  return preparedHotel;
}

function updateState(type, message) {
  const stateEl = document.getElementById("hotelPageState");
  if (!stateEl) return;
  stateEl.className = `page-state ${type}`;
  stateEl.textContent = message;
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

function renderSectionItemsHtml(items, sectionKey) {
  if (!items.length) {
    return `<p class="info-empty">Not specified yet.</p>`;
  }
  return items
    .map((item, itemIndex) => `
      <article class="section-item">
        <h4 class="section-item__title">${escapeHtml(item.label)}</h4>
        ${
          item.images.length
            ? `<div class="section-item__thumbs">
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
      </article>
    `)
    .join("");
}

function setupHotelInfoTabs(contentEl, sectionData, lightboxApi, options = {}) {
  const initialTab = String(options.initialTab || "rooms");
  const onTabChange = typeof options.onTabChange === "function" ? options.onTabChange : null;

  const tabs = Array.from(contentEl.querySelectorAll(".info-tab"));
  const panelTitle = contentEl.querySelector("#hotelInfoPanelTitle");
  const panelBody = contentEl.querySelector("#hotelInfoPanelBody");
  if (!tabs.length || !panelTitle || !panelBody) return;

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

  const setActiveTab = async (key) => {
    const section = sectionData[key];
    if (!section) return;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.infoSection === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    panelTitle.textContent = section.title;
    if (!section.itemsLoaded && section.items.some((item) => item.folderPath)) {
      panelBody.innerHTML = `<p class="info-empty">Loading ${escapeHtml(section.title.toLowerCase())}...</p>`;
      await hydrateSectionItems(section);
    }
    panelBody.innerHTML = renderSectionItemsHtml(section.items, key);
    bindSectionThumbs();
    if (onTabChange) onTabChange(key);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.infoSection || "rooms");
    });
  });

  setActiveTab(sectionData[initialTab] ? initialTab : "rooms");
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

function renderHotel(hotel, persistedState = {}) {
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
  const restaurantsCount = String(hotel.restaurants || "").trim() || "Not specified yet";

  const details = [
    ["Location", locationValue],
    ["Rating", ratingLabel],
    ["Island Size", hotel.islandSize],
    ["Reef Type", hotel.reefType],
    ["Rooms", hotel.rooms],
    ["Meal Plan", hotel.mealPlan],
    ["Restaurants", restaurantsCount],
    ["Bars", hotel.bars],
    ["Transfer Type", hotel.transferType],
    ["Experience", hotel.experience]
  ];

  const infoSections = {
    rooms: { title: "Room Types", items: hotel.roomTypeItems || [], itemsLoaded: false },
    restaurants: { title: "Restaurants", items: hotel.restaurantItems || [], itemsLoaded: false },
    facilities: { title: "Facilities", items: hotel.facilityItems || [], itemsLoaded: false },
    wellness: { title: "Wellness", items: hotel.wellnessItems || [], itemsLoaded: false }
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
      <a href="${createWhatsAppLink(hotel.name)}" target="_blank" rel="noopener noreferrer">Inquire</a>
    </div>
  `;

  const lightboxApi = setupImageLightbox(contentEl);
  setupHotelGallery(contentEl, galleryImages, hotelName, lightboxApi, {
    initialIndex: Number(persistedState.galleryIndex || 0),
    onGalleryIndexChange: (index) => saveHotelViewState(hotel.slug, { galleryIndex: index })
  });
  setupHotelInfoTabs(contentEl, infoSections, lightboxApi, {
    initialTab: String(persistedState.activeTab || "rooms"),
    onTabChange: (tabKey) => saveHotelViewState(hotel.slug, { activeTab: tabKey })
  });
  animateNumericDetailValues(contentEl);
}

async function initHotelsRoutePage() {
  updateState("loading", "Loading hotel package...");
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = String(params.get("id") || "").trim().toLowerCase();
    if (!slug) {
      updateState("error", "Missing hotel id in URL.");
      return;
    }

    const hotel = await loadHotelBySlug(slug);
    if (!hotel) {
      updateState("empty", "Hotel package not found.");
      return;
    }

    const persistedState = loadHotelViewState(slug);
    renderHotel(hotel, persistedState);

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

    updateState("success", "");
  } catch (error) {
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
