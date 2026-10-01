import type {
    AdminUser,
    AdminUserPage,
    BrowseEventItem,
    BrowseEventsPage,
    BrowsePerformerItem,
    BrowsePerformersPage,
    BrowsePlaceItem,
    BrowsePlacesPage,
    Event,
    EventPlan,
    GenreCount,
    Performer,
    Place,
    SearchHit,
    TagCount,
    UpcomingEventByPlace,
} from "@/api/types";

export const place: Place = {
    id: "place-1",
    name: "A38 Hajó",
    location: { latitude: 47.4771, longitude: 19.0621 },
    address: "Petőfi híd budai hídfő",
    city: "Budapest",
    description: "Concert ship on the Danube.",
    image: "https://images.example/a38.jpg",
    tags: ["concert", "ship", "techno"],
    links: [{ type: "WEBSITE", url: "https://a38.hu" }],
};

export const place2: Place = {
    id: "place-2",
    name: "Dürer Kert",
    location: { latitude: 47.5039, longitude: 19.0871 },
    address: "Öböl utca 1",
    city: "Budapest",
    description: "Open air venue.",
    image: "https://images.example/durer.jpg",
    tags: ["garden"],
    links: [],
};

export const performer: Performer = {
    id: "performer-1",
    name: "DJ Test",
    genre: "techno",
    bio: "Plays records.",
    image: "https://images.example/dj.jpg",
    links: [{ type: "INSTAGRAM", url: "https://instagram.com/djtest" }],
};

export const event: Event = {
    id: "event-1",
    title: "Techno Night",
    placeId: place.id,
    description: "All night long.",
    start: "2030-06-01T20:00:00",
    end: "2030-06-02T04:00:00",
    image: "https://images.example/night.jpg",
    price: "3000",
    kind: "TECHNO",
    lineupItems: [{ startTime: "2030-06-01T22:00:00", endTime: "2030-06-02T00:00:00", performer }],
    links: [{ type: "FACEBOOK", url: "https://facebook.com/events/1" }],
};

export const upcoming: UpcomingEventByPlace = {
    placeId: place.id,
    eventId: event.id,
    title: event.title,
    image: event.image,
    start: event.start,
    kind: event.kind,
};

export const searchHits: SearchHit[] = [
    {
        id: place.id,
        type: "PLACE",
        title: place.name,
        subtitle: place.city,
        image: place.image,
        nextEventStart: event.start,
        placeId: null,
    },
    {
        id: event.id,
        type: "EVENT",
        title: event.title,
        subtitle: place.name,
        image: event.image,
        nextEventStart: event.start,
        placeId: place.id,
    },
    {
        id: performer.id,
        type: "PERFORMER",
        title: performer.name,
        subtitle: performer.genre,
        image: performer.image,
        nextEventStart: null,
        placeId: null,
    },
];

export const eventPlan: EventPlan = {
    id: "plan-1",
    title: "Summer Opening",
    description: "Season opener.",
    startDateTime: "2030-07-01T18:00:00",
    endDateTime: "2030-07-02T02:00:00",
    price: "2500",
    kind: "DISCO",
    image: "https://images.example/plan.jpg",
    links: [],
    placeInvitation: null,
    lineupInvitations: [],
};

export const adminUser: AdminUser = {
    id: "user-1",
    username: "jane@example.com",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    enabled: true,
    roles: ["place_manager_user"],
};

export const adminUser2: AdminUser = {
    id: "user-2",
    username: "bob@example.com",
    email: null,
    firstName: null,
    lastName: null,
    enabled: false,
    roles: [],
};

export const adminUserPage: AdminUserPage = { items: [adminUser, adminUser2], total: 2, page: 0, size: 20 };

export const browseEvent: BrowseEventItem = {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    kind: event.kind,
    image: event.image,
    price: event.price,
    place: { id: place.id, name: place.name, city: place.city, location: place.location },
    distanceKm: 3.2,
};

export const browseEvent2: BrowseEventItem = {
    id: "event-2",
    title: "Jazz Brunch",
    start: "2030-06-08T11:00:00",
    end: "2030-06-08T14:00:00",
    kind: "JAZZ",
    image: null,
    price: null,
    place: { id: place2.id, name: place2.name, city: place2.city, location: place2.location },
    distanceKm: 12.5,
};

export const browseEventsPage: BrowseEventsPage = { items: [browseEvent, browseEvent2], total: 2, page: 0, size: 20 };

export const browsePlace: BrowsePlaceItem = {
    id: place.id,
    name: place.name,
    city: place.city,
    address: place.address,
    image: place.image,
    tags: place.tags,
    location: place.location,
    distanceKm: 1.2,
};

export const browsePlace2: BrowsePlaceItem = {
    id: place2.id,
    name: place2.name,
    city: place2.city,
    address: place2.address,
    image: place2.image,
    tags: place2.tags,
    location: place2.location,
    distanceKm: null,
};

export const browsePlacesPage: BrowsePlacesPage = { items: [browsePlace, browsePlace2], total: 2, page: 0, size: 20 };

export const browsePerformer: BrowsePerformerItem = {
    id: performer.id,
    name: performer.name,
    genre: performer.genre,
    image: performer.image,
};

export const browsePerformersPage: BrowsePerformersPage = { items: [browsePerformer], total: 1, page: 0, size: 20 };

export const placeTags: TagCount[] = [
    { tag: "techno", count: 3 },
    { tag: "garden", count: 1 },
];

export const performerGenres: GenreCount[] = [
    { genre: "techno", count: 2 },
    { genre: "house", count: 1 },
];
