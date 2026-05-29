/**
 * =============================================================================
 * JANA_DEV_SITE_PASSWORD_GATE
 * Temporary development PIN overlay — remove when the website goes live.
 *
 * Unlock is stored in a cookie (`jana_site_access=1`). Clearing site data /
 * cookies requires the PIN again. sessionStorage is only a same-tab mirror.
 *
 * To delete fully:
 *   1. Delete this file: js/site-access-gate.js
 *   2. In every HTML page, remove blocks between
 *      JANA_DEV_SITE_PASSWORD_GATE START / END (head script + gate script)
 *   3. Grep the repo for: JANA_DEV_SITE_PASSWORD_GATE
 * =============================================================================
 */
(function initSiteAccessGate() {
  const GATE_DISABLED = false;
  if (GATE_DISABLED) {
    document.documentElement.classList.remove("site-gate-pending");
    return;
  }

  const STORAGE_KEY = "jana:siteAccessUnlocked";
  const COOKIE_NAME = "jana_site_access";
  const COOKIE_MAX_AGE_DAYS = 365;
  const PIN_FETCH_TIMEOUT_MS = 10000;
  const DEFAULT_SHEET_URL =
    "https://opensheet.elk.sh/1v3F_YYEJl1mhoN9Hs2F6ee8SzXjsbJdGvXqczB9LKL4/Form%20Responses%201";

  function getAccessCookie() {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : "";
  }

  function setAccessCookie(value) {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    let cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    if (location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  function clearAccessCookie() {
    let cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    if (location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  function clearUnlockSession() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  /** Cookie is the source of truth for whether the site is unlocked. */
  function isSiteAccessUnlocked() {
    const cookieOk = getAccessCookie() === "1";
    if (!cookieOk) {
      clearUnlockSession();
      return false;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
      // Ignore storage failures.
    }
    return true;
  }

  function persistSiteAccessUnlock() {
    setAccessCookie("1");
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
      // Ignore storage failures.
    }
  }

  if (isSiteAccessUnlocked()) {
    document.documentElement.classList.remove("site-gate-pending");
    return;
  }

  document.documentElement.classList.add("site-gate-pending");

  function getSheetUrl() {
    return String(window.JANA_HOTELS_SHEET_URL || window.JANA_ACCESS_SHEET_URL || DEFAULT_SHEET_URL).trim();
  }

  function getPinFromRow(row) {
    if (!row || typeof row !== "object") return "";
    for (const [key, value] of Object.entries(row)) {
      if (String(key).toLowerCase().trim() === "pin") {
        return String(value ?? "").trim();
      }
    }
    return "";
  }

  async function loadAllowedPins() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PIN_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(getSheetUrl(), { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to load PIN (${response.status})`);
      const rows = await response.json();
      if (!Array.isArray(rows)) return [];
      return [...new Set(rows.map(getPinFromRow).filter(Boolean))];
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function injectStyles() {
    if (document.getElementById("jana-site-gate-styles")) return;
    const style = document.createElement("style");
    style.id = "jana-site-gate-styles";
    style.textContent = `
      #janaSiteAccessGate {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: linear-gradient(160deg, rgba(0, 139, 139, 0.97) 0%, rgba(0, 206, 209, 0.94) 45%, rgba(127, 239, 239, 0.92) 100%);
        font-family: 'Poppins', system-ui, -apple-system, sans-serif;
        color: #1a3a3a;
      }
      #janaSiteAccessGate .gate-card {
        width: min(420px, 100%);
        background: rgba(255, 255, 255, 0.96);
        border-radius: 20px;
        padding: 2rem 1.75rem 1.75rem;
        box-shadow: 0 24px 60px rgba(0, 60, 60, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.65);
        text-align: center;
        transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
      }
      #janaSiteAccessGate .gate-card.is-error {
        background: linear-gradient(165deg, #fff1f1 0%, #fecaca 48%, #fca5a5 100%);
        border: 2px solid #ef4444;
        box-shadow: 0 24px 60px rgba(185, 28, 28, 0.32);
      }
      #janaSiteAccessGate .gate-card.is-error .gate-logo {
        opacity: 0.85;
        filter: grayscale(0.15) drop-shadow(0 0 3px rgba(0, 0, 0, 0.25))
          drop-shadow(0 0 6px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 10px rgba(0, 0, 0, 0.15));
      }
      #janaSiteAccessGate .gate-card.is-error h1,
      #janaSiteAccessGate .gate-card.is-error .gate-intro {
        display: none;
      }
      #janaSiteAccessGate .gate-card.is-error label {
        color: #991b1b;
      }
      #janaSiteAccessGate .gate-card.is-error input {
        border-color: #f87171;
        background: #fff5f5;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
      }
      #janaSiteAccessGate .gate-card.is-error input:focus {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22);
      }
      #janaSiteAccessGate .gate-card.is-error button {
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        box-shadow: 0 10px 24px rgba(185, 28, 28, 0.35);
      }
      #janaSiteAccessGate .gate-error-banner {
        display: none;
        margin: 0 0 1.35rem;
        padding: 1.15rem 1rem;
        border-radius: 14px;
        background: rgba(185, 28, 28, 0.14);
        border: 1px solid rgba(220, 38, 38, 0.35);
      }
      #janaSiteAccessGate .gate-card.is-error .gate-error-banner {
        display: block;
      }
      #janaSiteAccessGate .gate-error-title {
        margin: 0 0 0.45rem;
        font-size: 1.2rem;
        font-weight: 700;
        color: #991b1b;
        line-height: 1.3;
      }
      #janaSiteAccessGate .gate-error-text {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 500;
        color: #7f1d1d;
        line-height: 1.5;
      }
      #janaSiteAccessGate .gate-logo {
        width: 56px;
        height: 56px;
        object-fit: contain;
        margin: 0 auto 0.85rem;
        display: block;
        filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.25)) drop-shadow(0 0 6px rgba(0, 0, 0, 0.2))
          drop-shadow(0 0 10px rgba(0, 0, 0, 0.15));
      }
      #janaSiteAccessGate h1 {
        font-size: 1.35rem;
        font-weight: 700;
        color: #008b8b;
        margin: 0 0 0.5rem;
        line-height: 1.3;
      }
      #janaSiteAccessGate p {
        margin: 0 0 1.25rem;
        font-size: 0.92rem;
        color: #3d5c5c;
        line-height: 1.55;
      }
      #janaSiteAccessGate label {
        display: block;
        text-align: left;
        font-size: 0.78rem;
        font-weight: 600;
        color: #186b73;
        margin-bottom: 0.35rem;
        letter-spacing: 0.02em;
      }
      #janaSiteAccessGate input {
        width: 100%;
        border: 1px solid rgba(0, 139, 139, 0.28);
        border-radius: 12px;
        padding: 0.72rem 0.9rem;
        font-size: 1rem;
        font-family: inherit;
        text-align: center;
        letter-spacing: 0.2em;
        background: #f8fefe;
        color: #1a3a3a;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      #janaSiteAccessGate input::placeholder {
        color: #7a9a9a;
        letter-spacing: 0.04em;
        font-weight: 500;
        opacity: 1;
      }
      #janaSiteAccessGate input:focus {
        border-color: #00ced1;
        box-shadow: 0 0 0 3px rgba(0, 206, 209, 0.22);
      }
      #janaSiteAccessGate button {
        margin-top: 1rem;
        width: 100%;
        border: none;
        border-radius: 999px;
        padding: 0.78rem 1rem;
        font-size: 0.95rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        background: linear-gradient(135deg, #00ced1, #008b8b);
        color: #fff;
        box-shadow: 0 10px 24px rgba(0, 139, 139, 0.28);
        transition: transform 0.15s, opacity 0.15s;
      }
      #janaSiteAccessGate button:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      #janaSiteAccessGate button:disabled {
        opacity: 0.65;
        cursor: wait;
      }
      html.site-gate-pending { overflow: hidden; }
      html.site-gate-pending body { overflow: hidden; }
    `;
    document.head.appendChild(style);
  }

  function showCardError(card, title, message) {
    if (!card) return;
    const titleEl = card.querySelector(".gate-error-title");
    const textEl = card.querySelector(".gate-error-text");
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = message;
    card.classList.add("is-error");
  }

  function clearCardError(card) {
    if (!card) return;
    card.classList.remove("is-error");
  }

  function unlockSite() {
    persistSiteAccessUnlock();
    document.documentElement.classList.remove("site-gate-pending");
    const gate = document.getElementById("janaSiteAccessGate");
    if (gate) gate.remove();
  }

  function buildGate(pinState) {
    injectStyles();

    const logoPath =
      window.JANA_SITE_GATE_LOGO ||
      (document.querySelector('link[rel="icon"]')?.getAttribute("href") || "public/JanaTravelLogo.webp");

    const gate = document.createElement("div");
    gate.id = "janaSiteAccessGate";
    gate.setAttribute("data-dev-gate", "JANA_DEV_SITE_PASSWORD_GATE");
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "janaSiteAccessGateTitle");

    const card = document.createElement("div");
    card.className = "gate-card";

    card.innerHTML = `
      <img class="gate-logo" src="${logoPath}" alt="JANA Travel">
      <div class="gate-error-banner" role="alert" aria-live="assertive">
        <p class="gate-error-title"></p>
        <p class="gate-error-text"></p>
      </div>
      <h1 id="janaSiteAccessGateTitle">Website under development</h1>
      <p class="gate-intro">This site is not public yet. If you are an admin, enter your PIN to continue.</p>
      <form id="janaSiteAccessForm" autocomplete="off">
        <label for="janaSiteAccessPin">Admin PIN</label>
        <input id="janaSiteAccessPin" name="pin" type="password" autocomplete="off" placeholder="PIN" required>
        <button type="submit" disabled>Enter site</button>
      </form>
    `;

    gate.appendChild(card);

    const mountTarget = document.body || document.documentElement;
    mountTarget.appendChild(gate);

    const form = card.querySelector("#janaSiteAccessForm");
    const input = card.querySelector("#janaSiteAccessPin");
    const submitBtn = card.querySelector("button[type='submit']");

    const tryUnlockWithEnteredPin = (options = {}) => {
      const showErrors = options.showErrors !== false;
      const entered = String(input.value || "").trim();
      if (!entered) {
        if (showErrors) {
          showCardError(card, "PIN required", "Please enter your admin PIN to continue.");
          input.focus();
        }
        return false;
      }
      if (!pinState.ready) {
        if (showErrors) {
          showCardError(card, "Please wait", "Still loading PIN verification. Try again in a moment.");
        }
        return false;
      }
      if (!pinState.pins.length) {
        if (showErrors) {
          showCardError(
            card,
            "PIN unavailable",
            "No admin PIN was found. Check the spreadsheet Pin column and try again."
          );
        }
        return false;
      }
      if (pinState.pins.includes(entered)) {
        unlockSite();
        return true;
      }
      if (showErrors) {
        showCardError(
          card,
          "Incorrect PIN",
          "The PIN you entered is not valid. Please try again."
        );
        input.select();
      }
      return false;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      tryUnlockWithEnteredPin({ showErrors: true });
    });

    input.addEventListener("input", () => {
      clearCardError(card);
      tryUnlockWithEnteredPin({ showErrors: false });
    });

    window.setTimeout(() => input.focus(), 80);

    return { card, submitBtn };
  }

  async function run() {
    if (document.getElementById("janaSiteAccessGate")) return;

    const pinState = { pins: [], ready: false };
    const gateControls = buildGate(pinState);

    try {
      pinState.pins = await loadAllowedPins();
      pinState.ready = true;
      if (!pinState.pins.length) {
        showCardError(
          gateControls.card,
          "PIN not configured",
          "No admin PIN found. Add a value in the Pin column on your hotel sheet."
        );
      } else {
        gateControls.submitBtn.disabled = false;
      }
    } catch (error) {
      pinState.ready = true;
      console.error("Site access gate:", error);
      showCardError(
        gateControls.card,
        "Connection error",
        "Unable to load PIN from the spreadsheet. Check your connection and sheet sharing."
      );
    }
  }

  function start() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", start, { once: true });
      return;
    }
    run();
  }

  start();
})();
