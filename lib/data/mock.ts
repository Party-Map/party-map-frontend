import type { Event, Performer, Place } from '../types'

export const places: Place[] = [
  // ——— Budapest (existing) ———
  {
    id: 'p1',
    name: 'Danube Club',
    location: { lat: 47.5005, lng: 19.0481 },
    address: 'Riverbank 12',
    city: 'Budapest',
    description: 'Riverside club with two dance floors and a rooftop terrace.',
  image: 'https://images.unsplash.com/photo-1667992403195-d2241a40ca2d?auto=format&fit=crop&w=1280&q=80', // updated terrace image
    tags: ['house', 'techno', 'rooftop'],
  },
  {
    id: 'p2',
    name: 'Ruin Bar 42',
    location: { lat: 47.4984, lng: 19.0593 },
    address: 'Kazinczy u. 14',
    city: 'Budapest',
    description: 'Iconic ruin-bar vibe with eclectic rooms and a courtyard.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1280&auto=format&fit=crop',
    tags: ['ruin bar', 'eclectic', 'indie'],
  },
  {
    id: 'p3',
    name: 'Warehouse X',
    location: { lat: 47.4869, lng: 19.0701 },
    address: 'Kőbányai út 21',
    city: 'Budapest',
    description: 'Industrial warehouse turned into a late-night techno bunker.',
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=1280&auto=format&fit=crop',
    tags: ['techno', 'underground'],
  },

  // ——— Lake Balaton ———
  {
    id: 'p4',
    name: 'Silver Shore Club',
    location: { lat: 46.9062, lng: 18.0491 }, // Siófok
    address: 'Petőfi sétány 10',
    city: 'Siófok',
    description: 'Beachfront stage with sunset sessions and late-night DJs.',
    image: 'https://images.unsplash.com/photo-1526483360412-f4dbaf036963?q=80&w=1280&auto=format&fit=crop',
    tags: ['beach', 'house', 'sunset'],
  },
  {
    id: 'p5',
    name: 'Füred Pier Lounge',
    location: { lat: 46.9606, lng: 17.8710 }, // Balatonfüred
    address: 'Tagore sétány 3',
    city: 'Balatonfüred',
    description: 'Lounge by the marina with mellow grooves and cocktails.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1280&auto=format&fit=crop',
    tags: ['lounge', 'deep house', 'marina'],
  },
  {
    id: 'p6',
    name: 'Keszthely Waves',
    location: { lat: 46.7680, lng: 17.2430 }, // Keszthely
    address: 'Balaton-part 1',
    city: 'Keszthely',
    description: 'Open-air dancefloor a few steps from the water.',
    image: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?q=80&w=1280&auto=format&fit=crop',
    tags: ['open-air', 'tech-house', 'lake'],
  },

  // ——— Székesfehérvár ———
  {
    id: 'p7',
    name: 'Fehérvár Hall',
    location: { lat: 47.1860, lng: 18.4221 },
    address: 'Palotai út 12',
    city: 'Székesfehérvár',
    description: 'Mid-size venue for bass nights and live electronic shows.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1280&auto=format&fit=crop',
    tags: ['bass', 'drum & bass', 'live'],
  },

  // ——— Another city: Szeged ———
  {
    id: 'p8',
    name: 'Szeged Riverside',
    location: { lat: 46.2530, lng: 20.1414 },
    address: 'Tisza-part 5',
    city: 'Szeged',
    description: 'Neon-lit riverside terrace with synth and retro nights.',
    image: 'https://images.unsplash.com/photo-1520975693415-1a?ixlib=rb-4.0.3&q=80&w=1280&auto=format&fit=crop',
    tags: ['synthwave', 'retro', 'terrace'],
  },
  // ——— New test: Budapest home locations ———
  {
    id: 'p9',
    name: 'Dénes Pince',
  location: { lat: 47.408248, lng: 19.015077 }, // exact provided
    address: 'Lépcsős utca 4',
    city: 'Budapest',
    description: 'Cozy basement hangout for intimate home gatherings.',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1280&auto=format&fit=crop',
    tags: ['chill', 'basement', 'friendly'],
  },
  {
    id: 'p10',
    name: 'Bence Terasz',
  location: { lat: 47.424137, lng: 19.014703 }, // exact provided
    address: 'Zakariás József utca 5',
    city: 'Budapest',
    description: 'Private terrace vibe overlooking the quiet suburban streets.',
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1280&auto=format&fit=crop',
    tags: ['chill', 'terrace', 'friendly'],
  },
  // New pub test location
  {
    id: 'p11',
    name: 'Poldi Bácsi Sörözö',
    location: { lat: 47.4408014178659, lng: 19.02280223577477 },
  address: 'Ady Endre út 95',
    city: 'Budapest',
    description: 'Cozy local pub for socializing and late-night sessions.',
    image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=1280&q=80',
    tags: ['alter', 'techno', 'socializing', 'pub'],
  },
]

