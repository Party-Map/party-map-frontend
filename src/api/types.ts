// The API's shapes, as named in the app. Every type here is an alias of the schema generated from the backend's
// OpenAPI document (pnpm api:types), never a hand-written copy: when the backend changes, tsc points at the code
// to update.
import type { components, operations } from "./schema";

type Schemas = components["schemas"];
/** The query parameters of a GET operation, by its operationId. */
type Query<O extends keyof operations> = NonNullable<operations[O]["parameters"]["query"]>;

export type ID = string;

export type GeoPoint = Schemas["GeoPointDto"];
export type Link = Schemas["LinkDto"];
export type LinkType = Link["type"];
export type EventType = Schemas["EventDto"]["kind"];
export type InvitationState = Schemas["EventPlanLineupInvitationDto"]["state"];
export type SearchHitType = Schemas["SearchHitDto"]["type"];

/** The liked-thing segment of the /api/me/likes paths. */
export type LikeTarget = "events" | "places" | "performers";

// Every value of an enum, in display order. `satisfies Record<…>` makes tsc fail when the API adds or drops one.
const LINK_TYPE_ORDER = { INSTAGRAM: 0, FACEBOOK: 1, TWITTER: 2, REDDIT: 3, WEBSITE: 4 } satisfies Record<
    LinkType,
    number
>;
const EVENT_TYPE_ORDER = {
    DISCO: 0,
    TECHNO: 1,
    FESTIVAL: 2,
    JAZZ: 3,
    ALTER: 4,
    HOME: 5,
    PUB: 6,
} satisfies Record<EventType, number>;
export const LINK_TYPES = Object.keys(LINK_TYPE_ORDER) as LinkType[];
export const EVENT_TYPES = Object.keys(EVENT_TYPE_ORDER) as EventType[];

export type Place = Schemas["PlaceDto"];
export type Performer = Schemas["PerformerDto"];
export type Event = Schemas["EventDto"];
export type LineupItem = Schemas["EventLineupItemDto"];
export type EventPlan = Schemas["EventPlanDto"];
export type EventPlanPlaceInvitation = Schemas["EventPlanPlaceInvitationDto"];
export type EventPlanLineupInvitation = Schemas["EventPlanLineupInvitationDto"];

export type LikedEventsGrouped = Schemas["LikedEventsGroupedDto"];
export type LikeStatus = Schemas["LikeStatusDto"];
export type UpcomingEventByPlace = Schemas["PlaceUpcomingEventDto"];
export type SearchHit = Schemas["SearchHitDto"];
export type SearchResponse = Schemas["SearchResponseDto"];

export type PlaceListItem = Schemas["PlaceAdminListItemDto"];
export type PerformerListItem = Schemas["PerformerAdminListItemDto"];
export type OwnedEventListItem = Schemas["EventAdminListItemDto"];
export type EventPlanListItem = Schemas["EventPlanAdminListItemDto"];
export type PlaceInvitationRequest = Schemas["EventPlanPlaceInvitationWithDateDto"];
export type PerformerInvitationRequest = Schemas["EventPlanLineupInvitationForPerformerDto"];

export type BrowseEventItem = Schemas["BrowseEventItemDto"];
export type BrowseEventsPage = Schemas["BrowseEventsPageDto"];
export type BrowsePlaceItem = Schemas["BrowsePlaceItemDto"];
export type BrowsePlacesPage = Schemas["BrowsePlacesPageDto"];
export type BrowsePerformerItem = Schemas["BrowsePerformerItemDto"];
export type BrowsePerformersPage = Schemas["BrowsePerformersPageDto"];
export type TagCount = Schemas["TagCountDto"];
export type GenreCount = Schemas["GenreCountDto"];
export type BrowseEventsQuery = Query<"events">;
export type BrowsePlacesQuery = Query<"places">;
export type BrowsePerformersQuery = Query<"performers">;

export type AdminUser = Schemas["AdminUserDto"];
export type AdminUserPage = Schemas["AdminUserPageDto"];

export type PlacePayload = Schemas["PlaceCreateDto"];
export type PerformerPayload = Schemas["PerformerCreateDto"];
export type EventPlanPayload = Schemas["EventPlanCreateDto"];
export type LineupInvitationPayload = Schemas["EventPlanLineupInvitationCreatePayloadDto"];
