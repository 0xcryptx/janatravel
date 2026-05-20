const galleryImages = [
    '/assets/hotel_images/niyama-private-islands-maldives/1.jpg',
    '/assets/hotel_images/niyama-private-islands-maldives/2.jpg',
    '/assets/hotel_images/niyama-private-islands-maldives/3.jpg',
    '/assets/hotel_images/niyama-private-islands-maldives/4.jpg',
    '/assets/hotel_images/kandima-maldives/1.jpg',
    '/assets/hotel_images/kandima-maldives/2.avif',
    '/assets/hotel_images/kandima-maldives/3.jpg',
    '/assets/hotel_images/kandima-maldives/4.png',
    '/assets/hotel_images/waldorf-astoria-maldives-ithaafushi/1.jpg',
    '/assets/hotel_images/waldorf-astoria-maldives-ithaafushi/2.jpg',
    '/assets/hotel_images/waldorf-astoria-maldives-ithaafushi/3.avif',
    '/assets/hotel_images/waldorf-astoria-maldives-ithaafushi/4.jpeg',
    '/assets/hotel_images/jumeirah-olhahali-island/1.jpg',
    '/assets/hotel_images/jumeirah-olhahali-island/2.jpg',
    '/assets/hotel_images/jumeirah-olhahali-island/3.jpg',
    '/assets/hotel_images/jumeirah-olhahali-island/4.avif',
    '/assets/hotel_images/intercontinental-maldives-maamunagau-resort/1.avif',
    '/assets/hotel_images/intercontinental-maldives-maamunagau-resort/2.jpg',
    '/assets/hotel_images/intercontinental-maldives-maamunagau-resort/3.webp',
    '/assets/hotel_images/intercontinental-maldives-maamunagau-resort/4.webp',
    '/assets/hotel_images/radisson-blu-resort-maldives/1.webp',
    '/assets/hotel_images/radisson-blu-resort-maldives/2.jpg',
    '/assets/hotel_images/radisson-blu-resort-maldives/3.webp',
    '/assets/hotel_images/radisson-blu-resort-maldives/4.jpg'
];

let currentImages = galleryImages;
let currentSlide = 0;
let lightboxOpen = false;
let lightboxScrollPosition = 0;
let galleryScrollPosition = 0;
let isGalleryExpanded = false;

function openGalleryImage(index) {
    currentImages = galleryImages;
    currentSlide = index;
    openLightbox();
}

function openLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;

    lightboxScrollPosition = window.scrollY;
    document.getElementById('lightboxImage').src = currentImages[currentSlide];
    document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${lightboxScrollPosition}px`;
    document.documentElement.style.overflow = 'hidden';
    lightboxOpen = true;
    updateAdjacentImages();
    resetSwipePositionsInstant();
}

function updateLightbox() {
    if (!lightboxOpen) return;
    document.getElementById('lightboxImage').src = currentImages[currentSlide];
    document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
    updateAdjacentImages();
}

function closeLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, lightboxScrollPosition);
    lightboxOpen = false;
}

function changeSlide(direction) {
    currentSlide += direction;
    if (currentSlide >= currentImages.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = currentImages.length - 1;
    updateLightbox();
}

function updateAdjacentImages() {
    const prevIndex = currentSlide === 0 ? currentImages.length - 1 : currentSlide - 1;
    const nextIndex = currentSlide === currentImages.length - 1 ? 0 : currentSlide + 1;
    const prevImg = document.getElementById('lightboxPrevImage');
    const nextImg = document.getElementById('lightboxNextImage');
    if (prevImg) prevImg.src = currentImages[prevIndex];
    if (nextImg) nextImg.src = currentImages[nextIndex];
}

const SWIPE_SETTLE_MS = 440;
const SWIPE_SETTLE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function waitForTransformTransition(el, durationMs) {
    return new Promise((resolve) => {
        let settled = false;
        const settle = () => {
            if (settled) return;
            settled = true;
            el.removeEventListener('transitionend', onEnd);
            resolve();
        };
        const onEnd = (event) => {
            if (event.target !== el || event.propertyName !== 'transform') return;
            settle();
        };
        el.addEventListener('transitionend', onEnd);
        setTimeout(settle, durationMs + 60);
    });
}

async function animateLightboxSwipe(direction) {
    const mainContainer = document.getElementById('lightboxContainer');
    const prevContainer = document.getElementById('lightboxPrevContainer');
    const nextContainer = document.getElementById('lightboxNextContainer');
    const prevImage = document.getElementById('lightboxPrevImage');
    const nextImage = document.getElementById('lightboxNextImage');
    if (!mainContainer || !prevContainer || !nextContainer) return;

    const transition = `transform ${SWIPE_SETTLE_MS}ms ${SWIPE_SETTLE_EASE}`;
    mainContainer.style.transition = transition;
    prevContainer.style.transition = transition;
    nextContainer.style.transition = transition;

    if (direction === 'right') {
        mainContainer.style.transform = 'translateX(100%)';
        prevContainer.style.transform = 'translateX(0)';
    } else {
        mainContainer.style.transform = 'translateX(-100%)';
        nextContainer.style.transform = 'translateX(0)';
    }

    await waitForTransformTransition(mainContainer, SWIPE_SETTLE_MS);

    const visibleSrc =
        (direction === 'right' ? prevImage : nextImage)?.currentSrc ||
        (direction === 'right' ? prevImage : nextImage)?.src;
    changeSlide(direction === 'right' ? -1 : 1);
    const mainImage = document.getElementById('lightboxImage');
    if (visibleSrc && mainImage) mainImage.src = visibleSrc;

    mainContainer.style.transition = 'none';
    prevContainer.style.transition = 'none';
    nextContainer.style.transition = 'none';
    mainContainer.style.transform = 'translateX(0)';
    prevContainer.style.transform = 'translateX(-100%)';
    nextContainer.style.transform = 'translateX(100%)';
    mainContainer.offsetHeight;
    mainContainer.style.transition = '';
    prevContainer.style.transition = '';
    nextContainer.style.transition = '';
}

function resetSwipePositionsInstant() {
    const mainContainer = document.getElementById('lightboxContainer');
    const prevContainer = document.getElementById('lightboxPrevContainer');
    const nextContainer = document.getElementById('lightboxNextContainer');
    if (!mainContainer || !prevContainer || !nextContainer) return;

    mainContainer.style.transition = 'none';
    prevContainer.style.transition = 'none';
    nextContainer.style.transition = 'none';
    mainContainer.style.transform = 'translateX(0)';
    prevContainer.style.transform = 'translateX(-100%)';
    nextContainer.style.transform = 'translateX(100%)';
    mainContainer.offsetHeight;
    mainContainer.style.transition = '';
    prevContainer.style.transition = '';
    nextContainer.style.transition = '';
}

async function resetSwipePositions() {
    const mainContainer = document.getElementById('lightboxContainer');
    const prevContainer = document.getElementById('lightboxPrevContainer');
    const nextContainer = document.getElementById('lightboxNextContainer');
    if (!mainContainer || !prevContainer || !nextContainer) return;

    const transition = `transform ${SWIPE_SETTLE_MS}ms ${SWIPE_SETTLE_EASE}`;
    mainContainer.style.transition = transition;
    prevContainer.style.transition = transition;
    nextContainer.style.transition = transition;
    mainContainer.style.transform = 'translateX(0)';
    prevContainer.style.transform = 'translateX(-100%)';
    nextContainer.style.transform = 'translateX(100%)';

    await waitForTransformTransition(mainContainer, SWIPE_SETTLE_MS);

    mainContainer.style.transition = '';
    prevContainer.style.transition = '';
    nextContainer.style.transition = '';
}

function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const rotations = [-15, -10, -5, 0, 5, 10, 15, -12, 8, -8, 12, -6];

    galleryImages.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.setProperty('--rotation', `${rotations[index % rotations.length]}deg`);
        item.onclick = () => openGalleryImage(index);
        item.innerHTML = `
            <img src="${src}" alt="Gallery Image ${index + 1}">
            <div class="gallery-overlay"></div>
        `;
        grid.appendChild(item);
    });
}

function expandGallery() {
    galleryScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    isGalleryExpanded = true;

    const stack = document.getElementById('photoStack');
    const expanded = document.getElementById('galleryExpanded');
    if (!stack || !expanded) return;

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

function initLightboxSwipe() {
    const swipeContainer = document.getElementById('lightboxSwipeContainer');
    if (!swipeContainer) return;

    let touchStartX = 0;
    let touchCurrentX = 0;
    let isSwiping = false;
    const swipeThreshold = 50;

    swipeContainer.addEventListener('touchstart', (e) => {
        if (!lightboxOpen) return;
        touchStartX = e.touches[0].clientX;
        touchCurrentX = touchStartX;
        isSwiping = true;
        swipeContainer.classList.add('swiping');
        updateAdjacentImages();
    }, { passive: true });

    swipeContainer.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        touchCurrentX = e.touches[0].clientX;
        const diff = touchCurrentX - touchStartX;
        document.getElementById('lightboxContainer').style.transform = `translateX(${diff}px)`;
        document.getElementById('lightboxPrevContainer').style.transform = `translateX(calc(-100% + ${diff}px))`;
        document.getElementById('lightboxNextContainer').style.transform = `translateX(calc(100% + ${diff}px))`;
    }, { passive: true });

    swipeContainer.addEventListener('touchend', async () => {
        if (!isSwiping) return;
        isSwiping = false;
        swipeContainer.classList.remove('swiping');
        const diff = touchCurrentX - touchStartX;
        if (Math.abs(diff) > swipeThreshold) {
            await animateLightboxSwipe(diff > 0 ? 'right' : 'left');
        } else {
            await resetSwipePositions();
        }
    }, { passive: true });
}

document.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
});

document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initGalleryTouch();
    initLightboxSwipe();
});

window.expandGallery = expandGallery;
window.collapseGallery = collapseGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.changeSlide = changeSlide;