export const performers: Performer[] = [
  // existing
  {
    id: 'a1',
    name: 'DJ Aurora',
    genre: 'Melodic Techno',
    bio: 'Budapest-based DJ known for atmospheric sets and sunrise closers.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1280&auto=format&fit=crop',
    links: [
      { type: 'instagram', url: 'https://instagram.com/djaurora' },
      { type: 'website', url: 'https://aurora.example.com' },
    ],
  },
  {
    id: 'a2',
    name: 'MC Lumen',
    genre: 'Hip-Hop',
    bio: 'High-energy MC bringing the party to life.',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1280&auto=format&fit=crop',
  },
  {
    id: 'a3',
    name: 'Klang Duo',
    genre: 'House',
    bio: 'Back-to-back house duo with classic grooves.',
    image: 'https://images.unsplash.com/photo-1548429859-7e7456e610b7?q=80&w=1280&auto=format&fit=crop',
  },

  // new
  {
    id: 'a4',
    name: 'DJ Balcsi',
    genre: 'Beach House',
    bio: 'Feel-good beach house inspired by Balaton sunsets.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1280&auto=format&fit=crop',
  },
  {
    id: 'a5',
    name: 'Vibe Knights',
    genre: 'Drum & Bass',
    bio: 'Two-person DnB unit known for tight rollers.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1280&auto=format&fit=crop',
  },
  {
    id: 'a6',
    name: 'Szeged Synth',
    genre: 'Synthwave',
    bio: 'Retro-futurist live act with neon-soaked arps.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1280&auto=format&fit=crop',
  },
]

