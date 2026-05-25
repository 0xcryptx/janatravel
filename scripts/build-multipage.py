#!/usr/bin/env python3
"""Split monolithic index.html into multi-page site structure."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "index.html").read_text(encoding="utf-8")


def between(start_marker: str, end_marker: str) -> str:
    s = text.find(start_marker)
    if s < 0:
        raise ValueError(f"Missing: {start_marker}")
    s += len(start_marker)
    e = text.find(end_marker, s)
    if e < 0:
        raise ValueError(f"Missing end: {end_marker}")
    return text[s:e].strip()


def extract_script_inner() -> str:
    start = text.find("<script>\n        window.JANA_HOTELS_SHEET_URL")
    start = text.find("\n", start) + 1
    end = text.rfind("    </script>\n</body>")
    inner = text[start:end]
    lines = [line[8:] if line.startswith("        ") else line for line in inner.splitlines()]
    return "\n".join(lines)


def script_slice(start_sub: str, end_sub: Optional[str] = None) -> str:
    script_all = extract_script_inner()
    s = script_all.find(start_sub)
    if s < 0:
        raise ValueError(f"Script marker not found: {start_sub}")
    if end_sub:
        e = script_all.find(end_sub, s)
        if e < 0:
            raise ValueError(f"Script end not found: {end_sub}")
        return script_all[s:e].strip()
    return script_all[s:].strip()


SITE_DEVELOPER_CREDIT = "<!-- Website designed and developed by Build Your Web https://buildyourweb.ae -->"

GATE_HEAD = """    <!-- JANA_DEV_SITE_PASSWORD_GATE START — delete this block + /js/site-access-gate.js when live -->
    <script>
        (function () {
            if (/(?:^|;\\s*)jana_site_access=1(?:;|$)/.test(document.cookie)) return;
            try { if (sessionStorage.getItem('jana:siteAccessUnlocked') === '1') return; } catch (e) {}
            document.documentElement.classList.add('site-gate-pending');
        })();
    </script>
    <!-- JANA_DEV_SITE_PASSWORD_GATE END (head) -->"""

NAV = """    <header class="nav-wrapper">
        <nav>
            <a href="/" class="logo">
                <img src="/public/JanaTravelLogo.webp" alt="JANA Travel Logo">
                <span class="logo-text">JANA <span>Travel</span></span>
            </a>
            <ul class="nav-links desktop-nav">
                <li><a href="/">Home</a></li>
                <li><a href="/destinations/">Destinations</a></li>
                <li><a href="/hotels/">Hotels</a></li>
                <li><a href="/offers/">Offers</a></li>
                <li><a href="/services/">Services</a></li>
                <li><a href="/about/">About</a></li>
                <li><a href="/contact/">Contact</a></li>
            </ul>
        </nav>
    </header>"""

FOOTER = between("<!-- Footer -->", "    <script>\n        window.JANA_HOTELS_SHEET_URL")


def abs_paths(html: str) -> str:
    return (
        html.replace('src="assets/', 'src="/assets/')
        .replace('src="public/', 'src="/public/')
        .replace('href="assets/', 'href="/assets/')
        .replace("window.location.href='hotels/?id=", "window.location.href='/hotels/package/?id=")
        .replace('href="#home"', 'href="/"')
        .replace('href="#about"', 'href="/about/"')
        .replace('href="#hotels"', 'href="/hotels/"')
        .replace('href="#services"', 'href="/services/"')
        .replace('href="#contact"', 'href="/contact/"')
    )


def page_shell(title: str, description: str, body: str, extra_head: str = "", scripts: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
{SITE_DEVELOPER_CREDIT}
<head>
    <meta charset="UTF-8">
{GATE_HEAD}
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{title}</title>
    <link rel="icon" href="/public/JanaTravelLogo.webp" type="image/webp">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
{extra_head}    <link rel="stylesheet" href="/css/site.css">
    <meta name="description" content="{description}">
</head>
<body>
{NAV}
{body}
{abs_paths(FOOTER)}
    <script>
        window.JANA_HOTELS_SHEET_URL = "https://opensheet.elk.sh/1v3F_YYEJl1mhoN9Hs2F6ee8SzXjsbJdGvXqczB9LKL4/Form%20Responses%201";
    </script>
    <script src="/js/site-access-gate.js"></script>
{scripts}
</body>
</html>
"""

