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
 * Desktop: rewind for arrow buttons, touch disabled via breakpoints.
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

  swiperInstance.on("touchEnd", () => {
    const count = getImageCount();
    if (count <= 1) return;

    const diff = swiperInstance.touches?.diff ?? 0;
    const idx = getSwiperLogicalIndex(swiperInstance);
    const wantsNext = diff < -LIGHTBOX_EDGE_WRAP_DRAG_THRESHOLD;
    const wantsPrev = diff > LIGHTBOX_EDGE_WRAP_DRAG_THRESHOLD;

    if (wantsNext && (swiperInstance.isEnd || idx >= count - 1)) {
      finishWrap(0);
      return;
    }
    if (wantsPrev && (swiperInstance.isBeginning || idx <= 0)) {
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
 * Hotel hero / room / lightbox carousels (replaces bindSwipeCarousel).
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
    if (isLightboxViewport) {
      attachJanaLightboxEdgeWrap(swiper, getSlideCount, (index) => {
        if (onIndexChange) onIndexChange(index);
      });
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
