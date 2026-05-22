/**
 * Mobile (≤980px): fixed glass header, menu toggle on the left, dropdown below bar,
 * scroll progress attached under the nav.
 */
(function initSiteMobileNav() {
  const MOBILE_MQ = window.matchMedia("(max-width: 980px)");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const getNavPageKey = () => {
    const raw = window.location.pathname.replace(/\/index\.html$/, "");
    const path = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    if (path === "" || path === "/") return "home";
    if (path.startsWith("/about")) return "about";
    if (path.startsWith("/destinations")) return "destinations";
    if (path.startsWith("/hotels")) return "hotels";
    if (path.startsWith("/services")) return "services";
    if (path.startsWith("/contact")) return "contact";
    return "";
  };

  const highlightActiveNavLinks = () => {
    const page = getNavPageKey();
    document.querySelectorAll("[data-nav-page]").forEach((link) => {
      link.classList.toggle("active", link.dataset.navPage === page);
    });
  };

  const navWrapper = document.querySelector(".nav-wrapper");
  const navEl = document.querySelector(".nav-wrapper nav");
  const navList = document.querySelector(".nav-links.desktop-nav");
  if (!navWrapper || !navEl || !navList) return;

  navList.querySelectorAll("a[href]").forEach((anchor) => {
    if (anchor.dataset.navPage) return;
    const href = anchor.getAttribute("href") || "";
    if (href === "/" || href === "/index.html") anchor.dataset.navPage = "home";
    else if (href.startsWith("/about")) anchor.dataset.navPage = "about";
    else if (href.startsWith("/destinations")) anchor.dataset.navPage = "destinations";
    else if (href.startsWith("/hotels")) anchor.dataset.navPage = "hotels";
    else if (href.startsWith("/services")) anchor.dataset.navPage = "services";
    else if (href.startsWith("/contact")) anchor.dataset.navPage = "contact";
  });

  let menuToggle = navEl.querySelector(".mobile-nav-toggle");
  if (!menuToggle) {
    menuToggle = document.createElement("button");
    menuToggle.type = "button";
    menuToggle.className = "mobile-nav-toggle";
    menuToggle.setAttribute("aria-controls", "jana-mobile-site-nav");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    navEl.appendChild(menuToggle);
  } else if (menuToggle !== navEl.lastElementChild) {
    navEl.appendChild(menuToggle);
  }

  let menuBars = menuToggle.querySelector(".mobile-nav-toggle-bars");
  if (!menuBars) {
    menuBars = document.createElement("span");
    menuBars.className = "mobile-nav-toggle-bars";
    menuBars.setAttribute("aria-hidden", "true");
    menuBars.innerHTML = "<span></span><span></span><span></span>";
    menuToggle.append(menuBars);
  }

  menuToggle.querySelector(".mobile-nav-toggle-close")?.remove();

  menuToggle.textContent = "";
  menuToggle.append(menuBars);

  navWrapper.querySelector(".mobile-nav-backdrop")?.remove();

  let menuDropdown = navWrapper.querySelector(".mobile-nav-dropdown");
  if (!menuDropdown) {
    menuDropdown = document.createElement("div");
    menuDropdown.className = "mobile-nav-dropdown";
    menuDropdown.id = "jana-mobile-site-nav";

    const mobileList = document.createElement("ul");
    mobileList.className = "mobile-nav-list";

    const navItems = Array.from(navList.querySelectorAll("a[href]")).map((anchor) => ({
      href: anchor.getAttribute("href") || "#",
      navPage: anchor.dataset.navPage || "",
      text: (anchor.textContent || "").trim()
    }));

    mobileList.innerHTML = navItems
      .map(
        (item) =>
          `<li><a href="${escapeHtml(item.href)}" data-nav-page="${escapeHtml(item.navPage)}">${escapeHtml(item.text)}</a></li>`
      )
      .join("");

    menuDropdown.appendChild(mobileList);
    navWrapper.appendChild(menuDropdown);
  } else if (menuDropdown.parentElement !== navWrapper) {
    navWrapper.appendChild(menuDropdown);
  }

  let progressBar = navWrapper.querySelector(".scroll-progress");
  if (!progressBar) {
    progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    progressBar.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    fill.className = "scroll-progress-fill";
    progressBar.append(fill);
    navWrapper.appendChild(progressBar);
  } else if (!progressBar.querySelector(".scroll-progress-fill")) {
    const fill = document.createElement("span");
    fill.className = "scroll-progress-fill";
    progressBar.append(fill);
  }

  /* nav → scroll progress → dropdown (dropdown floats below header) */
  if (navEl.nextElementSibling !== progressBar) {
    navWrapper.insertBefore(progressBar, navEl.nextElementSibling);
  }
  if (progressBar.nextElementSibling !== menuDropdown) {
    navWrapper.insertBefore(menuDropdown, progressBar.nextElementSibling);
  }

  const syncMenuToggle = (open) => {
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  const syncHeaderLayout = () => {
    if (!MOBILE_MQ.matches) {
      document.documentElement.style.removeProperty("--jana-site-header-height");
      document.documentElement.style.removeProperty("--jana-nav-row-height");
      document.documentElement.style.removeProperty("--jana-menu-right-offset");
      return;
    }
    document.documentElement.style.setProperty(
      "--jana-site-header-height",
      `${navWrapper.offsetHeight}px`
    );
    document.documentElement.style.setProperty(
      "--jana-nav-row-height",
      `${navEl.offsetHeight}px`
    );
    const toggleRect = menuToggle.getBoundingClientRect();
    const wrapperRect = navWrapper.getBoundingClientRect();
    document.documentElement.style.setProperty(
      "--jana-menu-right-offset",
      `${Math.max(0, wrapperRect.right - toggleRect.right)}px`
    );
  };

  const closeMobileNav = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuDropdown.classList.remove("open");
    syncMenuToggle(false);
    syncHeaderLayout();
  };

  const openMobileNav = () => {
    menuToggle.setAttribute("aria-expanded", "true");
    menuDropdown.classList.add("open");
    syncMenuToggle(true);
    syncHeaderLayout();
    const list = menuDropdown.querySelector(".mobile-nav-list");
    if (list) list.scrollTop = 0;
  };

  const updateScrollProgress = () => {
    if (!MOBILE_MQ.matches) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    progressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
  };

  menuToggle.addEventListener("click", () => {
    if (!MOBILE_MQ.matches) return;
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMobileNav();
    else openMobileNav();
  });

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.addEventListener("click", () => {
      if (MOBILE_MQ.matches) closeMobileNav();
    });
  });

  const onViewportChange = () => {
    if (!MOBILE_MQ.matches) {
      closeMobileNav();
      progressBar.style.removeProperty("--scroll-progress");
    }
    syncHeaderLayout();
    updateScrollProgress();
  };

  highlightActiveNavLinks();
  closeMobileNav();
  syncHeaderLayout();
  updateScrollProgress();

  window.addEventListener(
    "scroll",
    () => {
      updateScrollProgress();
    },
    { passive: true }
  );

  window.addEventListener("resize", onViewportChange);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncHeaderLayout);
  }

  MOBILE_MQ.addEventListener("change", onViewportChange);

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => syncHeaderLayout());
    ro.observe(navWrapper);
  }
})();