export const events: Event[] = [
  // existing
  {
    id: 'e1',
    title: 'Sunset Sessions',
    placeId: 'p1',
    description: 'Open-air evening by the river with melodic vibes.',
    start: new Date(Date.now() + 86400000).toISOString(),
    end: new Date(Date.now() + 86400000 * 2).toISOString(),
    image: 'https://images.unsplash.com/photo-1540040582279-4d6cdf2d1b8b?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a1'],
    price: '€15',
  kind: 'disco',
  },
  {
    id: 'e2',
    title: 'Basement Breaks',
    placeId: 'p2',
    description: 'Indie and alt mixes in the classic ruin bar setting.',
    start: new Date(Date.now() + 86400000 * 3).toISOString(),
    end: new Date(Date.now() + 86400000 * 3 + 4 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a3'],
    price: 'Free',
  kind: 'alter',
  },
  {
    id: 'e3',
    title: 'Warehouse All-Nighter',
    placeId: 'p3',
    description: 'Raw, pounding techno until sunrise.',
    start: new Date(Date.now() + 86400000 * 5).toISOString(),
    end: new Date(Date.now() + 86400000 * 6).toISOString(),
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a1', 'a2'],
    price: '€20',
  kind: 'techno',
  },

  // new — Lake Balaton
  {
    id: 'e4',
    title: 'Shoreline Sunset',
    placeId: 'p4',
    description: 'Beach house and chilled grooves as the sun dips over Balaton.',
    start: new Date(Date.now() + 86400000 * 2 + 18 * 3600000).toISOString(), // ~2 days, 18:00
    end: new Date(Date.now() + 86400000 * 3 + 1 * 3600000).toISOString(),    // ~next day 01:00
    image: 'https://images.unsplash.com/photo-1515706886582-54c73c5eaf41?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a4'],
    price: 'HUF 4,500',
  kind: 'festival',
  },
  {
    id: 'e5',
    title: 'Pier Nights',
    placeId: 'p5',
    description: 'Deep house on the pier with mellow lights and the marina breeze.',
    start: new Date(Date.now() + 86400000 * 4 + 20 * 3600000).toISOString(), // ~4 days, 20:00
    end: new Date(Date.now() + 86400000 * 5 + 2 * 3600000).toISOString(),    // ~next day 02:00
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a1', 'a4'],
    price: 'HUF 3,900',
  kind: 'disco',
  },
  {
    id: 'e6',
    title: 'Waves Afterdark',
    placeId: 'p6',
    description: 'Tech-house rhythms with the lake at your feet.',
    start: new Date(Date.now() + 86400000 * 6 + 22 * 3600000).toISOString(), // ~6 days, 22:00
    end: new Date(Date.now() + 86400000 * 7 + 5 * 3600000).toISOString(),    // ~next day 05:00
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a3'],
    price: 'HUF 5,200',
  kind: 'techno',
  },

  // new — Székesfehérvár
  {
    id: 'e7',
    title: 'Fehérvár Bassline',
    placeId: 'p7',
    description: 'Local DnB heads unite for a night of rollers and halftime.',
    start: new Date(Date.now() + 86400000 * 3 + 21 * 3600000).toISOString(), // ~3 days, 21:00
    end: new Date(Date.now() + 86400000 * 4 + 3 * 3600000).toISOString(),    // ~next day 03:00
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a5'],
    price: 'HUF 3,500',
  kind: 'alter',
  },

  // new — Szeged
  {
    id: 'e8',
    title: 'Tisza Neon Ride',
    placeId: 'p8',
    description: 'Neon synthwave night on the riverfront.',
    start: new Date(Date.now() + 86400000 * 8 + 20 * 3600000).toISOString(), // ~8 days, 20:00
    end: new Date(Date.now() + 86400000 * 9 + 2 * 3600000).toISOString(),    // ~next day 02:00
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1280&auto=format&fit=crop',
    performerIds: ['a6'],
    price: 'HUF 4,200',
  kind: 'jazz',
  },
  // New test events (home party kind)
  {
    id: 'e9',
    title: 'Buli a pincébe',
    placeId: 'p9',
    description: 'Laid-back basement home party with friendly crowd.',
    start: new Date(Date.now() + -1 * 3600000).toISOString(), // ~2 days 21:00
    end: new Date(Date.now() + 86400000 * 3 + 2 * 3600000).toISOString(),     // ~next day 02:00
  image: 'https://images.unsplash.com/photo-1646184466560-f81b1e495604?auto=format&fit=crop&w=1280&q=80', // updated basement image
    performerIds: [],
    price: 'Free',
  kind: 'home', // new home party event type
  },
    {
        id: 'e15',
        title: 'Masik Buli a pincébe',
        placeId: 'p9',
        description: 'Laid-back basement home party with friendly crowd.',
        start: new Date(Date.now() + 86400000 * 3 + 2 * 3600000).toISOString(), // ~2 days 21:00
        end: new Date(Date.now() + 86400000 * 3 + 5 * 3600000).toISOString(),     // ~next day 02:00
        image: 'https://images.unsplash.com/photo-1646184466560-f81b1e495604?auto=format&fit=crop&w=1280&q=80', // updated basement image
        performerIds: [],
        price: 'Free',
        kind: 'home', // new home party event type
    },
  {
    id: 'e10',
    title: 'Terasz Buli',
    placeId: 'p10',
    description: 'Chill terrace evening with good friends and mellow tunes.',
    start: new Date(Date.now() + 86400000 * 4 + 19 * 3600000).toISOString(), // ~4 days 19:00
    end: new Date(Date.now() + 86400000 * 5 + 1 * 3600000).toISOString(),     // ~next day 01:00
  image: 'https://images.unsplash.com/photo-1667992403195-d2241a40ca2d?auto=format&fit=crop&w=1280&q=80', // fixed terrace image (was broken ID)
    performerIds: [],
    price: 'Free',
  kind: 'home', // new home party event type
  },
  // New pub event
  {
    id: 'e11',
    title: 'Mértékkel ivás',
    placeId: 'p11',
    description: 'Deep session of social drinking and beats.',
    start: new Date(Date.now() + 86400000 * 2 + 20 * 3600000).toISOString(), // ~2 days 20:00
    end: new Date(Date.now() + 86400000 * 3 + 2 * 3600000).toISOString(),     // ~next day 02:00
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1280&q=80',
    performerIds: [],
    price: 'Free',
    kind: 'pub',
  },
]