hero = abs_paths(between("<!-- Hero Section -->", "<!-- About Section -->").replace('href="#hotels"', 'href="/hotels/"'))
about = abs_paths(between("<!-- About Section -->", "<!-- Hotels Section -->"))
about = about.replace(
    """        <motion class="about-learn-more-wrap">
            <a class="about-learn-more footer-explore-link" href="/explore/">Learn More</a>
        </div>""",
    "",
).replace(
    """        <motion class="about-learn-more-wrap">
            <a class="about-learn-more footer-explore-link" href="/explore/">Learn More</a>
        </div>""",
    "",
)
# remove learn more block
import re
about = re.sub(r'\s*<div class="about-learn-more-wrap">.*?</div>\s*', '\n', about, flags=re.DOTALL)

hotels_section = abs_paths(between("<!-- Hotels Section -->", "<!-- Destination Modal -->"))
modal = abs_paths(between("<!-- Destination Modal -->", "<!-- Gallery Section -->"))
gallery = abs_paths(between("<!-- Gallery Section -->", "<!-- Services Section -->"))
services = abs_paths(between("<!-- Services Section -->", "<!-- Contact Section -->"))
contact = abs_paths(between("<!-- Contact Section -->", "<!-- Footer -->"))

destinations_body = """    <main class="page-main destinations-page">
        <div class="section-title page-intro">
            <h2>Explore Destinations</h2>
            <p>Discover country highlights, travel tips, and popular areas across the Indian Ocean.</p>
        </div>
        <section class="destinations-country-grid">
            <a class="destinations-country-card" href="/maldives/">
                <img src="/assets/images/maldives_1.jpg" alt="Maldives">
                <div class="destinations-country-card__content">
                    <h3>Maldives</h3>
                    <p>Luxury overwater villas, turquoise lagoons, private island resorts, and dreamy beach escapes.</p>
                </div>
            </a>
            <a class="destinations-country-card" href="/seychelles/">
                <img src="/assets/images/seychelles_1.jpg" alt="Seychelles">
                <div class="destinations-country-card__content">
                    <h3>Seychelles</h3>
                    <p>Granite beaches, crystal-clear waters, lush nature, island hopping, and peaceful luxury stays.</p>
                </div>
            </a>
            <a class="destinations-country-card" href="/mauritius/">
                <img src="/assets/images/mauritius_1.webp" alt="Mauritius">
                <div class="destinations-country-card__content">
                    <h3>Mauritius</h3>
                    <p>Beach resorts, mountain views, waterfalls, rich culture, and relaxing oceanfront escapes.</p>
                </div>
            </a>
        </section>
    </main>"""

# Scripts
site_common = script_slice("// Mobile menu toggle", "function ensureFieldErrorEl")
site_common += "\n\n" + script_slice("const observerOptions =", "const destinations =")
site_nav = """
(function initMultiPageNav() {
    const raw = window.location.pathname.replace(/\\/index\\.html$/, '');
    const path = raw.endsWith('/') ? raw.slice(0, -1) : raw;
    const rules = [
        { test: (p) => p === '' || p === '/', sel: 'a[href="/"]' },
        { test: (p) => p.startsWith('/about'), sel: 'a[href="/about/"]' },
        { test: (p) => p.startsWith('/destinations'), sel: 'a[href="/destinations/"]' },
        { test: (p) => p.startsWith('/hotels'), sel: 'a[href="/hotels/"]' },
        { test: (p) => p.startsWith('/services'), sel: 'a[href="/services/"]' },
        { test: (p) => p.startsWith('/contact'), sel: 'a[href="/contact/"]' },
    ];
    const match = rules.find((r) => r.test(path));
    if (!match) return;
    document.querySelectorAll('.nav-links ' + match.sel).forEach((a) => a.classList.add('active'));
})();

function updateNavContrast() {
    const navWrapper = document.querySelector('.nav-wrapper');
    const heroSection = document.getElementById('home');
    if (!navWrapper) return;
    if (!heroSection) {
        navWrapper.classList.add('nav-on-light');
        return;
    }
    const pastHero = window.scrollY > heroSection.offsetHeight - navWrapper.offsetHeight - 48;
    navWrapper.classList.toggle('nav-on-light', pastHero);
}
window.addEventListener('scroll', updateNavContrast);
updateNavContrast();
"""

hotels_script = script_slice("const destinations =", "// Gallery images")
hotels_script += "\n\n" + script_slice("// Carousel state", "(function initJanaContactIntlPhone()")
hotels_script = hotels_script.replace("applyHotelJsonDataToIndex", "applyHotelJsonDataToHotelsPage")
hotels_script += "\n\napplyHotelJsonDataToHotelsPage();\n"

gallery_script = script_slice("// Gallery images", "// Carousel state")
gallery_script += "\n\n" + script_slice("// Touch support for mobile", "// Initialize gallery")
gallery_script += "\n\ndocument.addEventListener('DOMContentLoaded', initGallery);\n"

