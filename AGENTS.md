# Party Map frontend: notes for coding agents

A client-rendered React 19 SPA (Rsbuild, no SSR) for a map of events, with an admin area for place managers,
performer managers and event organizers. It talks to the Spring Boot API under `/api` and signs in through Keycloak.
Read this file before changing anything; the human summary is in [README.md](README.md).

## Definition of done

Every change, however small:

1. Ships with tests beside the code (`X.test.tsx`); a bug fix starts with a failing test.
2. Passes `pnpm check` with no errors and no warnings (deps, eslint, stylelint, tsc, unused classes, Vitest with
   coverage >= 90 % lines/statements/functions and >= 80 % branches, build). Thresholds are never lowered and
   exclusions never widened.
3. If it changes the UI: is looked at in a real browser, at phone (390 px) and desktop (1440 px) width, in light and
   dark mode (Playwright screenshots, `pnpm e2e:visual`; update baselines with `pnpm e2e:update` only on purpose).
4. The report quotes the test count, coverage and the gate results.

## Commands

```bash
pnpm dev                 # :3000, proxies /api to API_URL (default http://localhost:8080)
pnpm check               # all gates + build
pnpm test:react          # watch mode; --run --coverage for the gate
pnpm e2e                 # needs the backend stack (docker compose up in ../party-map-backend)
pnpm api:types           # after copying the backend's build/openapi.json to openapi.json
```

pnpm only; never edit `pnpm-lock.yaml` by hand. Install the latest release of a package (`pnpm add x@latest`);
peer-range and build-script decisions live in `pnpm-workspace.yaml` with a comment each.

## Where things go (the boundaries are the architecture)

`eslint-plugin-boundaries` (see `boundaries.config.js`) rejects imports the layering does not allow:

