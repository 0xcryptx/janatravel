import {
    HOTEL_IMAGE_ROOT,
    getListingImageLogicalPath,
    resolveListingImageSet
} from './hotel-image-probe.js';
import {
    getAddImageLogicalPath,
    resolveHotelImageUrl
} from './hotel-cloudinary.js';

const destinations = {
    male: {
        title: 'Malé Atoll',
        images: [
            'https://images.unsplash.com/photo-1540202404-a2f29016b523?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Malé Atoll is the heart of the Maldives, home to the vibrant capital city and some of the most stunning islands in the archipelago. This atoll offers the perfect blend of cultural experiences and natural beauty, with crystal-clear lagoons, pristine beaches, and world-renowned diving spots. Explore local markets, historical mosques, and enjoy easy access to luxury resorts just minutes from the capital.',
        features: [
            'Round-trip flights included',
            '5 nights luxury resort stay',
            'Daily breakfast & dinner',
            'Airport transfers',
            'Snorkeling equipment',
            'Island hopping tour',
            'Sunset dolphin cruise',
            'Spa credit included'
        ],
        duration: '6 Days / 5 Nights',
        accommodation: '5-Star Overwater Villa',
        transport: 'Speedboat Transfer'
    },
    baa: {
        title: 'Baa Atoll',
        images: [
            'https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Baa Atoll is a UNESCO World Biosphere Reserve, famous for Hanifaru Bay where manta rays and whale sharks gather in spectacular numbers. This pristine atoll offers some of the best marine experiences in the world, with untouched coral reefs, abundant marine life, and exclusive eco-friendly resorts. Perfect for nature lovers and underwater enthusiasts seeking an extraordinary adventure.',
        features: [
            'Round-trip flights included',
            '7 nights eco-resort stay',
            'Full board meals',
            'Seaplane transfers',
            'Manta ray excursion',
            'Guided reef snorkeling',
            'Night fishing trip',
            'Marine biologist tour'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Eco-Luxury Beach Villa',
        transport: 'Seaplane Transfer'
    },
    ari: {
        title: 'Ari Atoll',
        images: [
            'https://images.unsplash.com/photo-1551918120-9739cb430c6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1578922746465-3a80a228f223?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1512100356356-de1b84283e18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1580541631950-7282082b03fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Ari Atoll is renowned for its stunning overwater villas, breathtaking sunsets, and exceptional diving opportunities. Home to some of the most exclusive resorts in the Maldives, this atoll offers year-round whale shark sightings, pristine beaches, and unparalleled luxury. Whether you\'re seeking romance, adventure, or pure relaxation, Ari Atoll delivers an unforgettable experience.',
        features: [
            'Round-trip flights included',
            '7 nights overwater villa',
            'All-inclusive package',
            'Seaplane transfers',
            'Whale shark adventure',
            'Private sandbank picnic',
            'Couples spa treatment',
            'Sunset yacht cruise'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Premium Overwater Suite',
        transport: 'Luxury Seaplane'
    },
    family: {
        title: 'Family Paradise Resort',
        images: [
            'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'The perfect family getaway! Our Family Paradise Resort features shallow lagoons safe for children, an exciting kids club with daily activities, and family-friendly dining options. Parents can relax knowing their children are having the time of their lives while enjoying their own peaceful moments.',
        features: [
            'Round-trip flights for family',
            '5 nights family villa',
            'Kids club access',
            'Family activities daily',
            'Shallow lagoon beach',
            'Child-friendly meals',
            'Babysitting service',
            'Water sports for all ages'
        ],
        duration: '6 Days / 5 Nights',
        accommodation: 'Family Beach Villa',
        transport: 'Speedboat Transfer'
    },
    honeymoon: {
        title: 'Honeymoon Paradise',
        images: [
            'https://images.unsplash.com/photo-1578922746465-3a80a228f223?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1551918120-9739cb430c6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1580541631950-7282082b03fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1512100356356-de1b84283e18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Begin your forever in paradise! This ultimate romantic escape features a private pool villa over crystal-clear waters, intimate couples spa treatments, candlelit beach dinners, and sunset cruises. Every detail is crafted to celebrate your love.',
        features: [
            'Round-trip flights included',
            '7 nights private pool villa',
            'Couples spa package',
            'Private beach dinner',
            'Sunset champagne cruise',
            'In-villa breakfast daily',
            'Romantic turndown service',
            'Photography session'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Private Pool Villa',
        transport: 'Seaplane Transfer'
    },
    diving: {
        title: 'Diving Adventure',
        images: [
            'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Dive into adventure! Explore vibrant coral reefs, swim alongside manta rays and whale sharks, and discover the underwater wonders of the Maldives. Perfect for certified divers and those wanting to learn, with PADI-certified instructors available.',
        features: [
            'Round-trip flights included',
            '6 nights dive resort stay',
            '10 guided dive sessions',
            'All equipment included',
            'Manta ray night dive',
            'Underwater photography',
            'PADI certification available',
            'Marine life guide'
        ],
        duration: '7 Days / 6 Nights',
        accommodation: 'Dive Resort Room',
        transport: 'Speedboat Transfer'
    },
    lhaviyani: {
        title: 'Lhaviyani Atoll',
        images: [
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Lhaviyani Atoll offers pristine uninhabited islands, spectacular diving sites, and exclusive resort experiences. Known for its shipwreck diving and vibrant marine life, this atoll is perfect for those seeking adventure and tranquility.',
        features: [
            'Round-trip flights included',
            '6 nights luxury resort stay',
            'All-inclusive dining',
            'Seaplane transfers',
            'Shipwreck diving tour',
            'Private island picnic',
            'Sunset fishing trip',
            'Spa treatments included'
        ],
        duration: '7 Days / 6 Nights',
        accommodation: 'Beachfront Villa',
        transport: 'Seaplane Transfer'
    },
    raa: {
        title: 'Raa Atoll',
        images: [
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1540202404-a2f29016b523?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Raa Atoll is home to some of the most exclusive and remote resorts in the Maldives. Experience ultimate privacy, world-class service, and untouched natural beauty in this hidden paradise.',
        features: [
            'Round-trip flights included',
            '7 nights exclusive resort stay',
            'Butler service',
            'Seaplane transfers',
            'Private dining experiences',
            'Personalized excursions',
            'Unlimited spa access',
            'Yacht day trip'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Presidential Suite',
        transport: 'Private Seaplane'
    },
    wellness: {
        title: 'Wellness Retreat',
        images: [
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Rejuvenate your mind, body, and soul at our exclusive wellness retreat. Featuring daily yoga sessions, meditation classes, spa treatments, and healthy gourmet cuisine in a serene island setting.',
        features: [
            'Round-trip flights included',
            '7 nights wellness resort stay',
            'Daily yoga & meditation',
            'Unlimited spa treatments',
            'Healthy gourmet meals',
            'Personal wellness coach',
            'Sound healing sessions',
            'Beach fitness classes'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Wellness Villa',
        transport: 'Speedboat Transfer'
    },
    budget: {
        title: 'Budget Paradise',
        images: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Experience the magic of Maldives without breaking the bank! Our budget-friendly package includes comfortable guesthouse stays on local islands, authentic Maldivian experiences, and stunning beaches.',
        features: [
            'Round-trip flights included',
            '4 nights guesthouse stay',
            'Daily breakfast',
            'Speedboat transfers',
            'Snorkeling trip',
            'Local island tour',
            'Sunset cruise',
            'Beach barbecue dinner'
        ],
        duration: '5 Days / 4 Nights',
        accommodation: 'Beach Guesthouse',
        transport: 'Speedboat Transfer'
    },
    photography: {
        title: 'Photography Tour',
        images: [
            'https://images.unsplash.com/photo-1551918120-9739cb430c6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1578922746465-3a80a228f223?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Capture the breathtaking beauty of the Maldives with our exclusive photography tour. Led by professional photographers, explore the most photogenic locations above and below water.',
        features: [
            'Round-trip flights included',
            '6 nights resort stay',
            'Professional photo guide',
            'Sunrise & sunset shoots',
            'Underwater photography',
            'Drone photography session',
            'Post-processing workshop',
            'Portfolio review'
        ],
        duration: '7 Days / 6 Nights',
        accommodation: 'Overwater Bungalow',
        transport: 'Seaplane Transfer'
    },
    surfing: {
        title: 'Surfing Safari',
        images: [
            'https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Ride the perfect waves of the Maldives! Our surfing safari takes you to the best breaks in the atolls, suitable for beginners and experienced surfers alike.',
        features: [
            'Round-trip flights included',
            '7 nights surf resort stay',
            'Daily surf sessions',
            'Surf guide included',
            'Board rental',
            'Boat trips to breaks',
            'Video analysis',
            'Sunset sessions'
        ],
        duration: '8 Days / 7 Nights',
        accommodation: 'Surf Lodge',
        transport: 'Speedboat Transfer'
    }
};

// Hotel package details are loaded from data/hotels.json (not hardcoded in HTML).
const destinationOverrides = {};
const HOTEL_SLUG_TO_DESTINATION_KEY = {
    'niyama-private-islands-maldives': 'male',
    'kandima-maldives': 'baa',
    'waldorf-astoria-maldives-ithaafushi': 'ari',
    'jumeirah-olhahali-island': 'family',
    'intercontinental-maldives-maamunagau-resort': 'honeymoon',
    'radisson-blu-resort-maldives': 'diving'
};

function syncDestinationOverridesIntoDestinations() {
Object.keys(destinationOverrides).forEach(key => {
    destinations[key] = {
        ...(destinations[key] || {}),
        ...destinationOverrides[key]
    };
});
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

function normalizeGalleryImages(rawValue) {
    if (Array.isArray(rawValue)) return rawValue.filter(Boolean);
    if (typeof rawValue !== 'string') return [];
    return rawValue.split(/\||\n/).map(item => item.trim()).filter(Boolean);
}

function parseFeaturedValue(value) {
    const normalized = String(value || '').toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1';
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

function isHotelActive(value) {
    if (value === false) return false;
    const normalized = String(value ?? '').toLowerCase().trim();
    if (!normalized) return true;
    return normalized !== 'false' && normalized !== 'no' && normalized !== '0';
}

function resolveHotelImageSet(slug) {
    return resolveListingImageSet(slug);
}

function escapeAttr(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;');
}

function hotelCardImageFallback(img) {
    if (!img) return;
    let fallbacks = [];
    try {
        fallbacks = JSON.parse(img.dataset.fallbacks || '[]');
    } catch (error) {
        fallbacks = [];
    }
    const next = fallbacks.shift();
    if (next) {
        img.dataset.fallbacks = JSON.stringify(fallbacks);
        img.src = next;
        return;
    }
    img.onerror = null;
    img.src = HOTEL_PLACEHOLDER_IMAGE;
}

if (typeof window !== 'undefined') {
    window.janaHotelCardImageFallback = hotelCardImageFallback;
}

function normalizeSheetHotel(row) {
    const name = String(getCaseInsensitiveField(row, ['name', 'Name']) || '').trim();
    const rawSlug = String(getCaseInsensitiveField(row, ['slug', 'Slug']) || '').trim();
    const slug = slugifyHotelName(rawSlug || name);
    return {
        slug,
        name,
        active: getCaseInsensitiveField(row, ['active', 'Active']),
        smallDescription: getCaseInsensitiveField(row, ['smallDescription', 'Small Description', 'Short Description']),
        destination: getCaseInsensitiveField(row, ['destination', 'Destination']),
        location: getCaseInsensitiveField(row, ['location', 'Location']),
        rating: getCaseInsensitiveField(row, ['rating', 'Rating']),
        islandSize: getCaseInsensitiveField(row, ['islandSize', 'Island Size', 'Island size', 'island size']),
        reefType: getCaseInsensitiveField(row, ['reefType', 'Reef Type']),
        experience: getCaseInsensitiveField(row, ['experience', 'Experience']),
        mealPlan: getCaseInsensitiveField(row, ['mealPlan', 'Meal Plan']),
        rooms: getCaseInsensitiveField(row, ['rooms', 'Rooms', 'No. of Rooms', 'No Of Rooms', 'No.of Rooms', 'Number of Rooms', '# of Rooms', '# of rooms']),
        restaurants: getCaseInsensitiveField(row, ['restaurants', 'Restaurants', 'No. of Restaurants', 'No Of Restaurants', 'No.of Restaurants', 'Number of Restaurants', '# of Restaurants']),
        bars: getCaseInsensitiveField(row, ['bars', 'Bars', 'No. of Bars', 'No Of Bars', 'No.of Bars', 'Number of Bars', '# of Bars']),
        transferType: getCaseInsensitiveField(row, ['transferType', 'Transfer Type']),
        description: getCaseInsensitiveField(row, ['description', 'Description']),
        imageUrl: getCaseInsensitiveField(row, ['imageUrl', 'Image URL']),
        galleryImages: normalizeGalleryImages(getCaseInsensitiveField(row, ['galleryImages', 'Gallery Images'])),
        whatsappMessage: getCaseInsensitiveField(row, ['whatsappMessage', 'WhatsApp Message']),
        featured: parseFeaturedValue(getCaseInsensitiveField(row, ['featured', 'Featured']))
    };
}

const TRIP_TYPE_VALUES = [
    'all-inclusive-holidays',
    'family-holidays',
    'honeymoon-couples',
    'private-island-escapes',
    'wellness-retreats',
    'luxury-beach-holidays',
    'adventure-water-sports'
];

const TRIP_TYPE_PATTERNS = [
    { id: 'all-inclusive-holidays', test: (text) => /all[\s-]?inclusive/.test(text) },
    { id: 'family-holidays', test: (text) => /\bfamily\b|\bkids\b|children/.test(text) },
    { id: 'honeymoon-couples', test: (text) => /honeymoon|\bcouples?\b/.test(text) },
    { id: 'private-island-escapes', test: (text) => /private\s*island/.test(text) },
    { id: 'wellness-retreats', test: (text) => /wellness|spa\s*retreat/.test(text) },
    { id: 'luxury-beach-holidays', test: (text) => /luxury\s*beach|\bluxury\b/.test(text) },
    { id: 'adventure-water-sports', test: (text) => /adventure|water\s*sport|\bdiving\b|snorkel/.test(text) }
];

function getHotelSearchText(hotel) {
    return [
        hotel.experience,
        hotel.smallDescription,
        hotel.shortDescription,
        hotel.description,
        hotel.name,
        hotel.slug
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function inferExperienceTags(hotel) {
    const tags = new Set();
    const experienceRaw = String(hotel.experience || '').trim();

    experienceRaw
        .split(/[,;|\n]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .forEach((token) => {
            const asSlug = token
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (TRIP_TYPE_VALUES.includes(token)) tags.add(token);
            if (TRIP_TYPE_VALUES.includes(asSlug)) tags.add(asSlug);
        });

    const searchText = getHotelSearchText(hotel);
    TRIP_TYPE_PATTERNS.forEach(({ id, test }) => {
        if (test(searchText)) tags.add(id);
    });

    const slug = String(hotel.slug || '').toLowerCase();
    const destinationKey = HOTEL_SLUG_TO_DESTINATION_KEY[slug];
    if (destinationKey === 'family') tags.add('family-holidays');
    if (destinationKey === 'honeymoon') tags.add('honeymoon-couples');
    if (destinationKey === 'diving') tags.add('adventure-water-sports');

    return Array.from(tags);
}

function cardMatchesTripType(card, tripType) {
    if (!tripType || tripType === 'all') return true;
    const typeTags = (card.dataset.type || '').split('|').filter(Boolean);
    if (typeTags.includes(tripType)) return true;
    const searchText = (card.dataset.searchText || '').toLowerCase();
    const pattern = TRIP_TYPE_PATTERNS.find((entry) => entry.id === tripType);
    return pattern ? pattern.test(searchText) : false;
}

function inferKidsAllowed(hotel) {
    const text = `${hotel.experience || ''} ${hotel.description || ''}`.toLowerCase();
    return text.includes('family') || text.includes('kids') || text.includes('children');
}

function inferMaxTravelers(hotel, experienceTags) {
    if (typeof hotel.maxTravelers === 'number' && hotel.maxTravelers > 0) return hotel.maxTravelers;
    return Array.isArray(experienceTags) && experienceTags.includes('family-holidays') ? 4 : 2;
}

const HOTEL_PLACEHOLDER_IMAGE = '/assets/images/add_image.webp';

function renderHotelCardsFromData(hotels) {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const sorted = [...hotels].sort((a, b) => {
        const af = a.featured ? 1 : 0;
        const bf = b.featured ? 1 : 0;
        if (af !== bf) return bf - af;
        return (a.name || '').localeCompare(b.name || '');
    });

    sorted.forEach((hotel, index) => {
        const slug = hotel.slug || '';
        if (!slug) return;
        const cardDescription = String(
            hotel.smallDescription || hotel.shortDescription || hotel.description || ''
        ).trim() || 'Discover this curated stay with JANA Travel.';
        const experienceTags = inferExperienceTags(hotel);
        const primaryTag = experienceTags[0] || 'luxury-beach-holidays';
        const kidsAllowed = inferKidsAllowed(hotel);
        const maxTravelers = inferMaxTravelers(hotel, experienceTags);
        const logicalImage = hotel.imageUrl || getListingImageLogicalPath(slug);
        const imgSrc = resolveHotelImageUrl(logicalImage, 'card') || HOTEL_PLACEHOLDER_IMAGE;
        const cardFallbacks = [
            resolveHotelImageUrl(getAddImageLogicalPath(slug), 'card')
        ].filter((url) => url && url !== imgSrc);
        const isFeatured = Boolean(hotel.featured);
        const isPriority = index < 4;
        const loadingAttr = isPriority ? 'eager' : 'lazy';
        const priorityAttr = isPriority ? ' fetchpriority="high"' : '';

        const card = document.createElement('div');
        card.className = `destination-card fade-in${isFeatured ? '' : ' extra-destination'}`;
        card.dataset.hotelSlug = slug;
        card.dataset.price = String(hotel.price || (primaryTag === 'luxury-beach-holidays' ? 2399 : primaryTag === 'family-holidays' ? 1999 : 1799));
        card.dataset.type = experienceTags.join('|');
        card.dataset.searchText = getHotelSearchText(hotel);
        card.dataset.kids = String(kidsAllowed);
        card.dataset.travelers = String(maxTravelers);
        card.dataset.country = String(hotel.destination || '').toLowerCase();
        card.setAttribute('onclick', `window.location.href='/hotels/package/?id=${encodeURIComponent(slug)}'`);
        card.innerHTML = `
            <img src="${imgSrc}" alt="${hotel.name || 'Hotel package'}" loading="${loadingAttr}" decoding="async"${priorityAttr} sizes="(max-width: 768px) 100vw, 480px" data-fallbacks="${escapeAttr(JSON.stringify(cardFallbacks))}" onerror="window.janaHotelCardImageFallback&&window.janaHotelCardImageFallback(this)">
            <div class="destination-info">
                <h4>${hotel.name || 'Hotel package'}</h4>
                <p>${cardDescription}</p>
                <div class="destination-price">
                    <button class="book-btn">View Details</button>
                </div>
            </div>
        `;
        card.classList.add('visible');
        if (window.janaFadeObserver && typeof window.janaFadeObserver.observe === 'function') {
            window.janaFadeObserver.observe(card);
        }
        grid.appendChild(card);
    });
}

function updateContactInterestOptions(hotels) {
    const interestSelect = document.getElementById('interest');
    if (!interestSelect) return;

    const dynamicHotels = Array.from(
        new Map(
            (Array.isArray(hotels) ? hotels : [])
                .filter(hotel => hotel && isHotelActive(hotel.active) && String(hotel.name || '').trim())
                .map(hotel => {
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

    dynamicHotels.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.slug || hotel.name;
        option.textContent = hotel.name;
        interestSelect.appendChild(option);
    });
}

const HOTELS_LOADING_STATE_ID = 'hotelsLoadingState';
const HOTELS_JSON_FALLBACK_URL = '/data/hotels.json';
const HOTELS_SHEET_FETCH_TIMEOUT_MS = 8000;
const HOTELS_FETCH_MAX_ATTEMPTS = 3;
const HOTELS_LIST_CACHE_KEY = 'jana:hotelsListCache';
const HOTELS_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
let hotelsPageLoadPromise = null;

function isHotelsGridLoading() {
    return Boolean(document.getElementById(HOTELS_LOADING_STATE_ID));
}

function setHotelsGridLoading(isLoading) {
    const grid = document.getElementById('hotelsGrid');
    const noResultsEl = document.getElementById('noResults');
    if (grid) grid.classList.toggle('hotels-grid--loading', Boolean(isLoading));
    if (isLoading && noResultsEl) noResultsEl.style.display = 'none';
}

function readHotelsListCache() {
    try {
        const raw = sessionStorage.getItem(HOTELS_LIST_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.hotels) || Number(parsed.expiresAt) < Date.now()) {
            sessionStorage.removeItem(HOTELS_LIST_CACHE_KEY);
            return null;
        }
        return parsed.hotels;
    } catch (error) {
        return null;
    }
}

function writeHotelsListCache(hotels) {
    try {
        sessionStorage.setItem(
            HOTELS_LIST_CACHE_KEY,
            JSON.stringify({
                hotels,
                expiresAt: Date.now() + HOTELS_LIST_CACHE_TTL_MS
            })
        );
    } catch (error) {
        // Ignore storage failures.
    }
}

async function fetchHotelsJsonOnce(url) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HOTELS_SHEET_FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid hotels payload');
        return data;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function fetchHotelsJsonWithFallback() {
    const sheetUrl = (window.JANA_HOTELS_SHEET_URL || '').trim();
    const sources = [];
    if (sheetUrl) sources.push(sheetUrl);
    if (!sources.includes(HOTELS_JSON_FALLBACK_URL)) sources.push(HOTELS_JSON_FALLBACK_URL);

    let lastError = null;
    for (const url of sources) {
        for (let attempt = 0; attempt < HOTELS_FETCH_MAX_ATTEMPTS; attempt += 1) {
            try {
                const data = await fetchHotelsJsonOnce(url);
                if (data.length || url === sheetUrl) return data;
                if (url === HOTELS_JSON_FALLBACK_URL) return data;
            } catch (error) {
                lastError = error;
                if (attempt < HOTELS_FETCH_MAX_ATTEMPTS - 1) {
                    await new Promise((resolve) => window.setTimeout(resolve, 450 * (attempt + 1)));
                }
            }
        }
    }
    throw lastError || new Error('Failed to load hotels');
}

function prepareHotelsFromRows(rawHotels) {
    const hotels = rawHotels.map((row) => {
        if (row && (row.slug || row.name || row.description)) return row;
        return normalizeSheetHotel(row || {});
    });
    return hotels
        .map((hotel) => {
            if (!hotel) return null;
            const slug = slugifyHotelName(hotel.slug || hotel.name || '');
            if (!slug || !String(hotel.name || '').trim() || !isHotelActive(hotel.active)) return null;
            const imageSet = resolveHotelImageSet(slug);
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
        })
        .filter(Boolean);
}

function countDisplayedHotelCards() {
    return Array.from(document.querySelectorAll('.destination-card')).filter((card) => {
        if (card.classList.contains('hidden')) return false;
        return window.getComputedStyle(card).display !== 'none';
    }).length;
}

function ensureCatalogHasVisibleCards() {
    const totalCards = document.querySelectorAll('.destination-card').length;
    if (!totalCards) return;
    if (countDisplayedHotelCards() > 0) return;
    // Keep Featured when opened from nav; only auto-expand for ?view=all or empty-state fallback.
    if (packagesNavScope === 'featured' && getPackagesUrlView() !== 'all') return;

    packagesNavScope = 'all';
    setAllPackagesCountriesSelected();
    updatePackagesCountryFilterUi();
    updatePackagesNavTabs();
    applyPackagesCatalogView(true);
}

function applyDestinationOverrides(validHotels) {
    validHotels.forEach((hotel) => {
        const key = HOTEL_SLUG_TO_DESTINATION_KEY[hotel.slug];
        if (!key) return;
        const gallery = Array.isArray(hotel.galleryImages) ? hotel.galleryImages.filter(Boolean) : [];
        const features = [hotel.mealPlan, hotel.reefType, hotel.islandSize, hotel.experience].filter(Boolean);
        destinationOverrides[key] = {
            title: hotel.name || '',
            description: hotel.description || '',
            images: gallery.length
                ? gallery.map((src) => resolveHotelImageUrl(src, 'default'))
                : [resolveHotelImageUrl(hotel.imageUrl, 'default') || HOTEL_PLACEHOLDER_IMAGE],
            duration: hotel.experience || '',
            accommodation: hotel.rooms || '',
            transport: hotel.transferType || '',
            features
        };
    });
    syncDestinationOverridesIntoDestinations();
}

function finishHotelsCatalogView() {
    if (typeof restorePackagesViewState === 'function') {
        restorePackagesViewState();
    } else if (typeof applyPackagesCatalogView === 'function') {
        applyPackagesCatalogView(false);
    } else if (typeof filterHotels === 'function') {
        filterHotels();
    }
    ensureCatalogHasVisibleCards();
}

function publishHotelsToGrid(validHotels, options = {}) {
    const grid = document.getElementById('hotelsGrid');
    const noResultsEl = document.getElementById('noResults');
    if (!validHotels.length) {
        if (grid) grid.innerHTML = '';
        setHotelsGridLoading(false);
        updateContactInterestOptions([]);
        if (noResultsEl) {
            noResultsEl.style.display = 'block';
            const p = noResultsEl.querySelector('p');
            if (p) p.textContent = 'No hotels available yet. Add one from your form to display it here.';
        }
        return false;
    }

    updateContactInterestOptions(validHotels);
    renderHotelCardsFromData(validHotels);
    setHotelsGridLoading(false);
    if (noResultsEl) noResultsEl.style.display = 'none';
    applyDestinationOverrides(validHotels);
    if (!options.deferViewRestore) {
        finishHotelsCatalogView();
    }
    return true;
}

function showHotelsGridLoadingUi() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return null;

    const formatLoading = (message, percent) => {
        if (window.JanaLoadingProgress && typeof window.JanaLoadingProgress.formatLoadingText === 'function') {
            return window.JanaLoadingProgress.formatLoadingText(message, percent);
        }
        return `${String(message || 'Loading').replace(/\s*\.{3}\s*$/, '').trim()} ${Math.round(percent)}%`;
    };

    setHotelsGridLoading(true);
    const showLoadingText = (text) => {
        const el = document.getElementById(HOTELS_LOADING_STATE_ID);
        if (el) el.textContent = text;
    };

    if (!window.JanaLoadingProgress) {
        grid.innerHTML = `<p class="packages-loading-state" id="${HOTELS_LOADING_STATE_ID}">Loading hotels…</p>`;
        return null;
    }

    grid.innerHTML = `<p class="packages-loading-state" id="${HOTELS_LOADING_STATE_ID}">${formatLoading('Loading hotels', 0)}</p>`;
    const hotelsProgress = window.JanaLoadingProgress.createLoadingProgress({
        baseMessage: 'Loading hotels',
        estimateMs: 6000,
        onUpdate: (text) => showLoadingText(text)
    });
    hotelsProgress.start();
    hotelsProgress.setProgress(5);
    return hotelsProgress;
}

async function loadHotelsPageData() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;

    const cachedRows = readHotelsListCache();
    let hotelsProgress = null;
    let showedCards = false;

    if (cachedRows && cachedRows.length) {
        const cachedHotels = prepareHotelsFromRows(cachedRows);
        if (cachedHotels.length) {
            publishHotelsToGrid(cachedHotels, { deferViewRestore: true });
            showedCards = true;
        }
    }

    if (!showedCards) {
        hotelsProgress = showHotelsGridLoadingUi();
    }

    try {
        if (hotelsProgress) hotelsProgress.setProgress(15);
        const rawHotels = await fetchHotelsJsonWithFallback();
        if (hotelsProgress) hotelsProgress.setProgress(70);
        writeHotelsListCache(rawHotels);
        const validHotels = prepareHotelsFromRows(rawHotels);
        if (hotelsProgress) hotelsProgress.setProgress(92);

        if (!validHotels.length) {
            publishHotelsToGrid([], {});
            return;
        }

        publishHotelsToGrid(validHotels, { deferViewRestore: true });
        showedCards = true;
    } catch (error) {
        console.error('Failed to load hotel JSON data for hotels page:', error);
        if (!showedCards) {
            setHotelsGridLoading(false);
            grid.innerHTML = `<p class="packages-loading-state">Unable to load hotels. <button type="button" class="filter-btn secondary" onclick="window.retryHotelsCatalogLoad&&window.retryHotelsCatalogLoad()">Try again</button></p>`;
            const noResultsEl = document.getElementById('noResults');
            if (noResultsEl) noResultsEl.style.display = 'none';
        }
    } finally {
        if (hotelsProgress) {
            hotelsProgress.complete();
            hotelsProgress.stop();
        }
        if (showedCards) {
            finishHotelsCatalogView();
        }
    }
}

function applyHotelJsonDataToHotelsPage() {
    if (!hotelsPageLoadPromise) {
        hotelsPageLoadPromise = loadHotelsPageData();
    }
    return hotelsPageLoadPromise;
}

function retryHotelsCatalogLoad() {
    hotelsPageLoadPromise = null;
    try {
        sessionStorage.removeItem(HOTELS_LIST_CACHE_KEY);
    } catch (error) {
        // Ignore storage failures.
    }
    return applyHotelJsonDataToHotelsPage();
}

if (typeof window !== 'undefined') {
    window.retryHotelsCatalogLoad = retryHotelsCatalogLoad;
}

syncDestinationOverridesIntoDestinations();

// Ensure modal carousel images always load (avoid unreliable source.unsplash.com redirects).
const destinationFallbackImages = [
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200&q=80',
    'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1200&q=80'
];
Object.keys(destinationOverrides).forEach(key => {
    const imgs = destinations[key] && destinations[key].images ? destinations[key].images : [];
    const hasSourceUnsplash = Array.isArray(imgs) && imgs.some(img => typeof img === 'string' && img.includes('source.unsplash.com'));
    if (hasSourceUnsplash) {
        destinations[key].images = destinationFallbackImages;
    }
});

// Filter state (form; grid does not use these until Search)
/** Snapshot applied when "Search Packages" runs; grid filtering reads these only. */
let appliedTripType = 'all';
let appliedCountry = 'all';
/** 'featured' | 'all' when browsing catalog; null after Search (tabs visually inactive). */
let packagesNavScope = 'featured';

const PACKAGES_VIEW_STATE_STORAGE_KEY = 'jana:hotelsCatalogView';

function getPackagesUrlView() {
    if (typeof window === 'undefined') return '';
    return String(new URLSearchParams(window.location.search).get('view') || '')
        .trim()
        .toLowerCase();
}

// We re-render cards async on every visit, so the browser's native scroll restoration
// often fires before content height matches and lands in the wrong place. Take over.
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

function savePackagesViewState() {
    try {
        const snapshot = {
            scope: packagesNavScope,
            countries: Array.from(selectedPackagesCountries || []),
            tripType: appliedTripType,
            country: appliedCountry,
            scrollY: typeof window !== 'undefined' ? Math.round(window.scrollY || window.pageYOffset || 0) : 0
        };
        sessionStorage.setItem(PACKAGES_VIEW_STATE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
        // Storage may be unavailable (private mode, quota); silently ignore.
    }
}

if (typeof window !== 'undefined') {
    // Snapshot scroll on the way out so back-navigation can land in the same spot.
    const snapshotOnLeave = () => savePackagesViewState();
    window.addEventListener('pagehide', snapshotOnLeave);
    window.addEventListener('beforeunload', snapshotOnLeave);
    document.addEventListener(
        'click',
        (event) => {
            const card = event.target && event.target.closest && event.target.closest('.destination-card[data-hotel-slug]');
            if (card) snapshotOnLeave();
        },
        true
    );
}

function loadPackagesViewState() {
    try {
        const raw = sessionStorage.getItem(PACKAGES_VIEW_STATE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        return null;
    }
}

function restorePackagesViewState() {
    const urlView = getPackagesUrlView();
    const saved = loadPackagesViewState();

    // Restore country chip selection (defaults to all if missing/invalid).
    if (saved && Array.isArray(saved.countries) && saved.countries.length) {
        const valid = saved.countries.filter((c) => PACKAGE_COUNTRY_OPTIONS.includes(c));
        selectedPackagesCountries = valid.length ? new Set(valid) : new Set(PACKAGE_COUNTRY_OPTIONS);
    } else {
        selectedPackagesCountries = new Set(PACKAGE_COUNTRY_OPTIONS);
    }
    updatePackagesCountryFilterUi();

    // Restore search-form filters and sync the visible custom selects.
    if (saved) {
        appliedTripType = typeof saved.tripType === 'string' ? saved.tripType : 'all';
        appliedCountry = typeof saved.country === 'string' ? saved.country : 'all';
    }
    const tripTypeEl = document.getElementById('tripType');
    const countryEl = document.getElementById('countryFilter');
    if (tripTypeEl) {
        tripTypeEl.value = appliedTripType;
        syncFilterSelectUI('tripType');
    }
    if (countryEl) {
        countryEl.value = appliedCountry;
        syncFilterSelectUI('countryFilter');
    }

    if (urlView === 'all') {
        packagesNavScope = 'all';
        setAllPackagesCountriesSelected();
        updatePackagesCountryFilterUi();
        updatePackagesNavTabs();
        applyPackagesCatalogView(true);
    } else if (urlView === 'featured') {
        packagesNavScope = 'featured';
        updatePackagesNavTabs();
        applyPackagesCatalogView(false);
    } else if (saved && saved.scope === null) {
        // "Filtered packages" mode (after a Search Hotels run) — back navigation only.
        packagesNavScope = null;
        updatePackagesNavTabs();
        applyFilteredPackagesHeading();
        const grid = document.getElementById('hotelsGrid');
        if (grid) {
            grid.classList.add('hotels-grid--filtering');
            grid.classList.remove('show-all');
        }
        filterHotels();
    } else {
        // Nav "Hotels" (/hotels/) — Featured; do not restore session "All Hotels".
        packagesNavScope = 'featured';
        updatePackagesNavTabs();
        applyPackagesCatalogView(false);
    }

    // Restore scroll position after layout settles. Try a few times to absorb async
    // image decoding / fade-in transitions that grow the document height incrementally.
    const targetY = Number(saved?.scrollY) || 0;
    if (targetY > 0 && typeof window !== 'undefined') {
        const tryScroll = () => {
            const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            window.scrollTo(0, Math.min(targetY, maxY));
        };
        requestAnimationFrame(() => {
            tryScroll();
            requestAnimationFrame(tryScroll);
            setTimeout(tryScroll, 120);
            setTimeout(tryScroll, 320);
        });
    }
}

function syncFilterSelectUI(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const wrapper = select.closest('[data-filter-select]');
    if (!wrapper) return;
    const valueEl = wrapper.querySelector('.filter-select__value');
    const menu = wrapper.querySelector('.filter-select__menu');
    const selected = select.options[select.selectedIndex];
    if (valueEl && selected) valueEl.textContent = selected.textContent;
    if (!menu) return;
    menu.querySelectorAll('.filter-select__option').forEach((optionEl) => {
        const isSelected = optionEl.dataset.value === select.value;
        optionEl.classList.toggle('is-selected', isSelected);
        optionEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
}

function initFilterCustomSelects() {
    document.querySelectorAll('[data-filter-select]').forEach((wrapper) => {
        const select = wrapper.querySelector('select');
        const trigger = wrapper.querySelector('.filter-select__trigger');
        const valueEl = wrapper.querySelector('.filter-select__value');
        if (!select || !trigger || !valueEl) return;

        let menu = wrapper.querySelector('.filter-select__menu');
        if (!menu) {
            menu = document.createElement('ul');
            menu.className = 'filter-select__menu';
            menu.setAttribute('role', 'listbox');
            menu.hidden = true;
            Array.from(select.options).forEach((option) => {
                const item = document.createElement('li');
                item.className = 'filter-select__option';
                item.setAttribute('role', 'option');
                item.dataset.value = option.value;
                item.textContent = option.textContent;
                menu.appendChild(item);
            });
            wrapper.insertBefore(menu, select);
        }

        const isTouchLikeDevice = () =>
            window.matchMedia('(max-width: 768px)').matches ||
            window.matchMedia('(pointer: coarse)').matches;

        const clearScrollbarHint = (menuEl) => {
            if (!menuEl) return;
            if (menuEl._scrollbarHintTimer) {
                clearTimeout(menuEl._scrollbarHintTimer);
                menuEl._scrollbarHintTimer = null;
            }
            if (menuEl._scrollbarBounceTimer) {
                clearTimeout(menuEl._scrollbarBounceTimer);
                menuEl._scrollbarBounceTimer = null;
            }
            menuEl.classList.remove('is-scrollbar-hint');
            const wrapper = menuEl.closest('[data-filter-select]');
            if (wrapper) wrapper.classList.remove('is-scrollbar-hint-active');
            const cue = menuEl.querySelector('.filter-select__scroll-cue');
            if (cue) cue.classList.remove('is-visible');
        };

        const showScrollbarHint = (menuEl) => {
            if (!menuEl || menuEl.scrollHeight <= menuEl.clientHeight) return;
            clearScrollbarHint(menuEl);
            void menuEl.offsetWidth;
            menuEl.classList.add('is-scrollbar-hint');

            const wrapper = menuEl.closest('[data-filter-select]');
            const touchLike = isTouchLikeDevice();
            if (wrapper) wrapper.classList.add('is-scrollbar-hint-active');

            if (!touchLike) {
                const scrollTop = menuEl.scrollTop;
                menuEl.scrollTop = scrollTop + 1;
                menuEl.scrollTop = scrollTop;
            }

            menuEl._scrollbarHintTimer = setTimeout(() => {
                clearScrollbarHint(menuEl);
            }, 1000);
        };

        const closeMenu = () => {
            clearScrollbarHint(menu);
            menu.hidden = true;
            wrapper.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        };

        const openMenu = () => {
            document.querySelectorAll('.filter-select.is-open').forEach((openWrapper) => {
                if (openWrapper === wrapper) return;
                const openMenuEl = openWrapper.querySelector('.filter-select__menu');
                const openTrigger = openWrapper.querySelector('.filter-select__trigger');
                if (openMenuEl) {
                    clearScrollbarHint(openMenuEl);
                    openMenuEl.hidden = true;
                }
                openWrapper.classList.remove('is-open');
                if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
            });
            menu.hidden = false;
            wrapper.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            if (isTouchLikeDevice()) menu.scrollTop = 0;
            requestAnimationFrame(() => showScrollbarHint(menu));
        };

        trigger.addEventListener('click', () => {
            if (wrapper.classList.contains('is-open')) closeMenu();
            else openMenu();
        });

        menu.addEventListener('click', (event) => {
            const optionEl = event.target.closest('.filter-select__option');
            if (!optionEl) return;
            select.value = optionEl.dataset.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            syncFilterSelectUI(select.id);
            closeMenu();
        });

        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) closeMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu();
        });

        select.addEventListener('change', () => syncFilterSelectUI(select.id));
        syncFilterSelectUI(select.id);
    });
}

function syncDefaultPackageFilters() {
    appliedTripType = 'all';
    appliedCountry = 'all';
    document.getElementById('tripType').value = 'all';
    document.getElementById('countryFilter').value = 'all';
    syncFilterSelectUI('countryFilter');
    syncFilterSelectUI('tripType');
}

const PACKAGES_HEADING_FEATURED = {
    title: 'Featured Hotels',
    subtitle: 'Handpicked hotels for unforgettable getaways.'
};
const PACKAGES_HEADING_ALL = {
    title: 'All Hotels',
    subtitle: 'Browse our full collection of curated stays across the Maldives and Indian Ocean.'
};
const PACKAGES_HEADING_FILTERED = {
    title: 'Filtered packages',
    subtitle: 'Showing stays that match your selected criteria.'
};
const PACKAGE_COUNTRY_OPTIONS = ['seychelles', 'maldives', 'mauritius'];
let selectedPackagesCountries = new Set(PACKAGE_COUNTRY_OPTIONS);

function getCardModalKey(card) {
    if (!card) return '';
    const handler = card.getAttribute('onclick') || '';
    const match = handler.match(/openModal\('([^']+)'\)/);
    return match ? match[1] : '';
}

function getCardCountry(card) {
    const dataCountry = (card.dataset.country || '').toLowerCase();
    if (dataCountry) return dataCountry;
    const modalKey = getCardModalKey(card);
    const destination = destinations[modalKey] || {};
    const countryText = `${destination.title || ''} ${destination.description || ''}`.toLowerCase();
    if (countryText.includes('seychelles')) return 'seychelles';
    if (countryText.includes('mauritius')) return 'mauritius';
    return 'maldives';
}

function setAllPackagesCountriesSelected() {
    selectedPackagesCountries = new Set(PACKAGE_COUNTRY_OPTIONS);
}

function updatePackagesCountryFilterUi() {
    const allSelected = PACKAGE_COUNTRY_OPTIONS.every(country => selectedPackagesCountries.has(country));
    document.querySelectorAll('[data-country-chip]').forEach(chip => {
        const country = chip.getAttribute('data-country-chip');
        const isActive = country === 'all' ? allSelected : selectedPackagesCountries.has(country);
        chip.classList.toggle('is-active', isActive);
    });
}

function formatCountryLabel(countryCode) {
    if (!countryCode) return 'All Destinations';
    const names = {
        maldives: 'Maldives',
        seychelles: 'Seychelles',
        mauritius: 'Mauritius',
    };
    return names[countryCode] || countryCode.charAt(0).toUpperCase() + countryCode.slice(1);
}

function updatePackagesCountryTag() {
    const tagEl = document.getElementById('packagesCountryTag');
    if (!tagEl) return;

    let label = 'All Destinations';
    const countryFilterEl = document.getElementById('countryFilter');
    const selectedCountryFilter = countryFilterEl ? countryFilterEl.value : 'all';

    if (packagesNavScope === 'all') {
        const selected = PACKAGE_COUNTRY_OPTIONS.filter(country => selectedPackagesCountries.has(country));
        if (selected.length === 1) {
            label = formatCountryLabel(selected[0]);
        } else if (selected.length > 1 && selected.length < PACKAGE_COUNTRY_OPTIONS.length) {
            label = selected.map(formatCountryLabel).join(' · ');
        }
    } else if (packagesNavScope === null) {
        label = appliedCountry === 'all' ? 'All Destinations' : formatCountryLabel(appliedCountry);
    } else {
        label = selectedCountryFilter === 'all'
            ? 'All Destinations'
            : formatCountryLabel(selectedCountryFilter);
    }

    tagEl.textContent = label;
}

function togglePackagesCountryFilter(country) {
    if (country === 'all') {
        setAllPackagesCountriesSelected();
    } else if (selectedPackagesCountries.has(country)) {
        if (selectedPackagesCountries.size > 1) {
            selectedPackagesCountries.delete(country);
        }
    } else {
        selectedPackagesCountries.add(country);
    }
    updatePackagesCountryFilterUi();
    updatePackagesCountryTag();
    if (packagesNavScope === 'all') {
        filterHotels();
    }
    savePackagesViewState();
}

function applyFilteredPackagesHeading() {
    const headingEl = document.getElementById('packagesHeadingTitle');
    const subEl = document.getElementById('packagesHeadingSubtitle');
    if (headingEl) headingEl.textContent = PACKAGES_HEADING_FILTERED.title;
    if (subEl) subEl.textContent = PACKAGES_HEADING_FILTERED.subtitle;
}

function filterHotels() {
    if (isHotelsGridLoading()) {
        const noResultsEl = document.getElementById('noResults');
        if (noResultsEl) noResultsEl.style.display = 'none';
        return;
    }

    const tripType = appliedTripType;
    const cards = document.querySelectorAll('.destination-card');
    const grid = document.getElementById('hotelsGrid');
    const showAllCatalog = grid && grid.classList.contains('show-all');
    const filterExtras =
        showAllCatalog || (grid && grid.classList.contains('hotels-grid--filtering'));
    const filterByCountry = showAllCatalog && packagesNavScope === 'all';
    let visibleCount = 0;

    cards.forEach(card => {
        if (card.classList.contains('extra-destination') && !filterExtras) {
            card.classList.remove('hidden');
            return;
        }

        let show = true;

        if (!cardMatchesTripType(card, tripType)) show = false;
        if (appliedCountry !== 'all' && getCardCountry(card) !== appliedCountry) show = false;
        if (filterByCountry && !selectedPackagesCountries.has(getCardCountry(card))) show = false;

        card.classList.toggle('hidden', !show);
        if (show) visibleCount++;
    });

    document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
    updatePackagesCountryTag();
}

function updatePackagesNavTabs() {
    const nav = document.getElementById('packagesCatalogNav');
    const featuredBtn = document.getElementById('tabPackagesFeatured');
    const allBtn = document.getElementById('tabPackagesAll');
    if (!featuredBtn || !allBtn) return;
    const isFeatured = packagesNavScope === 'featured';
    const isAll = packagesNavScope === 'all';
    featuredBtn.classList.toggle('is-active', isFeatured);
    featuredBtn.setAttribute('aria-selected', isFeatured ? 'true' : 'false');
    allBtn.classList.toggle('is-active', isAll);
    allBtn.setAttribute('aria-selected', isAll ? 'true' : 'false');
    if (nav) {
        nav.classList.toggle('packages-catalog-nav--neutral', packagesNavScope === null);
        nav.classList.toggle('packages-catalog-nav--all-active', isAll);
    }
    updatePackagesCountryTag();
}

function applyPackagesCatalogView(showAll) {
    const grid = document.getElementById('hotelsGrid');
    const headingEl = document.getElementById('packagesHeadingTitle');
    const subEl = document.getElementById('packagesHeadingSubtitle');
    if (!grid) return;

    grid.classList.remove('hotels-grid--filtering');

    if (showAll) {
        grid.classList.add('show-all');
        if (headingEl) headingEl.textContent = PACKAGES_HEADING_ALL.title;
        if (subEl) subEl.textContent = PACKAGES_HEADING_ALL.subtitle;
        document.querySelectorAll('.destination-card.extra-destination').forEach(card => {
            card.classList.add('visible');
        });
    } else {
        grid.classList.remove('show-all');
        if (headingEl) headingEl.textContent = PACKAGES_HEADING_FEATURED.title;
        if (subEl) subEl.textContent = PACKAGES_HEADING_FEATURED.subtitle;
    }

    filterHotels();
}

function selectPackagesCatalog(mode) {
    packagesNavScope = mode === 'all' ? 'all' : 'featured';
    if (packagesNavScope === 'all') {
        setAllPackagesCountriesSelected();
        updatePackagesCountryFilterUi();
    }
    syncDefaultPackageFilters();
    updatePackagesNavTabs();
    applyPackagesCatalogView(mode === 'all');
    savePackagesViewState();
}

function runPackagesFilterSearch() {
    const tripTypeEl = document.getElementById('tripType');
    const countryEl = document.getElementById('countryFilter');
    appliedTripType = tripTypeEl ? tripTypeEl.value : 'all';
    appliedCountry = countryEl ? countryEl.value : 'all';

    packagesNavScope = null;
    updatePackagesNavTabs();
    applyFilteredPackagesHeading();
    const grid = document.getElementById('hotelsGrid');
    if (grid) {
        grid.classList.add('hotels-grid--filtering');
        grid.classList.remove('show-all');
    }
    filterHotels();
    savePackagesViewState();
}

function resetFilters() {
    packagesNavScope = 'featured';
    updatePackagesNavTabs();
    syncDefaultPackageFilters();
    applyPackagesCatalogView(false);
    savePackagesViewState();
}

function viewAllPackagesFromEmpty() {
    packagesNavScope = 'all';
    setAllPackagesCountriesSelected();
    updatePackagesCountryFilterUi();
    updatePackagesNavTabs();
    syncDefaultPackageFilters();
    applyPackagesCatalogView(true);
    savePackagesViewState();
}

updatePackagesCountryFilterUi();
updatePackagesNavTabs();
initFilterCustomSelects();

// Carousel state
let currentSlide = 0;
let currentImages = [];
let lightboxOpen = false;
let lightboxScrollPosition = 0;

// Utility function
function isMobile() {
    return window.innerWidth <= 768;
}

// Modal functions
let modalScrollPosition = 0;

function openModal(destinationId) {
    const dest = destinations[destinationId];
    if (!dest) return;

    // Save scroll position
    modalScrollPosition = window.scrollY;

    currentImages = dest.images;
    currentSlide = 0;

    if (typeof window.preloadCatalogImages === 'function') {
        window.preloadCatalogImages(currentImages);
    }

    createCarouselDots();
    rebuildCatalogSwipers();
    updateDots();

    document.getElementById('modalTitle').textContent = dest.title;
    document.getElementById('modalDescription').textContent = dest.description;
    document.getElementById('modalDuration').textContent = dest.duration;
    document.getElementById('modalAccommodation').textContent = dest.accommodation;
    document.getElementById('modalTransport').textContent = dest.transport;

    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = dest.features.map(f => `<li>${f}</li>`).join('');

    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${modalScrollPosition}px`;
    document.documentElement.style.overflow = 'hidden';
}

function bookCurrentPackageViaWhatsApp() {
    const titleEl = document.getElementById('modalTitle');
    const hotelName = titleEl ? titleEl.textContent.trim() : '';
    const safeHotelName = hotelName || 'this hotel';
    const message = `Hello, I’m interested in the package for ${safeHotelName}.`;
    const whatsappUrl = `https://wa.me/971501771927?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener');
}

let carouselSwiperApi = null;
let lightboxSwiperApi = null;
let catalogSwiperSyncLock = false;

function normalizeCatalogSlide(index) {
    if (!currentImages.length) return 0;
    return ((index % currentImages.length) + currentImages.length) % currentImages.length;
}

function setCatalogSlide(index, source = 'api') {
    if (catalogSwiperSyncLock) return;
    catalogSwiperSyncLock = true;
    currentSlide = normalizeCatalogSlide(index);

    if (source !== 'carousel' && carouselSwiperApi && !lightboxOpen) {
        carouselSwiperApi.slideTo(currentSlide, 0);
    }
    if (source !== 'lightbox' && lightboxSwiperApi && lightboxOpen) {
        lightboxSwiperApi.slideTo(currentSlide, 0);
    }

    updateDots();
    if (lightboxOpen) {
        const counter = document.getElementById('lightboxCounter');
        if (counter && currentImages.length) {
            counter.textContent = `${currentSlide + 1} / ${currentImages.length}`;
        }
    }
    catalogSwiperSyncLock = false;
}

function rebuildCatalogSwipers() {
    if (carouselSwiperApi) {
        carouselSwiperApi.rebuild();
        carouselSwiperApi.slideTo(currentSlide, 0);
    }
    if (lightboxSwiperApi) {
        lightboxSwiperApi.rebuild();
        if (lightboxOpen) {
            lightboxSwiperApi.slideTo(currentSlide, 0);
        }
    }
}

function updateCarouselImage() {
    setCatalogSlide(currentSlide, 'api');
}

function createCarouselDots() {
    const dotsContainer = document.getElementById('carouselDots');
    dotsContainer.innerHTML = currentImages.map((_, index) => 
        `<button class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></button>`
    ).join('');
}

function updateDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function changeSlide(direction) {
    setCatalogSlide(currentSlide + direction, 'api');
}

function goToSlide(index) {
    setCatalogSlide(index, 'api');
}

function openLightbox() {
    // Save scroll position before applying fixed positioning
    // Check if body is already fixed (from modal) and get position from top style
    if (document.body.style.position === 'fixed') {
        lightboxScrollPosition = parseInt(document.body.style.top || '0') * -1;
    } else {
        lightboxScrollPosition = window.scrollY;
    }

    document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
    document.getElementById('lightboxOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${lightboxScrollPosition}px`;
    document.documentElement.style.overflow = 'hidden';
    lightboxOpen = true;
    if (typeof window.preloadCatalogImages === 'function') {
        window.preloadCatalogImages(currentImages);
    }
    setCatalogSlide(currentSlide, 'api');
}

function updateLightbox() {
    if (lightboxOpen) {
        setCatalogSlide(currentSlide, 'api');
    }
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, lightboxScrollPosition);
    lightboxOpen = false;
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    closeLightbox();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, modalScrollPosition);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (lightboxOpen) {
            closeLightbox();
        } else {
            closeModal();
        }
    }
    if (e.key === 'ArrowLeft' && (lightboxOpen || document.getElementById('modalOverlay').classList.contains('active'))) changeSlide(-1);
    if (e.key === 'ArrowRight' && (lightboxOpen || document.getElementById('modalOverlay').classList.contains('active'))) changeSlide(1);
});

async function initCatalogSwipers() {
    const { createJanaGallerySwiper, ensureSwiperLoaded, preloadJanaImages } = await import('./jana-swiper.js');
    await ensureSwiperLoaded();

    const carouselEl = document.getElementById('carouselSwipeContainer');
    const lightboxEl = document.getElementById('lightboxSwipeContainer');
    if (!carouselEl || !lightboxEl) return;

    const escapeAttr = (value) =>
        String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;');

    carouselSwiperApi = await createJanaGallerySwiper(carouselEl, {
        getImages: () => currentImages,
        getInitialIndex: () => currentSlide,
        slideClass: 'carousel-slide',
        onIndexChange: (index) => {
            setCatalogSlide(index, 'carousel');
        },
        renderSlideInner: (src) =>
            `<img src="${escapeAttr(src)}" alt="" draggable="false" decoding="async"><div class="expand-hint">Click to expand</div>`
    });

    carouselEl.addEventListener('click', (event) => {
        if (carouselSwiperApi?.didDrag?.()) return;
        if (!event.target.closest('img')) return;
        openLightbox();
    });

    lightboxSwiperApi = await createJanaGallerySwiper(lightboxEl, {
        mode: 'lightbox',
        getImages: () => currentImages,
        getInitialIndex: () => currentSlide,
        slideClass: 'lightbox-image-container',
        onIndexChange: (index) => {
            setCatalogSlide(index, 'lightbox');
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

    lightboxEl.addEventListener('click', (event) => {
        if (lightboxOpen && event.target.closest('img')) event.stopPropagation();
    });

    window.preloadCatalogImages = (urls) => preloadJanaImages(urls);
}

// Expose inline-onclick handlers globally because this script is loaded as an ES module
// (top-level declarations are otherwise scoped to the module and unreachable from HTML onclick=).
window.selectPackagesCatalog = selectPackagesCatalog;
window.togglePackagesCountryFilter = togglePackagesCountryFilter;
window.runPackagesFilterSearch = runPackagesFilterSearch;
window.resetFilters = resetFilters;
window.viewAllPackagesFromEmpty = viewAllPackagesFromEmpty;
window.closeModal = closeModal;
window.closeLightbox = closeLightbox;
window.openLightbox = openLightbox;
window.changeSlide = changeSlide;
window.bookCurrentPackageViaWhatsApp = bookCurrentPackageViaWhatsApp;

function bootHotelsCatalogPage() {
    applyHotelJsonDataToHotelsPage();
    initCatalogSwipers().catch((error) => {
        console.error('Failed to initialize Swiper carousels:', error);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHotelsCatalogPage);
} else {
    bootHotelsCatalogPage();
}

window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    hotelsPageLoadPromise = null;
    applyHotelJsonDataToHotelsPage();
});
