/**
 * Swiper.js integration for JANA Travel image carousels (mobile touch + desktop arrows).
 */

export const JANA_SWIPER_CDN = {
  css: "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
  js: "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
};

export const JANA_SWIPER_DEFAULTS = {
  slidesPerView: 1,
  spaceBetween: 0,
  speed: 300,
  loop: false,
  grabCursor: true,
  watchSlidesProgress: true,
  resistanceRatio: 0.85,
  touchRatio: 1,
  threshold: 5,
  roundLengths: true,
  preventInteractionOnTransition: true,
  breakpoints: {
    769: {
      allowTouchMove: false,
      simulateTouch: false
    }
  }
};

/** Fullscreen lightbox — touch always on (no desktop touch-off breakpoint). */
export const JANA_LIGHTBOX_SWIPER_DEFAULTS = {
  slidesPerView: 1,
  spaceBetween: 0,
  speed: 300,
  loop: false,
  grabCursor: false,
  watchSlidesProgress: true,
  resistanceRatio: 0.85,
  touchRatio: 1,
  threshold: 8,
  roundLengths: true,
  preventInteractionOnTransition: false,
  allowTouchMove: true,
  simulateTouch: false,
  touchEventsTarget: "container",
  touchStartPreventDefault: false,
  passiveListeners: true,
  shortSwipes: true,
  longSwipes: true
};

let swiperLoadPromise = null;

export function isJanaMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

export function applySwiperPerformanceStyles(el) {
  if (!el) return;
  el.style.transform = "translateZ(0)";
  el.style.backfaceVisibility = "hidden";
  el.style.webkitBackfaceVisibility = "hidden";
  el.style.willChange = "transform";
}

export async function ensureSwiperLoaded() {
  if (window.Swiper) return window.Swiper;
  if (!swiperLoadPromise) {
    swiperLoadPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-jana-swiper="css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = JANA_SWIPER_CDN.css;
        link.dataset.janaSwiper = "css";
        document.head.appendChild(link);
      }
      if (window.Swiper) {
        resolve(window.Swiper);
        return;
      }
      const script = document.createElement("script");
      script.src = JANA_SWIPER_CDN.js;
      script.async = true;
      script.dataset.janaSwiper = "js";
      script.onload = () => resolve(window.Swiper);
      script.onerror = () => reject(new Error("Failed to load Swiper.js"));
      document.head.appendChild(script);
    });
  }
  return swiperLoadPromise;
}

function getSlideImage(slideEl) {
  if (!slideEl) return null;
  return slideEl.querySelector("img");
}

/** Logical slide index (real slide, not loop clone). */
export function getSwiperLogicalIndex(swiperInstance) {
  if (!swiperInstance) return 0;
  return swiperInstance.params.loop ? swiperInstance.realIndex : swiperInstance.activeIndex;
}

export function moveSwiperTo(swiperInstance, logicalIndex, speed = 0) {
  if (!swiperInstance) return;
  const duration = speed === undefined ? JANA_SWIPER_DEFAULTS.speed : speed;
  if (swiperInstance.params.loop) {
    swiperInstance.slideToLoop(logicalIndex, duration);
    return;
  }
  swiperInstance.slideTo(logicalIndex, duration);
}

export function refreshSwiperLoop(swiperInstance) {
  if (!swiperInstance?.params?.loop) return;
  swiperInstance.loopDestroy();
  swiperInstance.loopCreate();
  swiperInstance.update();
}

/**
 * Mobile: infinite loop (last → first slides in from the right).
 * Desktop: rewind for arrow buttons; touch disabled via breakpoints.
 *
 * Galleries with 3 or fewer images use bindJanaSwipeCarousel instead of Swiper.
 */
export function getJanaTouchCarouselOptions(slideCount = 0) {
  if (slideCount <= 1) {
    return { loop: false, rewind: false };
  }
  if (isJanaMobile()) {
    return {
      loop: true,
      rewind: false,
      loopAdditionalSlides: slideCount === 2 ? 2 : 1,
      loopPreventsSliding: false
    };
  }
  return {
    loop: false,
    rewind: true
  };
}

