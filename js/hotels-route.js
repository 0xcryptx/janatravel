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

function createWhatsAppLink(message) {
  const text = message || "Hello, I'm interested in this hotel package.";
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
  return {
    slug: getCaseInsensitiveField(row, ["slug", "Slug"]),
    name: getCaseInsensitiveField(row, ["name", "Name"]),
    destination: getCaseInsensitiveField(row, ["destination", "Destination"]),
    location: getCaseInsensitiveField(row, ["location", "Location"]),
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
  const details = [
    ["Destination", hotel.destination],
    ["Location", hotel.location],
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
    <p class="lead">${escapeHtml(hotel.description || "Discover this curated stay with JANA Travel.")}</p>
    <div class="meta">
      ${hotel.destination ? `<span class="pill">${escapeHtml(hotel.destination)}</span>` : ""}
      ${hotel.location ? `<span class="pill">${escapeHtml(hotel.location)}</span>` : ""}
      ${ratingLabel ? `<span class="pill">Rating: ${escapeHtml(ratingLabel)}</span>` : ""}
      ${hotel.transferType ? `<span class="pill">${escapeHtml(hotel.transferType)}</span>` : ""}
      ${hotel.mealPlan ? `<span class="pill">${escapeHtml(hotel.mealPlan)}</span>` : ""}
    </div>
    <div class="hero">
      <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(hotelName)} main view">
    </div>
    <div class="grid">
      ${galleryImages
        .map(
          (img, index) =>
            `<img src="${escapeHtml(resolveImagePath(img))}" alt="${escapeHtml(hotelName)} view ${index + 1}">`
        )
        .join("")}
    </div>
    <h2>Hotel Details</h2>
    <div class="details-grid">
      ${details
        .map(
          ([label, value]) => `
            <div class="detail-card">
              <span class="label">${escapeHtml(label)}</span>
              <span class="value">${escapeHtml(value || "Not specified yet")}</span>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="cta">
      <a href="${createWhatsAppLink(hotel.whatsappMessage)}" target="_blank" rel="noopener noreferrer">Book via WhatsApp</a>
    </div>
  `;
}

async function initHotelsRoutePage() {
  updateState("loading", "Loading hotel package...");
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("id");
    if (!slug) {
      updateState("error", "Missing hotel id in URL.");
      return;
    }

    const hotels = await loadHotelsData();
    const hotel = hotels.find((item) => item.slug === slug);
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
