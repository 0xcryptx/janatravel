function toggleMenu() {
  document.querySelector(".nav-links")?.classList.toggle("active");
}

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

(function initMultiPageNav() {
  const raw = window.location.pathname.replace(/\/index\.html$/, "");
  const path = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  const rules = [
    { test: (p) => p === "" || p === "/", sel: 'a[href="/"]' },
    { test: (p) => p.startsWith("/about"), sel: 'a[href="/about/"]' },
    { test: (p) => p.startsWith("/destinations"), sel: 'a[href="/destinations/"]' },
    { test: (p) => p.startsWith("/hotels"), sel: 'a[href="/hotels/"]' },
    { test: (p) => p.startsWith("/services"), sel: 'a[href="/services/"]' },
    { test: (p) => p.startsWith("/contact"), sel: 'a[href="/contact/"]' }
  ];
  const match = rules.find((r) => r.test(path));
  if (!match) return;
  document.querySelectorAll(".nav-links " + match.sel).forEach((a) => a.classList.add("active"));
})();