export function shouldUseJanaSwiperCarousel(slideCount = 0) {
  return slideCount > 3;
}

/**
 * Fullscreen lightbox: no loop clones (avoids duplicate images on screen).
 */
export function getJanaLightboxOptions(slideCount = 0) {
  if (slideCount <= 1) {
    return { loop: false, rewind: false, allowTouchMove: false };
  }
  return {
    loop: false,
    rewind: false,
    allowTouchMove: true
  };
}

const LIGHTBOX_EDGE_WRAP_DRAG_THRESHOLD = 40;

/**
 * Swipe past first/last slide in fullscreen lightbox.
 * Uses instant slideTo (speed 0) so Swiper does not animate through slide 1, 2, … on wrap.
 */
export function attachJanaLightboxEdgeWrap(swiperInstance, getImageCount, onWrapTo) {
  if (!swiperInstance || typeof getImageCount !== "function") return;

  let touchStartIndex = 0;

  const finishWrap = (targetIndex) => {
    moveSwiperTo(swiperInstance, targetIndex, 0);
    if (typeof onWrapTo === "function") onWrapTo(targetIndex);
    window.requestAnimationFrame(() => {
      if (getSwiperLogicalIndex(swiperInstance) !== targetIndex) {
        moveSwiperTo(swiperInstance, targetIndex, 0);
        if (typeof onWrapTo === "function") onWrapTo(targetIndex);
      }
    });
  };

  swiperInstance.on("touchStart", () => {
    touchStartIndex = getSwiperLogicalIndex(swiperInstance);
  });

  swiperInstance.on("touchEnd", () => {
    const count = getImageCount();
    if (count <= 1) return;

    const diff = swiperInstance.touches?.diff ?? 0;
    const idx = getSwiperLogicalIndex(swiperInstance);
    const wantsNext = diff < -LIGHTBOX_EDGE_WRAP_DRAG_THRESHOLD;
    const wantsPrev = diff > LIGHTBOX_EDGE_WRAP_DRAG_THRESHOLD;

    // Only wrap when still on the same slide as touchStart (swipe hit the edge).
    // Without this, a 1→2 swipe on a 3-slide gallery also has wantsNext and would jump to 0.
    if (wantsNext && idx >= count - 1 && idx === touchStartIndex) {
      finishWrap(0);
      return;
    }
    if (wantsPrev && idx <= 0 && idx === touchStartIndex) {
      finishWrap(count - 1);
    }
  });
}

export function getJanaSwiperOptionsForMode(mode, slideCount = 0) {
  return mode === "lightbox"
    ? getJanaLightboxOptions(slideCount)
    : getJanaTouchCarouselOptions(slideCount);
}

export function preloadJanaImages(urls = []) {
  const unique = [...new Set((Array.isArray(urls) ? urls : []).filter(Boolean))];
  unique.forEach((src) => {
    const probe = new Image();
    probe.decoding = "async";
    probe.src = src;
  });
}

export function preloadJanaSlideNeighbors(urls, centerIndex) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const count = list.length;
  if (!count) return;
  const center = ((centerIndex % count) + count) % count;
  const neighbors = [center, center - 1, center + 1].map(
    (index) => list[((index % count) + count) % count]
  );
  preloadJanaImages(neighbors);
}

/**
 * Touch carousel for 2–3 images (prev / current / next track). No Swiper dependency.
 */
