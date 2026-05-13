const LOCAL_JSON_URL = "../data/hotels.json";
const WHATSAPP_NUMBER = "9607409199";
const HOTEL_PLACEHOLDER_IMAGE = "../assets/images/add_image.webp";
const GOOGLE_SHEETS_HOTELS_URL = "";
const HOTEL_IMAGE_BASE_PATHS = ["../hotel_images", "../assets/hotel_images"];
const IMAGE_INDEXES = [1, 2, 3, 4];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

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

async function doesImageExist(url) {
  try {
    const headResponse = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (headResponse.ok) return true;
    if (headResponse.status !== 405) return false;
  } catch (error) {
    // Ignore and attempt GET fallback.
  }
  try {
    const getResponse = await fetch(url, { cache: "no-store" });
    return getResponse.ok;
  } catch (error) {
    return false;
  }
}

async function resolveHotelImageBasePath(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return "";
  for (const basePath of HOTEL_IMAGE_BASE_PATHS) {
    const folderPath = `${basePath}/${normalizedSlug}`;
    const folderImages = await collectNumberedImages(folderPath);
    if (folderImages.length) {
      return basePath;
    }
  }
  return "";
}

async function findFirstExistingImage(folderPath, baseName) {
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = `${folderPath}/${baseName}.${ext}`;
    if (await doesImageExist(candidate)) return candidate;
  }
  return "";
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

async function buildIndexedSectionItems(basePath, slug, sectionFolder, itemPrefix, labels) {
  const results = await Promise.all(labels.map(async (label, index) => {
    const folderPath = `${basePath}/${slug}/${sectionFolder}/${itemPrefix}${index + 1}`;
    const images = await collectNumberedImages(folderPath);
    return { label, images };
  }));
  return results;
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

  const imageBasePath = await resolveHotelImageBasePath(slug);
  if (!imageBasePath) return null;

  const mainImages = await collectNumberedImages(`${imageBasePath}/${slug}`);
  if (!mainImages.length) return null;

  const roomTypeItemsText = parseDashSeparatedItems(hotel.roomTypes);
  const facilityItemsText = parseDashSeparatedItems(hotel.facilities);
  const wellnessItemsText = parseDashSeparatedItems(hotel.wellness);
  const restaurantItemsText = parseDashSeparatedItems(hotel.restaurantNames);

  const roomTypeItems = await buildIndexedSectionItems(imageBasePath, slug, "rooms", "room", roomTypeItemsText);
  const facilityItems = await buildIndexedSectionItems(imageBasePath, slug, "facilities", "fac", facilityItemsText);
  const wellnessItems = await buildIndexedSectionItems(imageBasePath, slug, "wellness", "well", wellnessItemsText);
  const restaurantItems = await buildIndexedSectionItems(imageBasePath, slug, "restaurants", "res", restaurantItemsText);

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

  return { open: openLightbox };
}

function setupHotelGallery(contentEl, images, hotelName, lightboxApi) {
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
  };

  thumbButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index || 0);
      setActiveImage(Number.isFinite(idx) ? idx : 0);
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

  setActiveImage(0);
}

function renderSectionItemsHtml(items, sectionKey) {
  if (!items.length) {
    return `<p class="info-empty">Not specified yet.</p>`;
  }
  return items
    .map((item, itemIndex) => `
      <article class="section-item">
        <h4 class="section-item__title">${itemIndex + 1}. ${escapeHtml(item.label)}</h4>
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

function setupHotelInfoTabs(contentEl, sectionData, lightboxApi) {
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
      });
    });
  };

  const setActiveTab = (key) => {
    const section = sectionData[key];
    if (!section) return;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.infoSection === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    panelTitle.textContent = section.title;
    panelBody.innerHTML = renderSectionItemsHtml(section.items, key);
    bindSectionThumbs();
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.infoSection || "rooms");
    });
  });

  setActiveTab("rooms");
}

function renderHotel(hotel) {
  const titleEl = document.getElementById("hotelTitle");
  const contentEl = document.getElementById("hotelContent");
  if (!contentEl) return;

  const hotelName = hotel.name || "Hotel Package";
  if (titleEl) titleEl.textContent = hotelName;
  document.title = `${hotelName} | JANA Travel`;

  const galleryImages = Array.isArray(hotel.mainImages) && hotel.mainImages.length ? hotel.mainImages : [HOTEL_PLACEHOLDER_IMAGE];
  const mainImage = galleryImages[0] || HOTEL_PLACEHOLDER_IMAGE;
  const ratingLabel = formatRating(hotel.rating);
  const destinationValue = String(hotel.destination || "").trim();
  const destinationPageUrl = getDestinationPageUrl(destinationValue);
  const mapUrl = String(hotel.googleMapsLink || "").trim();
  const hasMapUrl = /^https?:\/\//i.test(mapUrl);
  const locationValue = String(hotel.location || "").trim() || "Not specified yet";
  const restaurantsCount = String(hotel.restaurants || "").trim() || "Not specified yet";

  const details = [
    ["Destination", destinationValue],
    ["Location", locationValue],
    ["Rating", ratingLabel],
    ["Island Size", hotel.islandSize],
    ["Reef Type", hotel.reefType],
    ["Experience", hotel.experience],
    ["Meal Plan", hotel.mealPlan],
    ["Rooms", hotel.rooms],
    ["Restaurants", restaurantsCount],
    ["Bars", hotel.bars],
    ["Transfer Type", hotel.transferType]
  ];

  const infoSections = {
    rooms: { title: "Room Types", items: hotel.roomTypeItems || [] },
    restaurants: { title: "Restaurants", items: hotel.restaurantItems || [] },
    facilities: { title: "Facilities", items: hotel.facilityItems || [] },
    wellness: { title: "Wellness", items: hotel.wellnessItems || [] }
  };

  contentEl.innerHTML = `
    <div class="meta">
      ${
        destinationValue && destinationPageUrl
          ? `<a class="pill pill-link" href="${destinationPageUrl}">${escapeHtml(destinationValue)}</a>`
          : destinationValue
            ? `<span class="pill">${escapeHtml(destinationValue)}</span>`
            : ""
      }
      ${ratingLabel ? `<span class="pill">${escapeHtml(ratingLabel)}</span>` : ""}
    </div>
    <div class="media-gallery">
      <div class="hero hero--interactive">
        <button type="button" class="hero-nav hero-nav--prev" id="hotelGalleryPrev" aria-label="Previous image">&#10094;</button>
        <img id="hotelMainImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} view 1">
        <button type="button" class="hero-nav hero-nav--next" id="hotelGalleryNext" aria-label="Next image">&#10095;</button>
        <span class="hero-counter" id="hotelGalleryCounter">1 / ${galleryImages.length}</span>
        <button type="button" class="maximize-btn" id="hotelMaximizeBtn">Maximize</button>
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
    <p class="lead">${escapeHtml(hotel.description || "Discover this curated stay with JANA Travel.")}</p>
    <h2>Hotel Details</h2>
    <div class="details-grid">
      ${details
        .map(([label, value]) => `
          <div class="detail-card">
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
  setupHotelGallery(contentEl, galleryImages, hotelName, lightboxApi);
  setupHotelInfoTabs(contentEl, infoSections, lightboxApi);
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

    const hotels = await loadHotelsData();
    const hotel = hotels.find((item) => String(item.slug || "").trim().toLowerCase() === slug);
    if (!hotel) {
      updateState("empty", "Hotel package not found.");
      return;
    }

    renderHotel(hotel);
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
