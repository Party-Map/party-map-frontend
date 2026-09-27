# Contributing to the Party Map frontend

A single-page React application built with Vite. No framework magic: React Router for routes,
plain CSS Modules for styling, `fetch` for data, keycloak-js for authentication.

## Layout

```
src/
  main.tsx            bootstrap (creates the Keycloak client, mounts <App>)
  app/                providers (theme, toast, highlight), router, root layout
  components/         shared UI kit (Button, Card, Field, PageShell, TopBar, SearchBar, ...)
  features/<name>/    one folder per product area: pages, feature components, their CSS modules and tests
  pages/              small standalone pages (404, logged out)
  lib/
    api/              typed API functions, one file per backend controller (client.ts does the fetching)
    auth/             Keycloak wrapper (keycloak.ts), AuthProvider/useAuth, roles
    hooks/            useResource (async data), useDebouncedValue
    dates.ts          all date formatting (Intl, no library)
    types.ts          domain types mirroring backend DTOs
  styles/             tokens.css (design tokens, light/dark), reset.css, global.css
  test/               setup, render helpers, API mock, fixtures, leaflet mock
e2e/                  Playwright: auth setup, flows, visual baselines
```

## Rules

- **Components**: function components, props typed inline or with a local `type Props`. One component per
  file, named export, file name equals component name. Feature pages end with `Page`.
- **Styling**: every component owns a `Name.module.css`. Use the tokens from `styles/tokens.css`
  (`var(--accent)`, `var(--space-4)`, ...), never raw hex colours or magic pixel values. Dark mode is
  automatic through the tokens; do not write theme-specific selectors in components unless the
  token model cannot express it. No inline `style` except for values computed at runtime (map positions).
- **Data**: pages call `useResource(() => fetchX(id), [id])` and render `LoadingState` / `ErrorState`
  / content. Mutations call the `lib/api` function directly, then `toast` and `reload()` or `navigate`.
  Never call `fetch` outside `lib/api`.
- **Auth**: read `useAuth()` for `status`, `user`, `roles`, `hasRole`, `isAdmin`, `login`, `logout`.
  Gate pages with `RequireAuth` (signed in) or `RequireRole` (admin role).
- **Effects**: `react-hooks/set-state-in-effect` is an error. Derive state during render, use lazy
  `useState` initialisers, or remount with a `key` instead of syncing state in effects.
- **Types**: `strict` and `noUncheckedIndexedAccess` are on. No `any`, no non-null assertions on data
  from the network; narrow explicitly.
- **Tests**: every component and module has a `*.test.tsx|ts` beside it. Use `renderWithProviders`,
  `mockApi`, fixtures and the leaflet mock from `src/test`. Coverage gates: 90 % lines, statements and
  functions, 80 % branches (`pnpm test:coverage`).
- **Done means**: `pnpm check` is green (eslint, tsc, tests with coverage) and UI changes were
  screenshot-checked at phone and desktop widths in light and dark mode.

## Commands

```bash
pnpm dev             # http://localhost:3000 (backend on :8080, Keycloak on :8081)
pnpm check           # lint + typecheck + tests with coverage
pnpm test            # watch mode
pnpm build && pnpm preview
pnpm e2e             # Playwright (needs the full stack running)
```