| Folder                                       | May import                                            | Holds                                                                                |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/`                                       | lib (+ API types, type-only)                          | env, theme, toast, format, geocode, constants, utils                                 |
| `api/`                                       | api, auth, lib                                        | client, generated `schema.d.ts`, `types.ts` aliases, fetchers, `keys.ts`, `hooks.ts` |
| `auth/`                                      | auth, api, components, lib                            | keycloak wrapper, provider, roles, session, session-ended dialog                     |
| `components/`                                | components, lib (+ API types)                         | shared UI and shared modules (`forms`, `typography`, `layout`, `primitives`)         |
| `layout/`                                    | layout, api, auth, components, lib                    | app chrome, search, sign-in gates, toaster                                           |
| `map/`                                       | map, layout, api, auth, components, lib (+ API types) | Leaflet map, pins, labels                                                            |
| `pages/`                                     | everything above                                      | one folder per area; `pages/admin/shared` for admin-only parts                       |
| `main.tsx`, `app.tsx`, `routes.tsx`, `test/` | anything                                              | wiring                                                                               |

A new top-level folder under `src/` is declared in `boundaries.config.js` first. Imports across folders use `@/`,
within a folder they are relative. Named exports, function components, one component per file, pages end in `Page`,
routes use `Component:` (the admin area is lazy-loaded). Each file opens with a short comment on what it is and why.

## API: the shapes come from the API

- `src/api/schema.d.ts` is generated; never edit it and never hand-write an API shape. `api/types.ts` only aliases
  `components["schemas"]` (`Place = PlaceDto`, ...). When the backend changes, regenerate and let tsc point at the
  code to fix.
- Fetchers (`api/places.ts`, ...) call typed paths through `client` and `unwrap()` (non-2xx -> `ApiError` with
  `status` and `body`). The client's base is `PUBLIC_API_BASE` without its `/api` (the schema's paths carry it).
- Components read server state through `api/hooks.ts`: one query hook per read, one mutation hook per write. Query
  keys are the factories in `api/keys.ts`; a mutation invalidates the key families it changes. Pages render
  `isPending` -> `LoadingState`, `ApiError` 404 -> `NotFoundPage`, other errors -> `ErrorState` with `refetch`.
- Reads retry once, never on a 4xx. Every API error is an RFC 9457 problem (`status`, `detail`, and `errors[]` of
  `{ field, message }` for invalid bodies); `messageOf(error, fallback)` shows its `detail`/`title`. Mutations without
  a result answer 204 (the fetcher resolves to `undefined`).
- The map loads only the places around the viewport: `map/ViewportWatcher` reports a padded, grid-snapped
  `bbox` (`map/geo.ts` `toBbox`) on mount and after every move, `usePlaces(bbox)` keeps the previous pins while the
  next area loads, and highlighted places outside it come from `usePlacesById`. `FitToHighlights` fits once per
  highlight set, after all of them have loaded.
- `lib/geocode.ts` (Nominatim) is the only other network access; nothing else calls `fetch`.

## Auth

- keycloak-js with the public client `partymap-web` (PKCE S256, `check-sso`, tokens in memory, silent SSO through
  `public/silent-check-sso.html`). `useAuth()` gives `status`, `user`, `roles`, `hasRole`, `isAdmin`, `login`,
  `logout`, `accountUrl`. Gate pages with `layout/RequireAuth` or `pages/admin/RequireRole`.
- `auth/session.ts`: when a signed-in session ends (the token cannot be refreshed, or the API answers 401 while
  signed in) the `SessionEndedDialog` opens (Sign in / Refresh) and the refused call waits (`pending()`). A 401 while
  anonymous is an ordinary error. Page navigation goes through `browser` so tests can spy on it.
- The backend is a stateless JWT resource server, so there is no cookie session and no CSRF header.

## Styles: one CSS Module per part, tokens not literals

- `X.module.scss` beside `X.tsx`, kebab-case classes in SCSS, camelCase keys in TS (`styles.navItem`). The build's
  typed-CSS-modules plugin writes `X.module.scss.d.ts`; commit them (CI fails when they are stale).
- Per-part modules wrap their rules in `@layer parts`, shared modules in `@layer components`; `styles/base.scss`
  (the only global sheet) declares the layers and holds the tokens (`@layer base`), the `.dark` theme values and the
  reset. `map/leaflet.scss` is the one other global sheet (Leaflet renders its own markup), deliberately unlayered.
- No literal colour, font size, radius or duration outside `base.scss`: use `var(--token)` or `fade(token, 20%)`
  from `@use "@/styles/mixins" as *;`, which also has the breakpoints (`phone`, `narrow`, `from-sm`, `from-md`,
  `desktop`) and `reduced-motion`. Stylelint enforces most of it.
- A class chosen from data comes from a lookup map of literal keys (`{ sm: styles.sm, md: styles.md }`), never a
  template string: `pnpm lint:classes` reports classes nothing reads.
- Class names are hashed in production: to restyle another module's element, select a data attribute; tests query
  by role, label or `data-testid` (Vitest compiles the modules, so unit tests see the class names as written).
- Theme: `lib/theme.ts` puts `.dark` and `color-scheme` on `<html>` (light/dark/system in `localStorage.theme`,
  following the system while nothing is chosen); `index.html` applies the same rule before first paint.
- Inline `style` only for values computed at runtime (the map labels).

Token names are the app's own; the prompt's shadcn names map onto them: `--background` = `--bg`, `--foreground` =
`--fg`, `--primary` = `--accent` (with `--accent-fg`), `--card` = `--surface`, `--muted-foreground` = `--fg-muted`,
`--destructive` = `--danger`, `--ring` and `--radius` exist as aliases. The type scale is `--text-9` ... `--text-28`
(named by pixel size), motion is `--duration-fast/base/slow` with `--ease`.

## UI building blocks

- Base UI is used headless under the app's classes: `components/primitives.tsx` (`AlertDialog`), `ConfirmDialog`,
  the session-ended dialog, the likes tabs (`@base-ui/react/tabs`). Its guide for agents is `.rules/base-ui.md`.
- Search: `layout/SearchBar.tsx` is a cmdk list over `useSearch`; arrow keys choose a hit, Enter picks the chosen
  hit or, with none chosen, commits the query to `?q=`.
- Toasts: `import { toast } from "@/lib/toast"` (sonner behind it, `layout/AppToaster.tsx` renders them).
- Forms: react-hook-form with a zod schema (`pages/admin/shared/formSchemas.ts` for the shared pieces, one-line text
  capped at the API's 255 characters), messages under the fields, `setError("root")` for a failed save, `Controller`
  for composite fields. Admin create/edit forms are step forms (below).
- Dates: `lib/format.ts` (date-fns); the backend sends zone-less local times.

## Admin area

- `pages/admin/domains.ts` is the one table of admin domains (Places, Performers, Events, Platform; one role each),
  their sidebar sections and the route patterns that count as each section. A new admin feature is an entry there
  plus its routes in `pages/admin/routes.tsx` (lazy `page(() => import(...), "XPage")`); `routes.test.tsx` opens every
  section, so a section without a page fails.
- Places and performers also have an `entity` scope in `domains.ts`: each item gets its own area at
  `<basePath>/:id` (Overview), `/:id/requests`, `/:id/edit`, chosen with a second header switcher
  (`shell/EntitySwitcher`: all items, yours, new). `shell/useAdminNav.ts` builds the sidebar model (domain sections, or
  the item's sections with "All …", a pending-requests badge and its public page); `useAdminEntities` loads the items
  only for users with the domain's role.
- Links from the admin area to public pages open in a new tab (`shell/PublicPageLink`, `DataTable external`).
- `shell/AdminShell` is the `/admin` route element: auth states (deep-link `returnTo`), then `AdminHeader` (brand,
  `DomainSwitcher` and `UserMenu` on Base UI Menu, theme), `AdminSidebar` (a Base UI Drawer on phones) and the
  outlet. Pages render inside `shell/AdminPage` (breadcrumbs, the only `h1`, description, actions) and still guard
  themselves with `RequireRole`.
- Lists: `shared/DataTable` (a table on wide screens, cards on phones, the primary column is the row link),
  `shared/StatusChip` / `InvitationStateChip`, `shared/Pager`, `shared/RequestList` over `shared/requests.ts` (place and
  performer invitations normalised to one shape). Overview pages use `shell/StatCard` and `shared/overview.module.scss`.
- Step forms: `shared/stepper/StepForm` takes a zod schema, `steps` (`{ id, title, fields, render }`), default
  values, a review `summary` and `onSubmit`; create mode unlocks steps in order, edit mode opens any step, saving
  re-validates and opens the first failing step, and `UnsavedChangesGuard` asks before leaving (it needs a data
  router). Step bodies read the form with `useFormContext`/`useWatch`. Each form keeps its schema, defaults, payload
  mapping and review rows in a tested `*FormSchema.ts` (not `xForm.ts`: macOS treats `placeForm.ts` and
  `PlaceForm.tsx` as the same name).
- Event plans open as a workspace (`events/EventPlanPage`): venue, lineup, `PublishChecklist` from the pure
  `planReadiness.ts`, details with their own edit page. Publish stays disabled until the checklist is complete.
- Platform (`partymap_admin`): `platform/UsersPage` (search and page in the URL) and `UserDetailPage` with
  `RoleSwitches`; roles change in Keycloak through `/api/admin/users`, and reach the user's token at their next
  sign-in or refresh.

## Tests

- Vitest + Testing Library + jsdom; helpers in `src/test`: `renderWithProviders` (auth, a fresh QueryClient without
  retries, toaster, memory router; `dataRouter: true` mounts a `createMemoryRouter` instead, which `useBlocker` and
  so every step form needs), `mockApi` (a table of `"METHOD /api/path"` answers; every request is recorded in
  `fetchMock.requests` with method, URL, headers and parsed body), fixtures, and the Leaflet mock
  (`vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock))`).
- Playwright in `e2e/`: `auth.setup.ts` signs in through Keycloak (and answers the cookie notice),
  `public.spec.ts`, `account.auth.spec.ts`, `admin.auth.spec.ts` (domains, deep-link sign-in, the whole
  plan-invite-accept-publish loop, granting a role on `roles-target@partymap.local`), `admin-phone.auth.spec.ts` and
  `admin-visual.auth.spec.ts` (the `signed-in-phone` project), `visual.spec.ts`. Baselines are per platform and
  git-ignored; create missing ones with `--update-snapshots=missing`.
- Vitest needs Vite as its own dependency; the app itself is built by Rsbuild only.

## Deliberate differences from the scaffold prompt this stack came from

Port 3000 (Keycloak redirect URIs, backend CORS and Playwright use it) instead of 8502; the dev proxy keeps the
`/api` prefix (the backend mounts it); production calls the API cross-origin (`PUBLIC_API_BASE`); keycloak-js
instead of a cookie session; ESLint 10 (react and jsx-a11y plugins through `@eslint/compat`); TypeScript 5.9 (the
newest typescript-eslint supports); the app's token names; only the libraries the app uses (no charts, markdown,
SSE, zustand or tables yet).
