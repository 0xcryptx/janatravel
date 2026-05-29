const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));

if (typeof window !== "undefined") {
  window.janaFadeObserver = fadeObserver;
}

(function initMultiPageNav() {
  const raw = window.location.pathname.replace(/\/index\.html$/, "");
  const path = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  let page = "";
  if (path === "" || path === "/") page = "home";
  else if (path.startsWith("/about")) page = "about";
  else if (path.startsWith("/destinations")) page = "destinations";
  else if (path.startsWith("/hotels")) page = "hotels";
  else if (path.startsWith("/services")) page = "services";
  else if (path.startsWith("/contact")) page = "contact";
  if (!page) return;

  document.querySelectorAll(".nav-links.desktop-nav a[href]").forEach((anchor) => {
    if (!anchor.dataset.navPage) {
      const href = anchor.getAttribute("href") || "";
      if (href === "/" || href === "/index.html") anchor.dataset.navPage = "home";
      else if (href.startsWith("/about")) anchor.dataset.navPage = "about";
      else if (href.startsWith("/destinations")) anchor.dataset.navPage = "destinations";
      else if (href.startsWith("/hotels")) anchor.dataset.navPage = "hotels";
      else if (href.startsWith("/services")) anchor.dataset.navPage = "services";
      else if (href.startsWith("/contact")) anchor.dataset.navPage = "contact";
    }
  });

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.navPage === page);
  });
})();