contact_script = script_slice("function ensureFieldErrorEl", "const observerOptions =") + "\n"
hotel_loader = script_slice("async function applyHotelJsonDataToIndex", "const destinationFallbackImages")
hotel_loader = hotel_loader.replace("applyHotelJsonDataToIndex", "applyHotelJsonDataToContactPage")
hotel_loader = hotel_loader.replace("applyHotelJsonDataToIndex()", "applyHotelJsonDataToContactPage()")
contact_script += "\n\n" + hotel_loader + "\n\napplyHotelJsonDataToContactPage();\n"

intl_start = text.find("(function initJanaContactIntlPhone()")
if intl_start < 0:
    raise SystemExit("intl tel block not found")
intl_end = text.find("})();", intl_start) + 5
intl_block = text[intl_start:intl_end]
intl_lines = [line[8:] if line.startswith("        ") else line for line in intl_block.splitlines()]
contact_script += "\n\n" + "\n".join(intl_lines)

(ROOT / "js" / "site-common.js").write_text(site_common + site_nav, encoding="utf-8")
(ROOT / "js" / "hotels-catalog.js").write_text(hotels_script, encoding="utf-8")
(ROOT / "js" / "gallery.js").write_text(gallery_script, encoding="utf-8")
(ROOT / "js" / "contact-page.js").write_text(contact_script, encoding="utf-8")

dest_css = """
.page-main { padding-top: 7rem; padding-bottom: 4rem; }
.destinations-page .page-intro { margin-bottom: 2.5rem; }
.destinations-country-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 0 5%;
}
.destinations-country-card {
    position: relative; border-radius: 20px; overflow: hidden; min-height: 320px;
    text-decoration: none; color: var(--white);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.destinations-country-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(0, 206, 209, 0.35);
}
.destinations-country-card img {
    width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;
}
.destinations-country-card__content {
    position: absolute; inset: auto 0 0 0; padding: 1.5rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
}
.destinations-country-card__content h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
"""
css_path = ROOT / "css" / "site.css"
if "destinations-country-grid" not in css_path.read_text(encoding="utf-8"):
    css_path.write_text(css_path.read_text(encoding="utf-8") + dest_css, encoding="utf-8")

pages = {
    ROOT / "index.html": page_shell(
        "JANA Travel - Your Gateway to Paradise",
        "Explore JANA Travel hotels and curated paradise stays.",
        hero + "\n" + gallery,
        scripts="    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>\n    <script src=\"/js/gallery.js\"></script>",
    ),
    ROOT / "about" / "index.html": page_shell(
        "About | JANA Travel",
        "About JANA Travel — your trusted partner for luxury Indian Ocean holidays.",
        f"    <main class=\"page-main about\">\n{about}\n    </main>",
        scripts="    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>",
    ),
    ROOT / "destinations" / "index.html": page_shell(
        "Destinations | JANA Travel",
        "Explore Maldives, Seychelles, and Mauritius with JANA Travel.",
        destinations_body,
        scripts="    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>",
    ),
    ROOT / "hotels" / "index.html": page_shell(
        "Hotels | JANA Travel",
        "Browse and filter luxury hotel packages across the Indian Ocean.",
        f"    <main class=\"page-main hotels\">\n{hotels_section}\n    </main>\n{modal}",
        scripts="    <script type=\"module\" src=\"/js/loading-progress.js\"></script>\n    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>\n    <script src=\"/js/hotels-catalog.js\"></script>",
    ),
    ROOT / "services" / "index.html": page_shell(
        "Services | JANA Travel",
        "Luxury travel services from JANA Travel.",
        f"    <main class=\"page-main services\">\n{services}\n    </main>",
        scripts="    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>",
    ),
    ROOT / "contact" / "index.html": page_shell(
        "Contact | JANA Travel",
        "Contact JANA Travel to plan your dream vacation.",
        f"    <main class=\"page-main contact\">\n{contact}\n    </main>",
        extra_head='    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@27.0.0/dist/css/intlTelInput.css">\n',
        scripts="    <script src=\"https://cdn.jsdelivr.net/npm/intl-tel-input@27.0.0/dist/js/intlTelInput.min.js\"></script>\n    <script src=\"/js/site-common.js\"></script>\n    <script src=\"/js/site-mobile-nav.js\"></script>\n    <script src=\"/js/contact-page.js\"></script>",
    ),
}

for path, content in pages.items():
    path.write_text(content, encoding="utf-8")

print("Built", len(pages), "pages")
