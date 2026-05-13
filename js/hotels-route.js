const LOCAL_JSON_URL = "../data/hotels.json";
const WHATSAPP_NUMBER = "9607409199";
const HOTEL_PLACEHOLDER_IMAGE = "../assets/images/add_image.webp";

// Optional: set this to your published Google Sheets JSON endpoint.
// Example OpenSheet format:
// https://opensheet.elk.sh/<sheet-id>/<sheet-name>
const GOOGLE_SHEETS_HOTELS_URL = "";

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
  if (/^(https?:)?\/\//i.test(path)) return path;
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

function getCaseInsensitiveField(row, keys) {
  const keyMap = Object.keys(row || {}).reduce((acc, key) => {
    acc[key.toLowerCase().trim()] = key;
    return acc;
  }, {});

  for (const k of keys) {
    const normalized = k.toLowerCase().trim();
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

function normalizeSheetHotel(row) {
  const slug = String(getCaseInsensitiveField(row, ["slug", "Slug"]) || "").trim();
  const name = String(getCaseInsensitiveField(row, ["name", "Name"]) || "").trim();
  return {
    slug,
    name,
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
    restaurants: getCaseInsensitiveField(row, ["restaurants", "Restaurants"]),
    bars: getCaseInsensitiveField(row, ["bars", "Bars"]),
    transferType: getCaseInsensitiveField(row, ["transferType", "Transfer Type"]),
    description: getCaseInsensitiveField(row, ["description", "Description"]),
    imageUrl: getCaseInsensitiveField(row, ["imageUrl", "Image URL"]),
    galleryImages: normalizeGalleryImages(getCaseInsensitiveField(row, ["galleryImages", "Gallery Images"])),
    whatsappMessage: getCaseInsensitiveField(row, ["whatsappMessage", "WhatsApp Message"]),
    featured: parseFeaturedValue(getCaseInsensitiveField(row, ["featured", "Featured"]))
  };
}

async function loadHotelsData() {
  const runtimeUrl = (window.JANA_HOTELS_SHEET_URL || "").trim();
  const sourceUrl = runtimeUrl || GOOGLE_SHEETS_HOTELS_URL;

  if (sourceUrl) {
    const raw = await loadJsonData(sourceUrl);
    if (Array.isArray(raw)) {
      return raw.map(normalizeSheetHotel).filter((hotel) => hotel.slug);
    }
  }

  const local = await loadJsonData(LOCAL_JSON_URL);
  return Array.isArray(local) ? local : [];
}

function updateState(type, message) {
  const stateEl = document.getElementById("hotelPageState");
  if (!stateEl) return;
  stateEl.className = `page-state ${type}`;
  stateEl.textContent = message;
}

function setupHotelGallery(contentEl, images, hotelName) {
  const mainImageEl = contentEl.querySelector("#hotelMainImage");
  const thumbButtons = Array.from(contentEl.querySelectorAll(".thumb-btn"));
  const maximizeBtn = contentEl.querySelector("#hotelMaximizeBtn");
  const lightbox = contentEl.querySelector("#hotelImageLightbox");
  const lightboxImage = contentEl.querySelector("#hotelLightboxImage");
  const closeBtn = contentEl.querySelector("#hotelLightboxClose");
  const prevBtn = contentEl.querySelector("#hotelLightboxPrev");
  const nextBtn = contentEl.querySelector("#hotelLightboxNext");

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

    thumbButtons.forEach((btn, index) => {
      btn.classList.toggle("is-active", index === currentIndex);
    });

    if (lightboxImage && !lightbox.hasAttribute("hidden")) {
      lightboxImage.src = nextSrc;
      lightboxImage.alt = `${hotelName} preview ${currentIndex + 1}`;
    }
  };

  thumbButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index || 0);
      setActiveImage(Number.isFinite(idx) ? idx : 0);
    });
  });

  const openLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.removeAttribute("hidden");
    lightboxImage.src = resolveImagePath(galleryImages[currentIndex]) || HOTEL_PLACEHOLDER_IMAGE;
    lightboxImage.alt = `${hotelName} preview ${currentIndex + 1}`;
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("lightbox-open");
  };

  if (maximizeBtn) maximizeBtn.addEventListener("click", openLightbox);
  mainImageEl.addEventListener("click", openLightbox);
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", () => setActiveImage(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setActiveImage(currentIndex + 1));

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.hasAttribute("hidden")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") setActiveImage(currentIndex - 1);
    if (event.key === "ArrowRight") setActiveImage(currentIndex + 1);
  });

  setActiveImage(0);
}