export function bindJanaSwipeCarousel({
  mountBefore,
  mainImageEl,
  getSlideCount,
  applySlideToImage,
  onIndexChange,
  initialIndex = 0,
  viewportClass = "swipe-viewport",
  swipeThreshold = 48
}) {
  if (!mountBefore?.parentNode || !mainImageEl || typeof applySlideToImage !== "function") {
    return null;
  }

  const countAtBuild = getSlideCount();
  if (countAtBuild <= 1) return null;

  const viewport = document.createElement("div");
  viewport.className = viewportClass;
  const track = document.createElement("div");
  track.className = "swipe-track";

  const prevSlide = document.createElement("div");
  const currentSlide = document.createElement("div");
  const nextSlide = document.createElement("div");
  prevSlide.className = "swipe-slide";
  currentSlide.className = "swipe-slide swipe-slide--current";
  nextSlide.className = "swipe-slide";

  const prevImg = document.createElement("img");
  const nextImg = document.createElement("img");
  prevImg.draggable = false;
  nextImg.draggable = false;
  prevImg.decoding = "async";
  nextImg.decoding = "async";
  mainImageEl.draggable = false;

  const parent = mountBefore.parentNode;
  parent.insertBefore(viewport, mountBefore);
  prevSlide.appendChild(prevImg);
  currentSlide.appendChild(mainImageEl);
  nextSlide.appendChild(nextImg);
  track.append(prevSlide, currentSlide, nextSlide);
  viewport.appendChild(track);

  let index =
    countAtBuild > 0 ? ((initialIndex % countAtBuild) + countAtBuild) % countAtBuild : 0;
  let touchStartX = 0;
  let touchCurrentX = 0;
  let prevTouchX = 0;
  let prevTouchTime = 0;
  let releaseVelocity = 0;
  let isDragging = false;
  let isAnimating = false;
  let viewportWidth = 0;
  let trackOffsetPx = 0;
  let dragMoved = false;
  let moveRaf = 0;

  const SWIPE_SETTLE_MS = 440;
  const SWIPE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  const applySlideImage = (imgEl, slideIndex) => {
    const count = getSlideCount();
    if (!count) return;
    const normalized = ((slideIndex % count) + count) % count;
    applySlideToImage(imgEl, normalized);
  };

  const syncAdjacent = () => {
    const count = getSlideCount();
    const hideAdjacent = count <= 1;
    prevSlide.hidden = hideAdjacent;
    nextSlide.hidden = hideAdjacent;
    if (hideAdjacent) return;
    applySlideImage(prevImg, index - 1);
    applySlideImage(nextImg, index + 1);
  };

  const measureViewport = () => {
    viewportWidth = viewport.offsetWidth || parent.offsetWidth || window.innerWidth;
    return viewportWidth;
  };

  const centerOffset = () => -viewportWidth;

  const setTrackOffset = (px, { animate = false, durationMs = SWIPE_SETTLE_MS } = {}) => {
    trackOffsetPx = px;
    if (animate) {
      track.classList.remove("is-dragging");
      track.style.transition = `transform ${durationMs}ms ${SWIPE_EASING}`;
    } else {
      track.classList.add("is-dragging");
      track.style.transition = "none";
    }
    track.style.transform = `translate3d(${px}px, 0, 0)`;
  };

  const snapToCenter = (animate = true) => {
    measureViewport();
    setTrackOffset(centerOffset(), { animate, durationMs: SWIPE_SETTLE_MS });
  };

  const waitForTrackTransition = (durationMs) =>
    new Promise((resolve) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        track.removeEventListener("transitionend", onTransitionEnd);
        resolve();
      };
      const onTransitionEnd = (event) => {
        if (event.target !== track || event.propertyName !== "transform") return;
        settle();
      };
      track.addEventListener("transitionend", onTransitionEnd);
      window.setTimeout(settle, durationMs + 60);
    });

  const animateTrackTo = (targetPx) => {
    measureViewport();
    const distance = Math.abs(targetPx - trackOffsetPx);
    const durationMs = Math.min(
      SWIPE_SETTLE_MS,
      Math.max(220, Math.round((distance / Math.max(viewportWidth, 1)) * SWIPE_SETTLE_MS))
    );
    setTrackOffset(targetPx, { animate: true, durationMs });
    return waitForTrackTransition(durationMs);
  };

  const resetTrackInstant = (px) => {
    track.classList.add("is-dragging");
    track.style.transition = "none";
    track.style.transform = `translate3d(${px}px, 0, 0)`;
    trackOffsetPx = px;
    void track.offsetHeight;
  };

  const commitIndex = (nextIndex, visibleImg) => {
    const count = getSlideCount();
    if (!count) return;
    index = ((nextIndex % count) + count) % count;

    viewport.style.visibility = "hidden";
    void viewport.offsetHeight;
    if (visibleImg?.currentSrc || visibleImg?.src) {
      applySlideToImage(mainImageEl, index);
    } else {
      applySlideImage(mainImageEl, index);
    }
    resetTrackInstant(centerOffset());
    syncAdjacent();
    void viewport.offsetHeight;

    requestAnimationFrame(() => {
      viewport.style.visibility = "visible";
      if (onIndexChange) onIndexChange(index);
    });
  };

  const finishDrag = async () => {
    if (!isDragging || isAnimating) return;
    isDragging = false;
    if (moveRaf) {
      cancelAnimationFrame(moveRaf);
      moveRaf = 0;
    }
    measureViewport();

    const diff = touchCurrentX - touchStartX;
    const progress = diff / Math.max(viewportWidth, 1);
    const flickThreshold = 0.35;
    const count = getSlideCount();

    if (count <= 1) {
      snapToCenter(true);
      window.setTimeout(() => {
        dragMoved = false;
      }, 80);
      return;
    }

    let goNext =
      diff < -swipeThreshold || releaseVelocity < -flickThreshold || progress < -0.18;
    let goPrev =
      diff > swipeThreshold || releaseVelocity > flickThreshold || progress > 0.18;
    if (goNext && goPrev) {
      goNext = diff < 0;
      goPrev = diff > 0;
    }

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    isAnimating = true;
    try {
      if (!goNext && !goPrev) {
        await animateTrackTo(centerOffset());
        return;
      }

      const targetPx = goNext ? centerOffset() - viewportWidth : centerOffset() + viewportWidth;
      const nextIndex = goNext ? index + 1 : index - 1;
      const visibleImg = goNext ? nextImg : prevImg;
      await animateTrackTo(targetPx);
      commitIndex(nextIndex, visibleImg);
    } finally {
      isAnimating = false;
      window.setTimeout(() => {
        dragMoved = false;
      }, 80);
    }
  };

  viewport.addEventListener(
    "touchstart",
    (event) => {
      if (getSlideCount() <= 1 || isAnimating) return;
      isDragging = true;
      dragMoved = false;
      const now = performance.now();
      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;
      prevTouchX = touchStartX;
      prevTouchTime = now;
      releaseVelocity = 0;
      measureViewport();
      track.classList.add("is-dragging");
      syncAdjacent();
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging) return;
      const now = performance.now();
      touchCurrentX = event.touches[0].clientX;
      const dt = Math.max(now - prevTouchTime, 16);
      releaseVelocity = (touchCurrentX - prevTouchX) / dt;
      prevTouchX = touchCurrentX;
      prevTouchTime = now;
      if (Math.abs(touchCurrentX - touchStartX) > 8) dragMoved = true;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const moveDiff = touchCurrentX - touchStartX;
        setTrackOffset(centerOffset() + moveDiff, false);
      });
    },
    { passive: true }
  );

  viewport.addEventListener("touchend", finishDrag);
  viewport.addEventListener("touchcancel", finishDrag);

  applySlideImage(mainImageEl, index);
  syncAdjacent();
  requestAnimationFrame(() => {
    measureViewport();
    resetTrackInstant(centerOffset());
  });

  let resizeObserver = null;
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => snapToCenter(false));
    resizeObserver.observe(viewport);
  }

  return {
    setIndex(nextIndex, options = {}) {
      const count = getSlideCount();
      if (!count) return;
      index = ((nextIndex % count) + count) % count;
      applySlideImage(mainImageEl, index);
      syncAdjacent();
      measureViewport();
      resetTrackInstant(centerOffset());
      if (!options.silent && onIndexChange) onIndexChange(index);
    },
    refresh() {
      syncAdjacent();
      measureViewport();
      resetTrackInstant(centerOffset());
    },
    getActiveImage() {
      return mainImageEl;
    },
    didDrag() {
      const moved = dragMoved;
      dragMoved = false;
      return moved;
    },
    destroy() {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (mainImageEl.parentNode === currentSlide && parent.contains(viewport)) {
        parent.insertBefore(mainImageEl, viewport);
      }
      viewport.remove();
    }
  };
}

