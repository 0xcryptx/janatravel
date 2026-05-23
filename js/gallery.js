import {
    createJanaGallerySwiper,
    ensureSwiperLoaded,
    preloadJanaImages,
    preloadJanaSlideNeighbors
} from './jana-swiper.js';
import { loadAllHotelRootGalleryImages } from './hotel-root-images.js';

/** Collapsed stack preview: 3 Maldives + 2 Seychelles (center card = Maldives hero). */
const GALLERY_STACK_IMAGES = [
    '/assets/images/seychelles_1.jpg',
    '/assets/images/maldives_3.jpg',
    '/assets/images/maldives_1.jpg',
    '/assets/images/maldives_2.avif',
    '/assets/images/seychelles_2.jpg'
];

let galleryImages = [];
let currentImages = [];
let currentSlide = 0;
let lightboxOpen = false;
let lightboxScrollPosition = 0;
let galleryScrollPosition = 0;
let isGalleryExpanded = false;
let galleryLightboxSwiper = null;
let gallerySwiperSyncLock = false;
let lightboxInitPromise = null;
let lightboxSuppressCloseUntil = 0;
const LIGHTBOX_MAGNIFY_SCALE = 2.25;

function openGalleryImage(index) {
    if (!galleryImages.length) return;
    currentImages = galleryImages;
    currentSlide = index;
    const runOpen = () => {
        ensureGalleryLightboxReady()
            .then(() => openLightbox())
            .catch((error) => {
                console.error('Failed to open gallery lightbox:', error);
            });
    };
    // Defer so Android's synthetic click after touchend does not hit the overlay and close it.
    window.requestAnimationFrame(() => window.requestAnimationFrame(runOpen));
}

function ensureGalleryLightboxReady() {
    if (!lightboxInitPromise) {
        lightboxInitPromise = initGalleryLightboxSwiper();
    }
    return lightboxInitPromise;
}

function normalizeGallerySlide(index) {
    if (!currentImages.length) return 0;
    return ((index % currentImages.length) + currentImages.length) % currentImages.length;
}

function setGallerySlide(index, source = 'api') {
    if (gallerySwiperSyncLock) return;
    gallerySwiperSyncLock = true;
    currentSlide = normalizeGallerySlide(index);

    if (source !== 'lightbox' && galleryLightboxSwiper && lightboxOpen) {
        galleryLightboxSwiper.slideTo(currentSlide, 0);
    }

    if (lightboxOpen) {
        const counter = document.getElementById('lightboxCounter');
        if (counter && currentImages.length) {
            counter.textContent = `${currentSlide + 1} / ${currentImages.length}`;
        }
        resetLightboxMagnify();
        preloadJanaSlideNeighbors(currentImages, currentSlide);
    }
    gallerySwiperSyncLock = false;
}

function rebuildGalleryLightbox() {
    if (!galleryLightboxSwiper) return;
    galleryLightboxSwiper.rebuild();
    if (lightboxOpen) {
        galleryLightboxSwiper.slideTo(currentSlide, 0);
    }
}

function openLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;

    lightboxScrollPosition = window.scrollY;
    lightboxSuppressCloseUntil = Date.now() + 500;
    resetLightboxMagnify();
    overlay.classList.add('active');
    clearGalleryItemHover();
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${lightboxScrollPosition}px`;
    document.documentElement.style.overflow = 'hidden';
    lightboxOpen = true;
    preloadJanaImages(currentImages);
    setGallerySlide(currentSlide, 'api');
}

function closeLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    resetLightboxMagnify();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, lightboxScrollPosition);
    lightboxOpen = false;
    clearGalleryItemHover();
}

function changeSlide(direction) {
    setGallerySlide(currentSlide + direction, 'api');
}

function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function resetLightboxMagnify() {
    const image =
        galleryLightboxSwiper?.getActiveImage?.() ||
        document.querySelector('#lightboxSwipeContainer img');
    if (!image) return;
    image.style.transform = '';
    image.style.transformOrigin = '';
}

function onLightboxImageMouseMove(e) {
    if (!lightboxOpen || isMobile()) return;
    const container = document.getElementById('lightboxSwipeContainer');
    const img = galleryLightboxSwiper?.getActiveImage?.() || container?.querySelector('img');
    if (!container || !img || !img.complete || !img.naturalWidth) return;
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    const xPct = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / containerRect.height) * 100));
    img.style.transformOrigin = `${xPct}% ${yPct}%`;
    img.style.transform = `scale(${LIGHTBOX_MAGNIFY_SCALE})`;
}

function onLightboxImageMouseLeave() {
    resetLightboxMagnify();
}

function initLightboxMagnifyListeners() {
    const container = document.getElementById('lightboxSwipeContainer');
    if (!container) return;
    container.addEventListener('mousemove', onLightboxImageMouseMove);
    container.addEventListener('mouseleave', onLightboxImageMouseLeave);
    container.addEventListener('click', (e) => {
        if (lightboxOpen && e.target.closest('img')) e.stopPropagation();
    });
}

async function initGalleryLightboxSwiper() {
    const container = document.getElementById('lightboxSwipeContainer');
    if (!container) return;

    await ensureSwiperLoaded();
    const escapeAttr = (value) =>
        String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;');

    galleryLightboxSwiper = await createJanaGallerySwiper(container, {
        mode: 'lightbox',
        getImages: () => currentImages,
        getInitialIndex: () => currentSlide,
        slideClass: 'lightbox-image-container',
        onIndexChange: (index) => {
            setGallerySlide(index, 'lightbox');
        },
        renderSlideInner: (src, slideIndex, total, initialIndex) => {
            const norm = total > 0 ? ((initialIndex % total) + total) % total : 0;
            const prev = total > 0 ? (norm - 1 + total) % total : 0;
            const next = total > 0 ? (norm + 1) % total : 0;
            const priority =
                slideIndex === norm || slideIndex === prev || slideIndex === next
                    ? ' fetchpriority="high"'
                    : '';
            return `<img src="${escapeAttr(src)}" alt="" draggable="false" loading="eager" decoding="async"${priority}>`;
        }
    });
}

function clearGalleryItemHover() {
    document.querySelectorAll('.gallery-item.is-touch-hover').forEach((item) => {
        item.classList.remove('is-touch-hover');
    });
}

function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!galleryImages.length) {
        grid.innerHTML =
            '<p class="gallery-empty">Photos appear for active hotels on the website that have images in their hotel folder root (1–4 or add_image).</p>';
        return;
    }

    const rotations = [-15, -10, -5, 0, 5, 10, 15, -12, 8, -8, 12, -6];

    galleryImages.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.setProperty('--rotation', `${rotations[index % rotations.length]}deg`);
        item.dataset.galleryIndex = String(index);
        item.innerHTML = `
            <img src="${src}" alt="Gallery Image ${index + 1}" draggable="false">
            <div class="gallery-overlay"></div>
        `;
        bindGalleryItemOpen(item, index);
        grid.appendChild(item);
    });
}

function bindGalleryItemOpen(item, index) {
    const open = () => openGalleryImage(index);

    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
        }
    });

    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        open();
    });
}

async function expandGallery() {
    if (isGalleryExpanded) return;

    galleryScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    isGalleryExpanded = true;

    const stack = document.getElementById('photoStack');
    const expanded = document.getElementById('galleryExpanded');
    const grid = document.getElementById('galleryGrid');
    if (!stack || !expanded) return;

    if (grid && !galleryImages.length) {
        grid.innerHTML = '<p class="gallery-loading">Loading photos…</p>';
    }

    try {
        await ensureGalleryBootstrap();
    } catch (error) {
        console.error('Gallery bootstrap failed:', error);
    }

    initGallery();

    const stackCards = document.querySelectorAll('.stack-card');

    stackCards.forEach((card, index) => {
        const angles = [-30, -15, 0, 15, 30];
        const distances = [150, 100, 80, 100, 150];
        card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = `rotate(${angles[index]}deg) translateY(${distances[index]}px) scale(0.5)`;
        card.style.opacity = '0';
    });

    setTimeout(() => {
        stack.classList.add('hidden');
        expanded.classList.add('active');

        stackCards.forEach((card) => {
            card.style.transition = '';
            card.style.transform = '';
            card.style.opacity = '';
        });

        setTimeout(() => {
            document.querySelectorAll('.gallery-item').forEach((item, index) => {
                setTimeout(() => item.classList.add('visible'), index * 80);
            });
        }, 100);
    }, 400);
}

function collapseGallery() {
    isGalleryExpanded = false;

    const stack = document.getElementById('photoStack');
    const expanded = document.getElementById('galleryExpanded');
    if (!stack || !expanded) return;

    const items = document.querySelectorAll('.gallery-item');
    const itemsArray = Array.from(items).reverse();

    itemsArray.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('collapsing');
            item.classList.remove('visible');
        }, index * 40);
    });

    setTimeout(() => {
        expanded.classList.remove('active');
        items.forEach((item) => item.classList.remove('collapsing'));

        setTimeout(() => {
            const stackCards = document.querySelectorAll('.stack-card');

            stackCards.forEach((card, index) => {
                const angles = [-30, -15, 0, 15, 30];
                const distances = [150, 100, 80, 100, 150];
                card.style.transition = 'none';
                card.style.transform = `rotate(${angles[index]}deg) translateY(${distances[index]}px) scale(0.5)`;
                card.style.opacity = '0';
            });

            stack.classList.remove('hidden');

            setTimeout(() => {
                stackCards.forEach((card) => {
                    card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    card.style.transform = '';
                    card.style.opacity = '';
                });
            }, 50);

            setTimeout(() => {
                const gallerySection = document.getElementById('gallery');
                const navWrapper = document.querySelector('.nav-wrapper');
                if (!gallerySection || !navWrapper) return;

                const navHeight = navWrapper.offsetHeight;
                const sectionHeight = gallerySection.offsetHeight;
                const windowHeight = window.innerHeight;
                let targetPosition;

                if (sectionHeight < windowHeight) {
                    targetPosition = gallerySection.getBoundingClientRect().top + window.pageYOffset - navHeight - ((windowHeight - sectionHeight) / 3);
                } else {
                    targetPosition = gallerySection.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                }

                window.scrollTo({ top: Math.max(0, targetPosition), left: 0, behavior: 'smooth' });
            }, 700);
        }, 300);
    }, items.length * 40 + 200);
}

function initGalleryStack() {
    const cards = document.querySelectorAll('#photoStack .stack-card');
    cards.forEach((card, index) => {
        const src = GALLERY_STACK_IMAGES[index];
        if (!src) return;
        card.style.backgroundImage = `url("${src}")`;
    });
    preloadJanaImages(GALLERY_STACK_IMAGES);
}

function initGalleryTouch() {
    const photoStack = document.getElementById('photoStack');
    if (!photoStack) return;

    photoStack.addEventListener('touchstart', function () {
        this.classList.add('touch-active');
    });

    photoStack.addEventListener('touchend', function () {
        setTimeout(() => this.classList.remove('touch-active'), 300);
    });
}

function initGalleryGridTouch() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.addEventListener(
        'touchstart',
        (e) => {
            const item = e.target.closest('.gallery-item');
            clearGalleryItemHover();
            if (item) item.classList.add('is-touch-hover');
        },
        { passive: true }
    );

    grid.addEventListener(
        'touchend',
        (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) item.classList.remove('is-touch-hover');
        },
        { passive: true }
    );

    grid.addEventListener('touchcancel', clearGalleryItemHover);

    document.addEventListener(
        'touchstart',
        (e) => {
            if (lightboxOpen) return;
            if (!e.target.closest('.gallery-item')) clearGalleryItemHover();
        },
        { passive: true }
    );
}

function initLightboxOverlayHandlers() {
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
        if (Date.now() < lightboxSuppressCloseUntil) return;
        if (e.target.closest('.lightbox-close, .lightbox-btn, .lightbox-counter')) return;
        closeLightbox();
    });
}

document.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
});

let galleryUiInitialized = false;
let galleryBootstrapPromise = null;

function ensureGalleryBootstrap() {
    if (!galleryBootstrapPromise) {
        galleryBootstrapPromise = bootstrapGallery().catch((error) => {
            galleryBootstrapPromise = null;
            throw error;
        });
    }
    return galleryBootstrapPromise;
}

async function bootstrapGallery() {
    galleryImages = await loadAllHotelRootGalleryImages();
    currentImages = galleryImages;
    currentSlide = 0;

    initGallery();
    if (!galleryUiInitialized) {
        initGalleryTouch();
        initGalleryGridTouch();
        initLightboxMagnifyListeners();
        initLightboxOverlayHandlers();
        galleryUiInitialized = true;
    }

    if (galleryImages.length) {
        preloadJanaImages(galleryImages);
    }

    if (galleryLightboxSwiper) {
        rebuildGalleryLightbox();
        if (!lightboxOpen) {
            galleryLightboxSwiper.slideTo(0, 0);
        }
    } else {
        await ensureGalleryLightboxReady();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initGalleryStack();
    ensureGalleryBootstrap().catch((error) => {
        console.error('Failed to initialize gallery:', error);
    });
});

window.expandGallery = expandGallery;
window.collapseGallery = collapseGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.changeSlide = changeSlide;
