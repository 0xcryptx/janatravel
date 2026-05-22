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
    errorEl.style.top = `${field.offsetTop + field.offsetHeight / 2}px`;
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

function isHotelActive(value) {
    if (value === false) return false;
    const normalized = String(value ?? '').toLowerCase().trim();
    if (!normalized) return true;
    return normalized !== 'false' && normalized !== 'no' && normalized !== '0';
}

function slugifyHotelName(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getCaseInsensitiveField(row, keys) {
    const keyMap = Object.keys(row || {}).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = key;
        return acc;
    }, {});
    for (const key of keys) {
        const normalized = key.toLowerCase().trim();
        if (keyMap[normalized]) return row[keyMap[normalized]];
    }
    return '';
}

function normalizeContactHotelRow(row) {
    if (row && row.slug && row.name) return row;
    const name = String(getCaseInsensitiveField(row, ['name', 'Name']) || '').trim();
    const rawSlug = String(getCaseInsensitiveField(row, ['slug', 'Slug']) || '').trim();
    return {
        ...row,
        name,
        slug: slugifyHotelName(rawSlug || name),
        active: getCaseInsensitiveField(row, ['active', 'Active'])
    };
}

function updateContactInterestOptions(hotels) {
    const interestSelect = document.getElementById('interest');
    if (!interestSelect) return;

    const dynamicHotels = Array.from(
        new Map(
            (Array.isArray(hotels) ? hotels : [])
                .filter((hotel) => hotel && isHotelActive(hotel.active) && String(hotel.name || '').trim())
                .map((hotel) => {
                    const name = String(hotel.name || '').trim();
                    const slug = String(hotel.slug || '').trim();
                    return [slug || name.toLowerCase(), { slug, name }];
                })
        ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    interestSelect.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a hotel';
    interestSelect.appendChild(placeholderOption);

    const anyHotelOption = document.createElement('option');
    anyHotelOption.value = 'any-hotel';
    anyHotelOption.textContent = 'Any hotel';
    interestSelect.appendChild(anyHotelOption);

    dynamicHotels.forEach((hotel) => {
        const option = document.createElement('option');
        option.value = hotel.slug || hotel.name;
        option.textContent = hotel.name;
        interestSelect.appendChild(option);
    });
}

async function loadContactInterestOptions() {
    try {
        const sourceUrl = (window.JANA_HOTELS_SHEET_URL || '').trim() || '/data/hotels.json';
        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) return;
        const rawHotels = await response.json();
        if (!Array.isArray(rawHotels)) return;
        const hotels = rawHotels.map((row) => normalizeContactHotelRow(row || {}));
        updateContactInterestOptions(hotels);
    } catch (error) {
        console.error('Failed to load hotel options for contact form:', error);
    }
}

(function initJanaContactIntlPhone() {
    const phoneInput = document.getElementById('contact-phone');
    const intlTelUtilsCdn = 'https://cdn.jsdelivr.net/npm/intl-tel-input@27.0.0/dist/js/utils.js';
    if (!phoneInput || typeof window.intlTelInput !== 'function') return;

    const narrowPopup = () => window.matchMedia('(max-width: 600px)').matches;
    const instance = window.intlTelInput(phoneInput, {
        initialCountry: 'ae',
        preferredCountries: ['ae', 'gb', 'us', 'sa', 'in'],
        separateDialCode: true,
        nationalMode: true,
        loadUtils: () => import(intlTelUtilsCdn),
        autoPlaceholder: 'aggressive',
        placeholderNumberType: 'MOBILE',
        formatAsYouType: true,
        formatOnDisplay: true,
        strictMode: true,
        countrySearch: true,
        ...(narrowPopup() ? { useFullscreenPopup: false } : {})
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
        const listEl = phoneInput.closest('.iti')?.querySelector('.iti__country-list');
        if (!listEl) return;
        const uae = listEl.querySelector('.iti__country[data-country-code="ae"]');
        if (!uae) return;
        listEl.querySelector('.iti__divider')?.remove();
        if (listEl.firstElementChild !== uae) listEl.insertBefore(uae, listEl.firstElementChild);
    }

    function syncDropdownHighlight() {
        if (!instance || !phoneInput) return;
        const iso2 = instance.getSelectedCountryData()?.iso2;
        const itiWrap = phoneInput.closest('.iti');
        const listEl = itiWrap?.querySelector('.iti__country-list');
        const selectedBtn = itiWrap?.querySelector('.iti__selected-country');
        if (!iso2 || !listEl || !selectedBtn) return;
        const target = listEl.querySelector('.iti__country[data-country-code="' + iso2 + '"]');
        if (!target) return;
        listEl.querySelectorAll('.iti__country.iti__highlight').forEach((li) => {
            li.classList.remove('iti__highlight');
            li.setAttribute('aria-selected', 'false');
        });
        target.classList.add('iti__highlight');
        target.setAttribute('aria-selected', 'true');
        selectedBtn.setAttribute('aria-activedescendant', target.getAttribute('id') || '');
        target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    function removeItiNativeHoverTooltips() {
        const itiWrap = phoneInput.closest('.iti');
        if (!itiWrap) return;
        itiWrap.querySelectorAll('[title]').forEach((el) => el.removeAttribute('title'));
    }

    if (instance.promise && typeof instance.promise.then === 'function') {
        instance.promise.then(() => {
            updatePhoneInputOffset();
            pinUaeToTop();
            removeItiNativeHoverTooltips();
        });
    }
    setTimeout(() => {
        updatePhoneInputOffset();
        pinUaeToTop();
        removeItiNativeHoverTooltips();
    }, 0);

    phoneInput.addEventListener('countrychange', () => {
        window.requestAnimationFrame(() => {
            updatePhoneInputOffset();
            pinUaeToTop();
            removeItiNativeHoverTooltips();
            if (phoneInput.classList.contains('is-error')) validatePhoneField();
        });
    });
    window.addEventListener('resize', updatePhoneInputOffset);

    const selCountry = phoneInput.closest('.iti')?.querySelector('.iti__selected-country');
    if (selCountry) {
        selCountry.addEventListener('click', () => {
            setTimeout(() => {
                pinUaeToTop();
                removeItiNativeHoverTooltips();
            }, 0);
        });
    }

    phoneInput.addEventListener('open:countrydropdown', () => {
        window.requestAnimationFrame(() => {
            syncDropdownHighlight();
            removeItiNativeHoverTooltips();
        });
    });

    const contactFormEl = phoneInput.closest('form');
    if (contactFormEl) {
        contactFormEl.addEventListener('reset', () => {
            setTimeout(() => {
                instance.setNumber('');
                instance.setCountry('ae');
                updatePhoneInputOffset();
            }, 0);
        });
    }
})();

const contactFormEl = document.querySelector('.contact-form');
const emailFieldEl = document.getElementById('email');
const phoneFieldEl = document.getElementById('contact-phone');

contactFormEl?.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
    }
    if (target.classList.contains('is-error')) clearFieldError(target);
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

phoneFieldEl?.addEventListener('blur', () => validatePhoneField());

phoneFieldEl?.addEventListener('input', function () {
    const value = String(this.value || '').trim();
    if (!value) {
        clearFieldError(this);
        return;
    }
    if (this.classList.contains('is-error')) validatePhoneField();
});

loadContactInterestOptions();
