function ensureFieldErrorEl(field) {
    if (!field) return null;
    const formGroup = field.closest('.form-group');
    if (!formGroup) return null;
    let errorEl = formGroup.querySelector('.field-error');
    if (errorEl) return errorEl;

    errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.innerHTML = `
        <span class="field-error__icon" tabindex="0" aria-label="Field error">
            !
            <span class="field-error__tooltip"></span>
        </span>
    `;
    formGroup.appendChild(errorEl);
    return errorEl;
}

function showFieldError(field, message) {
    if (!field) return;
    field.classList.add('is-error');
    const errorEl = ensureFieldErrorEl(field);
    if (!errorEl) return;
    errorEl.style.top = `${field.offsetTop + (field.offsetHeight / 2)}px`;
    errorEl.style.transform = 'translateY(-50%)';
    const tooltip = errorEl.querySelector('.field-error__tooltip');
    if (tooltip) tooltip.textContent = message || 'Please check this field.';
    errorEl.classList.add('is-visible');
}

function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('is-error');
    const errorEl = field.closest('.form-group')?.querySelector('.field-error');
    if (errorEl) errorEl.classList.remove('is-visible');
}

function validateContactField(field) {
    if (!field) return true;
    const tag = String(field.tagName || '').toLowerCase();
    const type = String(field.getAttribute('type') || '').toLowerCase();
    const isRequired = field.hasAttribute('required');
    const value = String(field.value || '').trim();

    if (tag !== 'select') field.value = value;
    clearFieldError(field);

    if (isRequired && !value) {
        showFieldError(field, 'This field is required.');
        return false;
    }

    if (type === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            showFieldError(field, 'Enter a valid email address (example: name@email.com).');
            return false;
        }
    }

    return true;
}

function validatePhoneField() {
    const phoneEl = document.getElementById('contact-phone');
    if (!phoneEl) return true;
    const digits = String(phoneEl.value || '').replace(/\D/g, '');

    if (!digits) {
        clearFieldError(phoneEl);
        return true;
    }

    const placeholderDigits = String(phoneEl.getAttribute('placeholder') || '').replace(/\D/g, '');
    if (placeholderDigits && digits.length !== placeholderDigits.length) {
        showFieldError(
            phoneEl,
            `Phone number must match this country's format (${placeholderDigits.length} digits).`
        );
        return false;
    }

    if (window.janaPhoneIti && window.intlTelInput && window.intlTelInput.utils) {
            const valid = window.janaPhoneIti.isValidNumber();
            if (valid === false) {
            showFieldError(phoneEl, 'Enter a valid phone number for the selected country.');
            return false;
        }
        clearFieldError(phoneEl);
    }

    return true;
}

// Form submission handler
function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const fields = Array.from(formEl.querySelectorAll('input, textarea, select'));
    let firstInvalid = null;

    fields.forEach((field) => {
        const isValid = validateContactField(field);
        if (!isValid && !firstInvalid) firstInvalid = field;
    });

    const phoneEl = document.getElementById('contact-phone');
    const phoneIsValid = validatePhoneField();
    if (!phoneIsValid && !firstInvalid && phoneEl) {
        firstInvalid = phoneEl;
    }

    if (firstInvalid) {
        firstInvalid.focus();
                return;
            }

    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData);
    if (window.janaPhoneIti && window.intlTelInput && window.intlTelInput.utils && phoneEl) {
        const digits = String(phoneEl.value || '').trim();
        if (digits) {
            const utils = window.intlTelInput.utils;
                const e164 = window.janaPhoneIti.getNumber(utils.numberFormat.E164);
                if (e164) data.phone = e164;
        }
    }

    alert('Thank you for your message, ' + data.firstName + '! Our team will contact you within 24 hours.');
    formEl.reset();
    fields.forEach(clearFieldError);
    if (window.janaPhoneIti) {
        window.janaPhoneIti.setNumber('');
        window.janaPhoneIti.setCountry('ae');
    }
}

const contactFormEl = document.querySelector('.contact-form');
const emailFieldEl = document.getElementById('email');
const phoneFieldEl = document.getElementById('contact-phone');

contactFormEl?.addEventListener('input', function (event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    if (target.classList.contains('is-error')) {
        clearFieldError(target);
    }
});

emailFieldEl?.addEventListener('blur', function () {
    const value = String(this.value || '').trim();
    this.value = value;
    if (!value) {
        clearFieldError(this);
        return;
    }
    validateContactField(this);
});

phoneFieldEl?.addEventListener('blur', function () {
    validatePhoneField();
});

phoneFieldEl?.addEventListener('input', function () {
    const value = String(this.value || '').trim();
    if (!value) {
        clearFieldError(this);
        return;
    }
    if (this.classList.contains('is-error')) {
        validatePhoneField();
    }
});

// Scroll animations


