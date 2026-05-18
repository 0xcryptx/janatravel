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

const HOTEL_IMAGE_BASE_PATHS = ['/assets/hotel_images'];
const MAIN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const IMAGE_EXISTS_CACHE = new Map();

function isHotelActive(value) {
    if (value === false) return false;
    const normalized = String(value ?? '').toLowerCase().trim();
    if (!normalized) return true;
    return normalized !== 'false' && normalized !== 'no' && normalized !== '0';
}

async function doesImageExist(url) {
    if (IMAGE_EXISTS_CACHE.has(url)) return IMAGE_EXISTS_CACHE.get(url);
    const pendingCheck = (async () => {
    try {
        const headResponse = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        if (headResponse.ok) return true;
        if (headResponse.status !== 405) return false;
    } catch (error) {
        // Ignore and try GET fallback.
    }
    try {
        const getResponse = await fetch(url, { cache: 'no-store' });
        return getResponse.ok;
    } catch (error) {
        return false;
    }
    })();
    IMAGE_EXISTS_CACHE.set(url, pendingCheck);
    return pendingCheck;
}

async function findFirstExistingImage(baseFolderPath, baseName) {
    const candidates = MAIN_IMAGE_EXTENSIONS.map(ext => `${baseFolderPath}/${baseName}.${ext}`);
    const checks = await Promise.all(candidates.map(url => doesImageExist(url)));
    const matchedIndex = checks.findIndex(Boolean);
    return matchedIndex >= 0 ? candidates[matchedIndex] : '';
}

async function collectMainImages(baseFolderPath) {
    const images = [];
    const firstImage = await findFirstExistingImage(baseFolderPath, '1');
    if (firstImage) {
        images.push(firstImage);
        return images;
    }
    const fallbackImage = await findFirstExistingImage(baseFolderPath, 'add_image');
    if (fallbackImage) images.push(fallbackImage);
    return images;
}

async function resolveHotelImageSet(slug) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) return null;
    for (const basePath of HOTEL_IMAGE_BASE_PATHS) {
        const folderPath = `${basePath}/${normalizedSlug}`;
        const numberedImages = await collectMainImages(folderPath);
        if (numberedImages.length) {
            return { basePath, images: numberedImages };
        }
        const fallbackImage = `${folderPath}/add_image.webp`;
        if (await doesImageExist(fallbackImage)) {
            return { basePath, images: [fallbackImage] };
        }
    }
    return null;
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

