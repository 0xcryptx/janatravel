const DATA_URL = "../data/hotels.json";
const WHATSAPP_NUMBER = "971501771927";

function loadJsonData(url) {
  return fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  });
}

function resolveImagePath(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path)) return path;
  return path;
}

/** Must match DESTINATION_LAND_AREA_SQ_KM_DISPLAY in js/hotels-route.js — not sourced from sheets/forms. */
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createWhatsAppLink(message) {
  const text = message || "Hello, I'm interested in this hotel package.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function getSlugFromCurrentPath() {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "";
  const last = segments[segments.length - 1];
  if (last.toLowerCase() === "index.html" && segments.length > 1) {
    return segments[segments.length - 2];
  }
  return last;
}

function updateState(type, text) {
  const stateEl = document.getElementById("hotelPageState");
  if (!stateEl) return;
  stateEl.className = `page-state ${type}`;
  stateEl.textContent = text;
}

function renderHotelPage(hotel) {
  const titleEl = document.getElementById("hotelTitle");
  const contentEl = document.getElementById("hotelContent");
  if (!contentEl) return;

  const hotelName = hotel.name || "Hotel Package";
  if (titleEl) titleEl.textContent = hotelName;
  document.title = `${hotelName} | JANA Travel`;

  const mainImage = resolveImagePath(hotel.imageUrl) || "../assets/images/maldives_1.jpg";
  const galleryImages = Array.isArray(hotel.galleryImages) ? hotel.galleryImages : [];
  const details = [
    ["Destination", hotel.destination],
    ["Location", hotel.location],
    ["Rating", hotel.rating],
    ["Island Size", getDestinationIslandAreaDisplay(hotel.destination) || "Not specified yet"],
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
      ${hotel.rating ? `<span class="pill">Rating: ${escapeHtml(hotel.rating)}</span>` : ""}
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

async function initHotelPackagePage() {
  updateState("loading", "Loading hotel package...");
  try {
    const slug = getSlugFromCurrentPath();
    if (!slug) {
      updateState("error", "Unable to detect hotel slug from URL.");
      return;
    }

    const hotels = await loadJsonData(DATA_URL);
    const normalizedHotels = Array.isArray(hotels) ? hotels : [];
    const hotel = normalizedHotels.find(
      (item) => String(item?.slug || "").trim().toLowerCase() === String(slug || "").trim().toLowerCase()
    );

    if (!hotel) {
      updateState("empty", "Hotel package not found in data file.");
      return;
    }

    renderHotelPage(hotel);
    updateState("success", "");
  } catch (error) {
    console.error(error);
    updateState("error", "Failed to load hotel package data.");
  }
}

window.JanaHotelPackage = {
  loadJsonData,
  resolveImagePath,
  createWhatsAppLink,
  renderHotelPage
};

initHotelPackagePage();