function renderHotel(hotel) {
  const titleEl = document.getElementById("hotelTitle");
  const contentEl = document.getElementById("hotelContent");
  if (!contentEl) return;

  const hotelName = hotel.name || "Hotel Package";
  if (titleEl) titleEl.textContent = hotelName;
  document.title = `${hotelName} | JANA Travel`;

  const mainImage = resolveImagePath(hotel.imageUrl) || HOTEL_PLACEHOLDER_IMAGE;
  const rawGalleryImages = Array.isArray(hotel.galleryImages) ? hotel.galleryImages : [];
  const galleryImages = rawGalleryImages.length ? rawGalleryImages : [mainImage];
  const ratingLabel = formatRating(hotel.rating);
  const mapUrl = String(hotel.googleMapsLink || "").trim();
  const hasMapUrl = /^https?:\/\//i.test(mapUrl);
  const locationValue = String(hotel.location || "").trim() || "Not specified yet";
  const details = [
    ["Destination", hotel.destination],
    ["Location", locationValue],
    ["Rating", ratingLabel],
    ["Island Size", hotel.islandSize],
    ["Reef Type", hotel.reefType],
    ["Experience", hotel.experience],
    ["Meal Plan", hotel.mealPlan],
    ["Rooms", hotel.rooms],
    ["Restaurants", hotel.restaurants],
    ["Bars", hotel.bars],
    ["Transfer Type", hotel.transferType]
  ];

  contentEl.innerHTML = `
    <div class="meta">
      ${hotel.destination ? `<span class="pill">${escapeHtml(hotel.destination)}</span>` : ""}
      ${ratingLabel ? `<span class="pill">${escapeHtml(ratingLabel)}</span>` : ""}
    </div>
    <div class="media-gallery">
      <div class="hero hero--interactive">
        <img id="hotelMainImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} view 1">
        <button type="button" class="maximize-btn" id="hotelMaximizeBtn">Maximize</button>
      </div>
      <div class="thumb-strip" id="hotelThumbStrip" role="list" aria-label="Hotel image previews">
      ${galleryImages
        .map(
          (img, index) =>
            `
            <button type="button" class="thumb-btn${index === 0 ? " is-active" : ""}" data-index="${index}" role="listitem" aria-label="Show image ${index + 1}">
              <img src="${escapeHtml(resolveImagePath(img))}" alt="${escapeHtml(hotelName)} thumbnail ${index + 1}">
            </button>
            `
        )
        .join("")}
      </div>
    </div>
    <div class="image-lightbox" id="hotelImageLightbox" hidden>
      <button type="button" class="lightbox-close" id="hotelLightboxClose" aria-label="Close image viewer">&times;</button>
      <button type="button" class="lightbox-nav lightbox-nav--prev" id="hotelLightboxPrev" aria-label="Previous image">&#10094;</button>
      <img id="hotelLightboxImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} preview">
      <button type="button" class="lightbox-nav lightbox-nav--next" id="hotelLightboxNext" aria-label="Next image">&#10095;</button>
    </div>
    <p class="lead">${escapeHtml(hotel.description || "Discover this curated stay with JANA Travel.")}</p>
    <h2>Hotel Details</h2>
    <div class="details-grid">
      ${details
        .map(
          ([label, value]) => `
            <div class="detail-card">
              <span class="label">${escapeHtml(label)}</span>
              ${
                label === "Location" && hasMapUrl
                  ? `<a class="value value-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value || "Not specified yet")}</a>`
                  : `<span class="value">${escapeHtml(value || "Not specified yet")}</span>`
              }
            </div>
          `
        )
        .join("")}
    </div>
    <div class="cta">
      <a href="${createWhatsAppLink(hotel.name)}" target="_blank" rel="noopener noreferrer">Inquire</a>
    </div>
  `;

  setupHotelGallery(contentEl, galleryImages, hotelName);
}

async function initHotelsRoutePage() {
  updateState("loading", "Loading hotel package...");
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = String(params.get("id") || "").trim();
    if (!slug) {
      updateState("error", "Missing hotel id in URL.");
      return;
    }

    const hotels = await loadHotelsData();
    const normalizedSlug = slug.toLowerCase();
    const hotel = hotels.find((item) => String(item.slug || "").trim().toLowerCase() === normalizedSlug);
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