function inferExperienceTags(hotel) {
    const source = String(hotel.experience || '').toLowerCase();
    if (!source.trim()) return [];

    const tags = new Set();
    const tokens = source
        .split(/[,;|\n]+/)
        .map(v => v.trim())
        .filter(Boolean);

    const addTagFromToken = (value) => {
        const compact = value.replace(/[^a-z0-9]+/g, ' ').trim();
        if (!compact) return;
        if (compact.includes('all inclusive') || compact.includes('all-inclusive')) tags.add('all-inclusive-holidays');
        else if (compact.includes('family')) tags.add('family-holidays');
        else if (compact.includes('honeymoon') || compact.includes('couple')) tags.add('honeymoon-couples');
        else if (compact.includes('private island')) tags.add('private-island-escapes');
        else if (compact.includes('wellness')) tags.add('wellness-retreats');
        else if (compact.includes('luxury beach') || compact === 'luxury') tags.add('luxury-beach-holidays');
        else if (compact.includes('adventure') || compact.includes('water sport')) tags.add('adventure-water-sports');
    };

    tokens.forEach(addTagFromToken);
    if (!tags.size) addTagFromToken(source);
    return Array.from(tags);
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
        const imgSrc = hotel.imageUrl || HOTEL_PLACEHOLDER_IMAGE;
        const isFeatured = Boolean(hotel.featured);

        const card = document.createElement('div');
        card.className = `destination-card fade-in${isFeatured ? '' : ' extra-destination'}`;
        card.dataset.hotelSlug = slug;
        card.dataset.price = String(hotel.price || (primaryTag === 'luxury-beach-holidays' ? 2399 : primaryTag === 'family-holidays' ? 1999 : 1799));
        card.dataset.type = experienceTags.join('|');
        card.dataset.kids = String(kidsAllowed);
        card.dataset.travelers = String(maxTravelers);
        card.dataset.country = String(hotel.destination || '').toLowerCase();
        card.setAttribute('onclick', `window.location.href='/hotels/package/?id=${encodeURIComponent(slug)}'`);
        card.innerHTML = `
            <img src="${imgSrc}" alt="${hotel.name || 'Hotel package'}">
            <div class="destination-info">
                <h4>${hotel.name || 'Hotel package'}</h4>
                <p>${cardDescription}</p>
                <div class="destination-price">
                    <button class="book-btn">View Details</button>
                </div>
            </div>
        `;
        card.classList.add('visible');
        if (typeof observer !== 'undefined' && observer && typeof observer.observe === 'function') {
            observer.observe(card);
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

async function applyHotelJsonDataToHotelsPage() {
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
applyHotelJsonDataToHotelsPage();

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

        const closeMenu = () => {
            menu.hidden = true;
            wrapper.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        };

        const openMenu = () => {
            document.querySelectorAll('.filter-select.is-open').forEach((openWrapper) => {
                if (openWrapper === wrapper) return;
                const openMenuEl = openWrapper.querySelector('.filter-select__menu');
                const openTrigger = openWrapper.querySelector('.filter-select__trigger');
                if (openMenuEl) openMenuEl.hidden = true;
                openWrapper.classList.remove('is-open');
                if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
            });
            menu.hidden = false;
            wrapper.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
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
    title: 'Featured Packages',
    subtitle: 'Handpicked packages for unforgettable getaways.'
};
const PACKAGES_HEADING_ALL = {
    title: 'All Packages',
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
}

function applyFilteredPackagesHeading() {
    const headingEl = document.getElementById('packagesHeadingTitle');
    const subEl = document.getElementById('packagesHeadingSubtitle');
    if (headingEl) headingEl.textContent = PACKAGES_HEADING_FILTERED.title;
    if (subEl) subEl.textContent = PACKAGES_HEADING_FILTERED.subtitle;
}

function filterHotels() {
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

        const typeTags = (card.dataset.type || '').split('|').filter(Boolean);

        let show = true;

        if (tripType !== 'all' && !typeTags.includes(tripType)) show = false;
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
}

function runPackagesFilterSearch() {
    appliedTripType = document.getElementById('tripType').value;
    appliedCountry = document.getElementById('countryFilter').value;

    packagesNavScope = null;
    updatePackagesNavTabs();
    applyFilteredPackagesHeading();
    const grid = document.getElementById('hotelsGrid');
    if (grid) grid.classList.add('hotels-grid--filtering');
    filterHotels();
}

function resetFilters() {
    packagesNavScope = 'featured';
    updatePackagesNavTabs();
    syncDefaultPackageFilters();
    applyPackagesCatalogView(false);
}

function viewAllPackagesFromEmpty() {
    packagesNavScope = 'all';
    setAllPackagesCountriesSelected();
    updatePackagesCountryFilterUi();
    updatePackagesNavTabs();
    syncDefaultPackageFilters();
    applyPackagesCatalogView(true);
}

updatePackagesCountryFilterUi();
updatePackagesNavTabs();
initFilterCustomSelects();

// Carousel state
let currentSlide = 0;
let currentImages = [];

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
    
    updateCarouselImage();
    createCarouselDots();

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

function updateCarouselImage() {
    document.getElementById('modalImage').src = currentImages[currentSlide];
    updateDots();
    updateLightbox();
    updateCarouselAdjacentImages();
}

function updateCarouselAdjacentImages() {
    const prevIndex = currentSlide === 0 ? currentImages.length - 1 : currentSlide - 1;
    const nextIndex = currentSlide === currentImages.length - 1 ? 0 : currentSlide + 1;
    
    document.getElementById('carouselPrevImage').src = currentImages[prevIndex];
    document.getElementById('carouselNextImage').src = currentImages[nextIndex];
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
    currentSlide += direction;
    if (currentSlide >= currentImages.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = currentImages.length - 1;
    updateCarouselImage();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarouselImage();
}

// Carousel swipe for mobile
let carouselTouchStartX = 0;
let carouselTouchCurrentX = 0;
let isCarouselSwiping = false;
const carouselSwipeThreshold = 50;
const carouselSwipeContainer = document.getElementById('carouselSwipeContainer');

carouselSwipeContainer.addEventListener('touchstart', function(e) {
    if (!isMobile()) return;
    carouselTouchStartX = e.touches[0].clientX;
    carouselTouchCurrentX = carouselTouchStartX;
    isCarouselSwiping = true;
    carouselSwipeContainer.classList.add('swiping');
    updateCarouselAdjacentImages();
}, { passive: true });

carouselSwipeContainer.addEventListener('touchmove', function(e) {
    if (!isCarouselSwiping || !isMobile()) return;
    carouselTouchCurrentX = e.touches[0].clientX;
    const diff = carouselTouchCurrentX - carouselTouchStartX;
    
    document.getElementById('carouselSlideMain').style.transform = `translateX(${diff}px)`;
    document.getElementById('carouselSlidePrev').style.transform = `translateX(calc(-100% + ${diff}px))`;
    document.getElementById('carouselSlideNext').style.transform = `translateX(calc(100% + ${diff}px))`;
}, { passive: true });

carouselSwipeContainer.addEventListener('touchend', function(e) {
    if (!isCarouselSwiping || !isMobile()) return;
    isCarouselSwiping = false;
    carouselSwipeContainer.classList.remove('swiping');
    
    const diff = carouselTouchCurrentX - carouselTouchStartX;
    
    if (Math.abs(diff) > carouselSwipeThreshold) {
        if (diff > 0) {
            animateCarouselSwipe('right');
        } else {
            animateCarouselSwipe('left');
        }
    } else {
        resetCarouselSwipePositions();
    }
}, { passive: true });

function animateCarouselSwipe(direction) {
    const mainSlide = document.getElementById('carouselSlideMain');
    const prevSlide = document.getElementById('carouselSlidePrev');
    const nextSlide = document.getElementById('carouselSlideNext');
    const mainImage = document.getElementById('modalImage');
    
    mainSlide.style.transition = 'transform 0.3s ease';
    prevSlide.style.transition = 'transform 0.3s ease';
    nextSlide.style.transition = 'transform 0.3s ease';
    
    if (direction === 'right') {
        mainSlide.style.transform = 'translateX(100%)';
        prevSlide.style.transform = 'translateX(0)';
    } else {
        mainSlide.style.transform = 'translateX(-100%)';
        nextSlide.style.transform = 'translateX(0)';
    }
    
    setTimeout(() => {
        // Update slide index
        if (direction === 'right') {
            currentSlide--;
            if (currentSlide < 0) currentSlide = currentImages.length - 1;
        } else {
            currentSlide++;
            if (currentSlide >= currentImages.length) currentSlide = 0;
        }
        
        // Update main image
        mainImage.src = currentImages[currentSlide];
        
        // Instantly reset positions
        mainSlide.style.transition = 'none';
        prevSlide.style.transition = 'none';
        nextSlide.style.transition = 'none';
        
        mainSlide.style.transform = 'translateX(0)';
        prevSlide.style.transform = 'translateX(-100%)';
        nextSlide.style.transform = 'translateX(100%)';
        
        // Force reflow
        mainSlide.offsetHeight;
        
        // Clear transitions
        mainSlide.style.transition = '';
        prevSlide.style.transition = '';
        nextSlide.style.transition = '';
        
        // Update dots and adjacent images
        updateDots();
        updateCarouselAdjacentImages();
        updateLightbox();
    }, 300);
}

function resetCarouselSwipePositions(instant) {
    const mainSlide = document.getElementById('carouselSlideMain');
    const prevSlide = document.getElementById('carouselSlidePrev');
    const nextSlide = document.getElementById('carouselSlideNext');
    
    mainSlide.style.transition = 'transform 0.3s ease';
    prevSlide.style.transition = 'transform 0.3s ease';
    nextSlide.style.transition = 'transform 0.3s ease';
    
    mainSlide.style.transform = 'translateX(0)';
    prevSlide.style.transform = 'translateX(-100%)';
    nextSlide.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        mainSlide.style.transition = '';
        prevSlide.style.transition = '';
        nextSlide.style.transition = '';
    }, 300);
}

// Lightbox: fullscreen view with cursor-follow magnify on the image (desktop only)
let lightboxOpen = false;
let lightboxScrollPosition = 0;
const LIGHTBOX_MAGNIFY_SCALE = 2.25;

function resetLightboxMagnify() {
    const image = document.getElementById('lightboxImage');
    if (!image) return;
    image.style.transform = '';
    image.style.transformOrigin = '';
}

function onLightboxImageMouseMove(e) {
    if (!lightboxOpen || isMobile()) return;
    const container = document.getElementById('lightboxContainer');
    const img = document.getElementById('lightboxImage');
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
    const img = document.getElementById('lightboxImage');
    const container = document.getElementById('lightboxContainer');
    if (!img || !container) return;
    container.addEventListener('mousemove', onLightboxImageMouseMove);
    container.addEventListener('mouseleave', onLightboxImageMouseLeave);
    img.addEventListener('click', function (e) {
        if (lightboxOpen) e.stopPropagation();
    });
}
initLightboxMagnifyListeners();

function openLightbox() {
    // Save scroll position before applying fixed positioning
    // Check if body is already fixed (from modal) and get position from top style
    if (document.body.style.position === 'fixed') {
        lightboxScrollPosition = parseInt(document.body.style.top || '0') * -1;
    } else {
        lightboxScrollPosition = window.scrollY;
    }

    resetLightboxMagnify();
    document.getElementById('lightboxImage').src = currentImages[currentSlide];
    document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
    document.getElementById('lightboxOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${lightboxScrollPosition}px`;
    document.documentElement.style.overflow = 'hidden';
    lightboxOpen = true;

    // Load adjacent images for swipe preview
    if (typeof updateAdjacentImages === 'function') {
        updateAdjacentImages();
    }
    if (typeof resetSwipePositions === 'function') {
        resetSwipePositions();
    }
}

function updateLightbox() {
    if (lightboxOpen) {
        document.getElementById('lightboxImage').src = currentImages[currentSlide];
        document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
        resetLightboxMagnify();

        // Update adjacent images for swipe
        if (typeof updateAdjacentImages === 'function') {
            updateAdjacentImages();
        }
    }
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').classList.remove('active');
    resetLightboxMagnify();
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

// Touch swipe for mobile lightbox navigation
let touchStartX = 0;
let touchCurrentX = 0;
let isSwiping = false;
const swipeThreshold = 50;
const swipeContainer = document.getElementById('lightboxSwipeContainer');

function updateAdjacentImages() {
    const prevIndex = currentSlide === 0 ? currentImages.length - 1 : currentSlide - 1;
    const nextIndex = currentSlide === currentImages.length - 1 ? 0 : currentSlide + 1;
    
    document.getElementById('lightboxPrevImage').src = currentImages[prevIndex];
    document.getElementById('lightboxNextImage').src = currentImages[nextIndex];
}

swipeContainer.addEventListener('touchstart', function(e) {
    if (!isMobile()) return;
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    isSwiping = true;
    swipeContainer.classList.add('swiping');
    updateAdjacentImages();
}, { passive: true });

swipeContainer.addEventListener('touchmove', function(e) {
    if (!isSwiping || !isMobile()) return;
    touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX;
    
    // Move all three containers
    document.getElementById('lightboxContainer').style.transform = `translateX(${diff}px)`;
    document.getElementById('lightboxPrevContainer').style.transform = `translateX(calc(-100% + ${diff}px))`;
    document.getElementById('lightboxNextContainer').style.transform = `translateX(calc(100% + ${diff}px))`;
}, { passive: true });

swipeContainer.addEventListener('touchend', function(e) {
    if (!isSwiping || !isMobile()) return;
    isSwiping = false;
    swipeContainer.classList.remove('swiping');
    
    const diff = touchCurrentX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped right - go to previous
            animateSwipe('right');
        } else {
            // Swiped left - go to next
            animateSwipe('left');
        }
    } else {
        // Reset positions
        resetSwipePositions();
    }
}, { passive: true });

function animateSwipe(direction) {
    const mainContainer = document.getElementById('lightboxContainer');
    const prevContainer = document.getElementById('lightboxPrevContainer');
    const nextContainer = document.getElementById('lightboxNextContainer');
    const mainImage = document.getElementById('lightboxImage');
    
    mainContainer.style.transition = 'transform 0.3s ease';
    prevContainer.style.transition = 'transform 0.3s ease';
    nextContainer.style.transition = 'transform 0.3s ease';
    
    if (direction === 'right') {
        mainContainer.style.transform = 'translateX(100%)';
        prevContainer.style.transform = 'translateX(0)';
    } else {
        mainContainer.style.transform = 'translateX(-100%)';
        nextContainer.style.transform = 'translateX(0)';
    }
    
    setTimeout(() => {
        // Update slide index
        if (direction === 'right') {
            currentSlide--;
            if (currentSlide < 0) currentSlide = currentImages.length - 1;
        } else {
            currentSlide++;
            if (currentSlide >= currentImages.length) currentSlide = 0;
        }
        
        // Update main image to new current image BEFORE resetting positions
        mainImage.src = currentImages[currentSlide];
        document.getElementById('lightboxCounter').textContent = `${currentSlide + 1} / ${currentImages.length}`;
        resetLightboxMagnify();

        // Instantly reset positions (no transition)
        mainContainer.style.transition = 'none';
        prevContainer.style.transition = 'none';
        nextContainer.style.transition = 'none';
        
        mainContainer.style.transform = 'translateX(0)';
        prevContainer.style.transform = 'translateX(-100%)';
        nextContainer.style.transform = 'translateX(100%)';
        
        // Force reflow
        mainContainer.offsetHeight;
        
        // Clear inline transitions
        mainContainer.style.transition = '';
        prevContainer.style.transition = '';
        nextContainer.style.transition = '';
        
        // Update adjacent images and carousel dots
        updateAdjacentImages();
        updateDots();
        document.getElementById('modalImage').src = currentImages[currentSlide];
    }, 300);
}

function resetSwipePositions(instant) {
    const mainContainer = document.getElementById('lightboxContainer');
    const prevContainer = document.getElementById('lightboxPrevContainer');
    const nextContainer = document.getElementById('lightboxNextContainer');
    
    if (instant) {
        // Instant reset after successful swipe - no animation
        mainContainer.style.transition = 'none';
        prevContainer.style.transition = 'none';
        nextContainer.style.transition = 'none';
    } else {
        // Animated reset when swipe is cancelled
        mainContainer.style.transition = 'transform 0.3s ease';
        prevContainer.style.transition = 'transform 0.3s ease';
        nextContainer.style.transition = 'transform 0.3s ease';
    }
    
    mainContainer.style.transform = 'translateX(0)';
    prevContainer.style.transform = 'translateX(-100%)';
    nextContainer.style.transform = 'translateX(100%)';
    
    if (instant) {
        // Force reflow then clear transition
        mainContainer.offsetHeight;
        mainContainer.style.transition = '';
        prevContainer.style.transition = '';
        nextContainer.style.transition = '';
    } else {
        setTimeout(() => {
            mainContainer.style.transition = '';
            prevContainer.style.transition = '';
            nextContainer.style.transition = '';
        }, 300);
    }
}

applyHotelJsonDataToHotelsPage();