/**
 * Pick Swiper (4+ images) or touch-track carousel (2–3). Single image: no carousel.
 */
export async function bindJanaImageCarousel(options) {
  const count = typeof options.getSlideCount === "function" ? options.getSlideCount() : 0;
  if (count <= 1) {
    if (count === 0) {
      return bindJanaSwiperCarousel(options);
    }
    return null;
  }
  if (shouldUseJanaSwiperCarousel(count)) {
    return bindJanaSwiperCarousel(options);
  }
  return bindJanaSwipeCarousel(options);
}

/**
 * Hotel hero / room / lightbox carousels (Swiper; use bindJanaImageCarousel to auto-pick).
 */
export async function bindJanaSwiperCarousel({
  mountBefore,
  mainImageEl,
  getSlideCount,
  applySlideToImage,
  onIndexChange,
  initialIndex = 0,
  viewportClass = "swipe-viewport"
}) {
  await ensureSwiperLoaded();
  if (!mountBefore?.parentNode || !mainImageEl || typeof applySlideToImage !== "function") {
    return null;
  }

  const SwiperCtor = window.Swiper;
  const viewport = document.createElement("div");
  viewport.className = `${viewportClass} swiper jana-swiper-viewport`;
  applySwiperPerformanceStyles(viewport);

  const wrapper = document.createElement("div");
  wrapper.className = "swiper-wrapper";
  applySwiperPerformanceStyles(wrapper);

  let index = initialIndex;
  let dragMoved = false;
  let swiper = null;

  const parent = mountBefore.parentNode;
  const isLightboxViewport = String(viewportClass).includes("lightbox");
  const countAtBuild = getSlideCount();
  const normalizedInitial =
    countAtBuild > 0 ? ((initialIndex % countAtBuild) + countAtBuild) % countAtBuild : 0;
  index = normalizedInitial;

  parent.insertBefore(viewport, mountBefore);
  viewport.appendChild(wrapper);

  const populateSlides = () => {
    const count = getSlideCount();
    wrapper.innerHTML = "";
    if (!count) return 0;

    for (let i = 0; i < count; i += 1) {
      const slide = document.createElement("div");
      slide.className = "swiper-slide swipe-slide";
      slide.setAttribute("data-swiper-slide-index", String(i));
      if (i === index) slide.classList.add("swipe-slide--current");

      const img = i === index ? mainImageEl : document.createElement("img");
      if (img !== mainImageEl) {
        img.draggable = false;
        img.decoding = "async";
      }
      applySlideToImage(img, i);
      slide.appendChild(img);
      wrapper.appendChild(slide);
    }
    return count;
  };

  populateSlides();

  const markCurrentSlide = (logicalIndex) => {
    wrapper.querySelectorAll(".swiper-slide").forEach((slideEl) => {
      const dataIndex = slideEl.getAttribute("data-swiper-slide-index");
      const slideIndex =
        dataIndex !== null ? Number(dataIndex) : Array.from(wrapper.children).indexOf(slideEl);
      slideEl.classList.toggle("swipe-slide--current", slideIndex === logicalIndex);
    });
  };

  const initSwiper = () => {
    if (swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
    const count = getSlideCount();
    if (!count) return;

    const touchOpts = getJanaSwiperOptionsForMode(isLightboxViewport ? "lightbox" : "carousel", count);
    const baseDefaults = isLightboxViewport ? JANA_LIGHTBOX_SWIPER_DEFAULTS : JANA_SWIPER_DEFAULTS;
    swiper = new SwiperCtor(viewport, {
      ...baseDefaults,
      ...touchOpts,
      allowTouchMove: count > 1,
      initialSlide: touchOpts.loop ? 0 : index,
      on: {
        slideChange(instance) {
          index = getSwiperLogicalIndex(instance);
          markCurrentSlide(index);
          const activeImg = getSlideImage(instance.slides[instance.activeIndex]) || mainImageEl;
          applySlideToImage(activeImg, index);
          if (onIndexChange) onIndexChange(index);
        },
        slideChangeTransitionEnd(instance) {
          if (!instance.params.loop) return;
          const count = getSlideCount();
          if (count <= 1) return;
          const activeSlide = instance.slides?.[instance.activeIndex];
          const attr = activeSlide?.getAttribute?.("data-swiper-slide-index");
          if (attr === null || attr === "") return;
          const domLogical = Number(attr);
          if (!Number.isFinite(domLogical) || domLogical < 0 || domLogical >= count) return;
          if (domLogical === index) return;
          index = domLogical;
          markCurrentSlide(index);
          const activeImg = getSlideImage(activeSlide) || mainImageEl;
          applySlideToImage(activeImg, index);
          if (onIndexChange) onIndexChange(index);
        },
        sliderFirstMove() {
          dragMoved = true;
        },
        touchEnd() {
          window.setTimeout(() => {
            dragMoved = false;
          }, 80);
        }
      }
    });

    if (touchOpts.loop) {
      moveSwiperTo(swiper, index, 0);
    }

    const applyWrapIndex = (wrapIndex) => {
      index = wrapIndex;
      markCurrentSlide(index);
      const activeImg = getSlideImage(swiper.slides[swiper.activeIndex]) || mainImageEl;
      applySlideToImage(activeImg, wrapIndex);
      if (onIndexChange) onIndexChange(wrapIndex);
    };

    if (isLightboxViewport) {
      attachJanaLightboxEdgeWrap(swiper, getSlideCount, applyWrapIndex);
    }
  };

  initSwiper();

  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(() => {
      if (swiper) swiper.update();
    });
    resizeObserver.observe(viewport);
  }

  return {
    setIndex(nextIndex, options = {}) {
      const count = getSlideCount();
      if (!count || !swiper) return;
      index = ((nextIndex % count) + count) % count;
      moveSwiperTo(swiper, index, options.silent ? 0 : JANA_SWIPER_DEFAULTS.speed);
      markCurrentSlide(index);
      const activeImg = getSlideImage(swiper.slides[swiper.activeIndex]) || mainImageEl;
      applySlideToImage(activeImg, index);
      if (!options.silent && onIndexChange) onIndexChange(index);
    },
    refresh() {
      const count = getSlideCount();
      const slideCount = wrapper.querySelectorAll(".swiper-slide").length;
      if (!count) return;
      if (slideCount !== count) {
        populateSlides();
        initSwiper();
        if (swiper?.params?.loop) {
          moveSwiperTo(swiper, index, 0);
        }
        return;
      }
      if (!isLightboxViewport) {
        wrapper.querySelectorAll(".swiper-slide").forEach((slideEl, slideIndex) => {
          const img = getSlideImage(slideEl);
          if (img) applySlideToImage(img, slideIndex);
        });
      }
      if (swiper) swiper.update();
    },
    getActiveImage() {
      if (!swiper) return mainImageEl;
      return getSlideImage(swiper.slides[swiper.activeIndex]) || mainImageEl;
    },
    didDrag() {
      const moved = dragMoved;
      dragMoved = false;
      return moved;
    },
    destroy() {
      if (swiper) {
        swiper.destroy(true, true);
        swiper = null;
      }
      if (mainImageEl && parent.contains(viewport)) {
        parent.insertBefore(mainImageEl, viewport);
        viewport.remove();
      }
    }
  };
}