async function applyHotelJsonDataToContactPage() {
    const grid = document.getElementById('hotelsGrid');
    const loadingStateId = 'packagesLoadingState';
    const formatLoading = (message, percent) => {
        if (window.JanaLoadingProgress && typeof window.JanaLoadingProgress.formatLoadingText === 'function') {
            return window.JanaLoadingProgress.formatLoadingText(message, percent);
        }
        return `${String(message || 'Loading').replace(/\s*\.{3}\s*$/, '').trim()} ${Math.round(percent)}%`;
    };

    let packagesProgress = null;
    if (grid && window.JanaLoadingProgress) {
        grid.innerHTML = `<p class="packages-loading-state" id="${loadingStateId}">${formatLoading('Loading packages', 0)}</p>`;
        packagesProgress = window.JanaLoadingProgress.createLoadingProgress({
            baseMessage: 'Loading packages',
            estimateMs: 16000,
            onUpdate: (text) => {
                const el = document.getElementById(loadingStateId);
                if (el) el.textContent = text;
            }
        });
        packagesProgress.start();
        packagesProgress.setProgress(3);
    }

    try {
        const sourceUrl = (window.JANA_HOTELS_SHEET_URL || '').trim() || '/data/hotels.json';
        if (packagesProgress) packagesProgress.setProgress(10);
        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) {
            if (packagesProgress) packagesProgress.stop();
            return;
        }
        if (packagesProgress) packagesProgress.setProgress(28);
        const rawHotels = await response.json();
        if (!Array.isArray(rawHotels)) {
            if (packagesProgress) packagesProgress.stop();
            return;
        }
        const hotels = rawHotels.map(row => {
            if (row && (row.slug || row.name || row.description)) return row;
            return normalizeSheetHotel(row || {});
        });
        if (packagesProgress) packagesProgress.setProgress(38);
        const hotelTotal = hotels.length || 1;
        let hotelsPrepared = 0;
        const preparedHotels = await Promise.all(hotels.map(async (hotel) => {
            if (!hotel) return null;
            const slug = slugifyHotelName(hotel.slug || hotel.name || '');
            if (!slug || !String(hotel.name || '').trim() || !isHotelActive(hotel.active)) return null;
            const imageSet = await resolveHotelImageSet(slug);
            hotelsPrepared += 1;
            if (packagesProgress) {
                packagesProgress.setProgress(38 + Math.round((hotelsPrepared / hotelTotal) * 52));
            }
            if (!imageSet) return null;
            return {
                ...hotel,
                slug,
                imageBasePath: imageSet.basePath,
                imageUrl: String(hotel.imageUrl || '').trim() || imageSet.images[0],
                galleryImages: Array.isArray(hotel.galleryImages) && hotel.galleryImages.length
                    ? hotel.galleryImages
                    : [imageSet.images[0]]
            };
        }));
        if (packagesProgress) packagesProgress.setProgress(94);
        const validHotels = preparedHotels.filter(Boolean);
        const noResultsEl = document.getElementById('noResults');
        if (!validHotels.length) {
            const grid = document.getElementById('hotelsGrid');
            if (grid) grid.innerHTML = '';
            if (packagesProgress) packagesProgress.stop();
            updateContactInterestOptions([]);
            if (noResultsEl) {
                noResultsEl.style.display = 'block';
                const p = noResultsEl.querySelector('p');
                if (p) p.textContent = 'No hotel packages available yet. Add one from your form to display it here.';
            }
            return;
        }
        updateContactInterestOptions(validHotels);
        renderHotelCardsFromData(validHotels);
        if (packagesProgress) packagesProgress.complete();
        if (noResultsEl) noResultsEl.style.display = 'none';

        validHotels.forEach(hotel => {
            const key = HOTEL_SLUG_TO_DESTINATION_KEY[hotel.slug];
            if (!key) return;
            const gallery = Array.isArray(hotel.galleryImages) ? hotel.galleryImages.filter(Boolean) : [];
            const features = [
                hotel.mealPlan,
                hotel.reefType,
                hotel.islandSize,
                hotel.experience
            ].filter(Boolean);
            destinationOverrides[key] = {
                title: hotel.name || '',
                description: hotel.description || '',
                images: gallery.length ? gallery : [hotel.imageUrl || HOTEL_PLACEHOLDER_IMAGE],
                duration: hotel.experience || '',
                accommodation: hotel.rooms || '',
                transport: hotel.transferType || '',
                features
            };
        });

        syncDestinationOverridesIntoDestinations();
        if (typeof applyPackagesCatalogView === 'function') {
            applyPackagesCatalogView(false);
        }
        if (typeof filterHotels === 'function') {
            filterHotels();
        }
    } catch (error) {
        if (packagesProgress) packagesProgress.stop();
        console.error('Failed to load hotel JSON data for index:', error);
    }
}