/**
 * Catalog modal carousel, site lightbox, and similar multi-image viewers.
 */
export async function createJanaGallerySwiper(containerEl, options = {}) {
  await ensureSwiperLoaded();
  if (!containerEl) return null;

  const SwiperCtor = window.Swiper;
  const {
    getImages,
    getInitialIndex = () => 0,
    onIndexChange,
    slideClass = "",
    renderSlideInner,
    swiperOptions = {},
    mode = "carousel"
  } = options;
  const { on: userOn = {}, ...restSwiperOptions } = swiperOptions;

  if (containerEl.swiper) {
    containerEl.swiper.destroy(true, true);
  }

  containerEl.classList.add("swiper", "jana-swiper-gallery");
  applySwiperPerformanceStyles(containerEl);

  const wrapper = document.createElement("div");
  wrapper.className = "swiper-wrapper";
  applySwiperPerformanceStyles(wrapper);
  containerEl.innerHTML = "";
  containerEl.appendChild(wrapper);

  let dragMoved = false;

  const buildSlides = (initialForRender = getInitialIndex()) => {
    const images = typeof getImages === "function" ? getImages() : [];
    wrapper.innerHTML = images
      .map((src, slideIndex) => {
        const inner =
          typeof renderSlideInner === "function"
            ? renderSlideInner(src, slideIndex, images.length, initialForRender)
            : `<img src="${src}" alt="" draggable="false" loading="eager" decoding="async">`;
        return `<div class="swiper-slide ${slideClass}" data-swiper-slide-index="${slideIndex}">${inner}</div>`;
      })
      .join("");
    return images.length;
  };

  const initial = getInitialIndex();
  buildSlides(initial);
  const imageCount = typeof getImages === "function" ? getImages().length : 0;
  const touchOpts = getJanaSwiperOptionsForMode(mode, imageCount);
  const baseDefaults =
    mode === "lightbox" ? JANA_LIGHTBOX_SWIPER_DEFAULTS : JANA_SWIPER_DEFAULTS;
  const swiper = new SwiperCtor(containerEl, {
    ...baseDefaults,
    ...touchOpts,
    ...restSwiperOptions,
    allowTouchMove: imageCount > 1,
    initialSlide: touchOpts.loop ? 0 : initial,
    on: {
      ...userOn,
      slideChange(instance) {
        if (userOn.slideChange) userOn.slideChange(instance);
        const logicalIndex = getSwiperLogicalIndex(instance);
        if (mode === "lightbox" && typeof getImages === "function") {
          preloadJanaSlideNeighbors(getImages(), logicalIndex);
        }
        if (onIndexChange) onIndexChange(logicalIndex);
      },
      sliderFirstMove() {
        if (userOn.sliderFirstMove) userOn.sliderFirstMove();
        dragMoved = true;
      },
      touchEnd(instance) {
        if (userOn.touchEnd) userOn.touchEnd(instance);
        window.setTimeout(() => {
          dragMoved = false;
        }, 80);
      }
    }
  });

  if (touchOpts.loop && imageCount > 0) {
    const normalizedInitial = ((initial % imageCount) + imageCount) % imageCount;
    moveSwiperTo(swiper, normalizedInitial, 0);
  } else if (imageCount > 0) {
    const normalizedInitial = ((initial % imageCount) + imageCount) % imageCount;
    moveSwiperTo(swiper, normalizedInitial, 0);
    if (mode === "lightbox" && typeof getImages === "function") {
      preloadJanaSlideNeighbors(getImages(), normalizedInitial);
    }
  }

  const getImageCount = () => (typeof getImages === "function" ? getImages().length : 0);

  if (mode === "lightbox") {
    attachJanaLightboxEdgeWrap(swiper, getImageCount, (index) => {
      if (onIndexChange) onIndexChange(index);
    });
  }

  return {
    swiper,
    getImageCount,
    rebuild() {
      const count = getImageCount();
      const safeIndex =
        count > 0 ? Math.min(Math.max(swiper.activeIndex, 0), count - 1) : 0;
      buildSlides(safeIndex);
      if (swiper.params.loop) {
        refreshSwiperLoop(swiper);
      }
      swiper.update();
      if (count > 0) {
        moveSwiperTo(swiper, safeIndex, 0);
        if (mode === "lightbox" && typeof getImages === "function") {
          preloadJanaSlideNeighbors(getImages(), safeIndex);
        }
      }
    },
    slideTo(index, speed) {
      const count = getImageCount();
      if (!count) return;
      const safeIndex = ((index % count) + count) % count;
      moveSwiperTo(swiper, safeIndex, speed ?? JANA_SWIPER_DEFAULTS.speed);
    },
    get activeIndex() {
      return getSwiperLogicalIndex(swiper);
    },
    getActiveImage() {
      return getSlideImage(swiper.slides[swiper.activeIndex]);
    },
    didDrag() {
      const moved = dragMoved;
      dragMoved = false;
      return moved;
    },
    destroy() {
      swiper.destroy(true, true);
    }
  };
}