syncDestinationOverridesIntoDestinations();
applyHotelJsonDataToContactPage();

// Ensure modal carousel images always load (avoid unreliable source.unsplash.com redirects).

applyHotelJsonDataToContactPage();


(function initJanaContactIntlPhone() {
    const phoneInput = document.getElementById('contact-phone');
    const intlTelUtilsCdn = 'https://cdn.jsdelivr.net/npm/intl-tel-input@27.0.0/dist/js/utils.js';
    if (!phoneInput || typeof window.intlTelInput !== 'function') return;

    const narrowPopup = () => window.matchMedia('(max-width: 600px)').matches;
    const instance = window.intlTelInput(phoneInput, {
        initialCountry: 'ae',
        countryOrder: ['ae'],
        separateDialCode: true,
        nationalMode: true,
        loadUtils: () => import(intlTelUtilsCdn),
        autoPlaceholder: 'aggressive',
        placeholderNumberType: 'MOBILE',
        formatAsYouType: true,
        formatOnDisplay: true,
        strictMode: true,
        countrySearch: false,
        ...(narrowPopup() ? { useFullscreenPopup: false } : {}),
    });
    window.janaPhoneIti = instance;

    function updatePhoneInputOffset() {
        const itiWrap = phoneInput.closest('.iti');
        const selected = itiWrap && itiWrap.querySelector('.iti__selected-country');
        if (!itiWrap || !selected) return;
        const measured = Math.ceil(selected.getBoundingClientRect().width);
        const offset = measured + 26;
        itiWrap.style.setProperty('--phone-input-offset', offset + 'px');
    }

    function pinUaeToTop() {
        const listEl = phoneInput.closest('.iti') && phoneInput.closest('.iti').querySelector('.iti__country-list');
        if (!listEl) return;
        const uae = listEl.querySelector('.iti__country[data-country-code="ae"]');
        if (!uae) return;
        const divider = listEl.querySelector('.iti__divider');
        if (divider) divider.remove();
        if (listEl.firstElementChild !== uae) listEl.insertBefore(uae, listEl.firstElementChild);
    }

    function syncDropdownHighlight() {
        if (!instance || !phoneInput) return;
        const iso2 = instance.getSelectedCountryData() && instance.getSelectedCountryData().iso2;
        const itiWrap = phoneInput.closest('.iti');
        const listEl = itiWrap && itiWrap.querySelector('.iti__country-list');
        const selectedBtn = itiWrap && itiWrap.querySelector('.iti__selected-country');
        if (!iso2 || !listEl || !selectedBtn) return;
        const target = listEl.querySelector('.iti__country[data-country-code="' + iso2 + '"]');
        if (!target) return;
        listEl.querySelectorAll('.iti__country.iti__highlight').forEach(function (li) {
            li.classList.remove('iti__highlight');
            li.setAttribute('aria-selected', 'false');
        });
        target.classList.add('iti__highlight');
        target.setAttribute('aria-selected', 'true');
        const activeId = target.getAttribute('id') || '';
        selectedBtn.setAttribute('aria-activedescendant', activeId);
        target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    function removeItiNativeHoverTooltips() {
        const itiWrap = phoneInput.closest('.iti');
        if (!itiWrap) return;
        itiWrap.querySelectorAll('[title]').forEach(function (el) {
            el.removeAttribute('title');
        });
    }

    if (instance.promise && typeof instance.promise.then === 'function') {
        instance.promise.then(function () {
            updatePhoneInputOffset();
            pinUaeToTop();
            removeItiNativeHoverTooltips();
        });
    }
    setTimeout(function () {
        updatePhoneInputOffset();
        pinUaeToTop();
        removeItiNativeHoverTooltips();
    }, 0);

    phoneInput.addEventListener('countrychange', function () {
        window.requestAnimationFrame(function () {
            updatePhoneInputOffset();
            pinUaeToTop();
            removeItiNativeHoverTooltips();
        });
    });
    window.addEventListener('resize', updatePhoneInputOffset);

    var selCountry = phoneInput.closest('.iti') && phoneInput.closest('.iti').querySelector('.iti__selected-country');
    if (selCountry) {
        selCountry.addEventListener('click', function () {
            setTimeout(function () {
                pinUaeToTop();
                removeItiNativeHoverTooltips();
            }, 0);
        });
    }

    phoneInput.addEventListener('open:countrydropdown', function () {
        window.requestAnimationFrame(function () {
            syncDropdownHighlight();
            removeItiNativeHoverTooltips();
        });
    });

    var contactFormEl = phoneInput.closest('form');
    if (contactFormEl) {
        contactFormEl.addEventListener('reset', function () {
            setTimeout(function () {
                instance.setNumber('');
                instance.setCountry('ae');
                updatePhoneInputOffset();
            }, 0);
        });
    }
})();