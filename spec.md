# Spec — Momento mobile app (frontend)

> Status: **APPROVED (2026-11-06)**. Phase 2 of the workflow. Implements [intent.md](intent.md), following the
> design direction in [design/README.md](design/README.md). The backend is documented in the
> `momento-planner-api` repo (`docs/API-REFERENCE.md`, `docs/openapi.yaml`).
> Expo facts below were checked against the **SDK 58** docs on 2026-11-06.

## 1. Architecture overview

> **Superseded by §12 (2026-11-10).** The diagram below shows the original layout; the code now uses layered features.
> See §12 and [docs/architecture.md](docs/architecture.md).

```
┌──────────────────────────── Expo app (SDK 58, React Native 0.88) ─────────────────────────────┐
│  src/app/ (Expo Router: screens only)                                                          │
│     │ uses                                                                                     │
│  src/features/*  (hooks + feature components: auth, events, saved-events, personalize, settings)│
│     │                                        │                                                 │
│  src/api/  typed fetch client ───────────────┼──── TanStack Query cache (server data)            │
│     │  Bearer token, single-flight refresh   │                                                 │
│  src/lib/  session · storage · calendar · i18n · theme                                          │
│     │            │             │                                                               │
│  SecureStore  AsyncStorage  device calendar (expo-calendar)                                    │
└─────┼────────────────────────────────────────────────────────────────────────────────────────┘
      │ HTTPS  (EXPO_PUBLIC_API_URL, e.g. the ngrok static domain)
      ▼
  Momento Planner API (/api/v1)
```

- **Thin client:** all data comes from our API. The app never calls Ticketmaster or Claude and holds no third-party
  keys.
- **Screens stay thin:** route files in `src/app/` only lay out the screen. Data loading and logic live in
  `src/features/*` hooks.
- **Two kinds of state:** *server state* (events, profile, saved events) is cached and refreshed by TanStack Query.
  *Client state* (session, theme, language, calendar entry ids) lives in small stores persisted on the device.

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 58**, React 19.3, React Native 0.88, TypeScript strict, React Compiler (already on) | Existing project |
| Navigation | **Expo Router** with **`Stack.Protected`** guards; native tabs (`expo-router/native-tabs`) | File-based routes (AGENTS.md). Protected routes are the documented SDK 58 auth pattern. |
| Server data | **TanStack Query v5** | Caching, loading/error states, infinite scrolling for event lists, retries, refetch on focus, cache updates after mutations |
| HTTP | **`fetch` wrapper** in `src/core/api/http-client.ts`. **No axios.** | ~40 lines cover what axios would add: base URL, Bearer token, ngrok header, JSON handling, a 15 s timeout (`AbortController`), one-at-a-time token refresh, and `ApiError { code, message, details }` for non-2xx responses |
| Offline | **TanStack Query persistence** (`@tanstack/react-query-persist-client` + the AsyncStorage persister), **saved events only** | My Events opens instantly offline. Save and remove actions done offline are queued and sent when back online. WatermelonDB was considered and rejected (§5.2). |
| Logging | `src/core/logger.ts` (no output unless `__DEV__`) + ESLint `no-console` | Release builds print nothing. Tokens and personal data are never logged. |
| CI / CD | **GitHub Actions** (checks on every PR) + **EAS Workflows** (builds) | §9 |
| API types | **`openapi-typescript`**, generated from the backend's `docs/openapi.yaml` into `src/core/api/schema.d.ts` | Request and response types can't drift from the backend contract |
| Forms | **react-hook-form + zod** | Validation rules mirror the backend (password: 8+ characters, a letter and a digit; names 1–50) |
| Client state | **Zustand** with persistence to **AsyncStorage** (`@react-native-async-storage/async-storage`) | Small and explicit. Holds the session (access token in memory only), theme and language choice, and the event id → calendar entry id map. |
| Tokens | **`expo-secure-store`** | Encrypted storage (Android Keystore / iOS Keychain). Works in Expo Go. |
| i18n | **i18next + react-i18next** with **`expo-localization`** | Expo docs list react-i18next as an option. Mature: interpolation and plurals. Device language read with `getLocales()`. |
| Dates | `Intl.DateTimeFormat` with the event's time zone | Recommended by the Expo docs. No date library needed. |
| Theme | Own tokens (light/dark) + the user's choice: **System** (default), Light or Dark | `app.json` `userInterfaceStyle: "automatic"`; `expo-system-ui` is already installed (needed on Android) |
| Fonts | **Poppins** via `@expo-google-fonts/poppins` + the **`expo-font` config plugin** | Matches the reference design. The config plugin is the documented recommended method (needs a dev build). |
| Images | **`expo-image`** (already installed) | Caching and placeholders for event photos |
| Calendar | **`expo-calendar`** (new object API: `ExpoCalendar`, `createEvent`, `event.delete()`) | Writes the personalized event and its reminder to the device calendar |
| Google sign-in | **`@react-native-google-signin/google-signin`** (free version), confirmed in a short spike first (§10) | Recommended by the Expo guide. Needs a dev build. Returns an ID token whose audience is the Web client ID, which the backend checks. |
| Tests | **jest-expo + React Native Testing Library**, lean (core logic plus key flows) | Matches the project's lean-testing preference |
| Builds | **Development build** with **EAS Build** (run by EAS Workflows, §9.3) | `expo-calendar`, Google sign-in and the font plugin don't run in Expo Go |

All packages are added with `npx expo install` so the versions match SDK 58.

## 3. Folder structure

> **Superseded by §12.2 (2026-11-10).** Kept for history; the current structure is in §12.2 and
> [docs/architecture.md](docs/architecture.md).

```
src/
  app/                                Routes only (Expo Router)
    _layout.tsx                       Providers: QueryClient, theme, i18n, session; splash control; root Stack + guards
    (auth)/                           Signed-out screens (guard: !session)
      _layout.tsx
      welcome.tsx                     First screen after splash
      sign-in.tsx · sign-up.tsx
      forgot-password.tsx · reset-password.tsx    UI templates only in Version 1
    (app)/                            Signed-in area (guard: !!session)
      _layout.tsx                     Stack containing the tabs + detail screens
      (tabs)/
        _layout.tsx                   Native tabs: Explore · My Events · Settings
        index.tsx                     Explore: search, category chips, event list
        my-events.tsx
        settings.tsx
      events/[id].tsx                 Event details
      events/[id]/personalize.tsx     Personalize + add to calendar
      settings/profile.tsx            Edit profile, delete account
  features/
    auth/          session store, useSignIn/useSignUp/useGoogleSignIn, form schemas
    events/        useEventSearch (infinite), useEvent, useCategories, EventCard, CategoryChips
    saved-events/  useSavedEvents, useSaveEvent, useRemoveSavedEvent
    personalize/   usePersonalize, buildCalendarNotes, PersonalizeOptions
    settings/      theme + language store, useProfile, useUpdateProfile, useDeleteAccount
  api/
    client.ts      fetch wrapper, token injection, single-flight refresh, ApiError
    schema.d.ts    generated from openapi.yaml (npm run gen:api)
    endpoints.ts   typed functions per endpoint
  lib/
    secure-tokens.ts   refresh token in SecureStore
    calendar.ts        permission, pick or create a writable calendar, create and delete entries
    i18n.ts            i18next setup and language detection
    query-client.ts
  components/ui/   Button, TextField, PasswordField, BackButton, Checkbox, Divider, Screen, EmptyState, ErrorState
  theme/           tokens (colours, spacing, radii, type), ThemeProvider, useTheme
  locales/         en.json · fr.json · sw.json
assets/            fonts are bundled by the plugin; logo, welcome collage photos
```

The template's demo screens (`explore.tsx`, the animated icon, the hint row) are removed.

## 4. Navigation and the auth flow

```
Splash ──▶ restore session (refresh token in SecureStore?)
            ├─ none / refresh fails ──▶ (auth)/welcome ──▶ sign-in | sign-up | Google ──┐
            └─ refreshed OK ─────────────────────────────────────────────────────────┐ │
                                                                                     ▼ ▼
                                                     (app)/(tabs): Explore · My Events · Settings
```

- **Root layout guards:** `<Stack.Protected guard={!session}>` around `(auth)` and `<Stack.Protected guard={!!session}>`
  around `(app)`. Signing in or out flips the guard and Expo Router switches screens. History of the guarded group is
  dropped, so the back button can't return to a signed-in screen after logout.
- **Splash:** `SplashScreen.preventAutoHideAsync()` at module level, then hidden once fonts are loaded, the persisted
  query cache is restored, and the session restore has finished (success or not).
- **Session restore must survive being offline.** "Signed in" means *a refresh token is stored*, not "the last refresh
  succeeded":

  | Refresh result at start-up | What happens |
  |---|---|
  | Success | Signed in, with a fresh access token |
  | `401` (token revoked or expired) | Signed out: tokens and cache cleared, welcome screen |
  | **Network error / timeout / 5xx** | **Stay signed in, offline.** No access token yet; My Events shows the cached copy. The refresh is retried when the connection returns (`onlineManager`), then queued requests run. |

  Without this, opening the app offline would log the user out and throw away the offline copy of My Events.
- Route guards are client-side only (Expo docs). The API still checks every request.

## 5. API client and token handling

- **Base URL:** `process.env.EXPO_PUBLIC_API_URL` (dot notation is required for inlining), e.g.
  `https://satisfiable-nonlethargical-freddy.ngrok-free.dev/api/v1`. It's set in `.env`. It's not secret: it's
  bundled into the app.
- **Every request** sends `Content-Type: application/json`, `ngrok-skip-browser-warning: true` and, when signed in,
  `Authorization: Bearer <accessToken>`.
- **Access token:** in memory only (session store). **Refresh token:** `expo-secure-store` (key `momento.refresh`).
- **On `401 UNAUTHENTICATED`:** run one shared refresh (a single in-flight promise), save the new pair, retry the
  request once. **Only a `401` from the refresh itself signs the user out** (tokens and query cache cleared, guard
  flips to welcome). A network failure during the refresh keeps the session and surfaces as "You're offline". The
  single in-flight refresh avoids the backend's reuse detection logging the user out (backend docs/API.md).
- **Sign out:** `POST /auth/logout { refreshToken }` (best effort; ignore failures), then clear SecureStore, the
  session, the query cache, its persisted copy and paused mutations.
- **Errors** become `ApiError { status, code, message, details }`, or `NetworkError` when there's no response.
  Screens show translated messages per `code`, and forms map `details[].path` to field errors.

### 5.1 Caching server data (TanStack Query)

The backend already caches Ticketmaster (search 5 min, details 1 h). The app adds a cache on top, tuned per kind of data:

| Query key | Data | Fresh for (`staleTime`) | Kept in memory (`gcTime`) | Notes |
|---|---|---|---|---|
| `['categories']` | Category list | Infinity | Infinity | Fixed list; fetched once per app run |
| `['events', params]` | Search pages (infinite) | 2 min | 10 min | Pull to refresh forces a refetch. Stops at the last page or at result 1,000 (the backend's paging limit). |
| `['event', id]` | Event details | 10 min | 30 min | Seeded from the list item, so details open instantly |
| `['me']` | Profile | 5 min | Infinity | Replaced with the `PATCH /me` response, no refetch |
| `['saved-events']` | My Events | 1 min | 7 days | **Persisted for offline** (§5.2). Refetched on focus. |
| Personalize | — | — | — | A mutation, not cached in the app; the backend caches AI results |

- **Defaults:** retry twice on network or 5xx errors, never on 4xx. Refetch when the app comes back to the foreground
  (`focusManager` + `AppState`) and when the connection returns (`onlineManager` + `@react-native-community/netinfo`).
- **After a change:** saving or removing an event updates `['saved-events']` immediately (optimistic), then
  re-syncs. Signing out clears the whole cache and the persisted copy.

### 5.2 Offline support (saved events only)

- **What works offline:** opening My Events and event details for saved events, from the last synced copy. Saving or
  removing events offline is queued and sent automatically when the connection returns. Search and Personalize need
  the network and show a clear "You're offline" state.
- **How:** `PersistQueryClientProvider` with an AsyncStorage persister. A filter (`shouldDehydrateQuery`) persists
  only `['saved-events']`. Each saved item already contains the full event, so the details screen falls back to it when
  offline; no separate per-event persistence is needed. The persisted cache is versioned (`buster`), so an app update
  with new data shapes discards the old copy.
- **Queued changes:** save and remove are mutations in TanStack Query's offline mode: paused while offline, resumed
  with `resumePausedMutations()` once back online, including after an app restart. For that to work after a restart,
  each mutation has a **mutation key with its function registered via `setMutationDefaults`**, because functions can't
  be stored and only the key and variables are persisted. Language changes made offline sync the same way.
- **Edge cases:** saving an event that was removed at the source fails with `404` when resumed. The item is dropped
  from My Events with a notice. Removing works offline in full: the calendar entry is deleted immediately and the
  server delete is queued.
- **Why not WatermelonDB:** it's built for syncing large local databases. It needs its own native module, model
  schemas, and a pull/push sync protocol the backend would have to implement. That's heavy for at most 100 saved
  events whose source of truth is the API. If offline needs grow (e.g. offline search history), the next step up is
  Expo's own **`expo-sqlite`** (with Drizzle), still lighter than WatermelonDB.
- The calendar entries the app created already work offline, because they live in the device calendar.

### 5.3 Query keys and invalidation

`['events', params]`, `['event', id]`, `['categories']`, `['me']`, `['saved-events']`. After saving or removing an
event, update and invalidate `saved-events`. After `PATCH /me`, set `['me']` from the response.

## 6. Feature behaviour

| Feature | Behaviour |
|---|---|
| **Welcome** | Photo collage at the top fading into the background, then centered: "Momento", the slogan "Looking ahead and planning what's next", the **Get Started** button (to sign-up), and "Already have an account? **Sign In**" |
| **Sign in / Sign up** | Pill inputs with icons, password eye toggle, inline field errors from zod and from the API's `details`, a "Remember me" checkbox (off means the refresh token isn't persisted and the session ends when the app closes), "or continue with" **Google**. No Apple button. |
| **Forgot / Reset password** | Screens built from the design, **UI only**: the buttons show "Coming soon" |
| **Explore** | Search field (debounced 400 ms), category chips (from `/events/categories`), infinite list of `EventCard`s (`size=20`). Pull to refresh. Empty and error states. |
| **Event details** | Image, title, status badge (cancelled, postponed…), date and time in the venue's time zone, venue, description, "Tickets" link (opens in the browser), **Set reminder** button |
| **Personalize** (`events/[id]/personalize`) | Original text first. Toggles for **Shorten** and **Translate** (language picker, user's language pre-selected). **Apply** calls the API and shows the result in editable fields (with a "From cache" hint). A reminder time picker (at start, 15 min, 1 h, 1 day before). **Add to calendar**. |
| **Add to calendar** | Ask for calendar permission. If it's denied, explain why it's needed and offer a button to open the system settings. Pick a writable calendar: the primary one that allows changes, or create a "Momento" calendar if none. Create the event (start from `event.start.dateTime` in its time zone, or an all-day event if there's no time; 2-hour default end; notes = description + facts; one alarm for the chosen reminder). Store `eventId → calendarEventId` locally, **keyed by user id** so two accounts on one phone never mix, then `POST /me/saved-events`. The exact alarm fields (`relativeOffset` etc.) are checked against the SDK 58 calendar docs and the migration guide when implemented. |
| **My Events** | Saved events, newest first, with "Unavailable" for removed events. Swipe or button to remove: deletes the calendar entry (if this device created it) and the saved event. |
| **Settings** | Theme (System / Light / Dark), Language (English / Français / Kiswahili; also `PATCH /me { language }`), Profile (first name, last name, phone), Sign out, Delete account (with confirmation; also removes the app's calendar entries). |

## 7. Theme and design tokens

- **Colours:**

  | Token | Light | Dark |
  |---|---|---|
  | Brand | `#EA4C89` | `#EA4C89` |
  | Brand for text and buttons | `#C9356F` (white text ~5:1) | Brand |
  | Background | `#F7F7F9` | `#111113` |
  | Surface | `#FFFFFF` | `#1C1C1E` |
  | Border | `#E2E2E6` | `#2E2E33` |
  | Text | `#111113` | `#F5F5F7` |
  | Muted text | `#60646C` | `#A1A1AA` |
  | Danger | `#D93025` | `#D93025` |
  | Success | `#1E9E62` | `#1E9E62` |

- **Shape:** pill controls (radius 999) as in the design, cards with radius 16, 4-point spacing scale.
- **Type:** Poppins 400/500/600/700. Titles are 28/22, body 15, captions 13.
- **Theme choice:** stored in the settings store and applied through our `ThemeProvider` (and the native colour
  scheme, so system UI and pickers match). The exact React Native API for overriding the native scheme (e.g.
  `Appearance.setColorScheme`) gets checked in the RN 0.88 docs during implementation, since the Expo page doesn't
  cover it.
- **Accessibility:** every icon-only control (back, eye toggle, remove) gets an `accessibilityLabel`. Touch targets
  are at least 44×44. Text scales with the system font size. Text-on-brand uses `#C9356F` for contrast. Status is
  never shown by colour alone (badges have text).

## 8. Internationalisation

- Languages: `en`, `fr`, `sw`. Translations live in `src/locales/*.json` with namespaces per feature.
- **First launch:** the device language from `getLocales()[0].languageCode` if supported, otherwise English. **After
  sign-in:** the profile `language` wins.
- **Changing it** in Settings updates i18next immediately, persists it, and calls `PATCH /me`. It's also the
  pre-selected "Translate to" option in Personalize.
- `expo-localization` plugin with `supportedLocales` en/fr/sw. Re-read the device locale when the app returns to the
  foreground (Android can change it without a restart).
- API error codes map to translated messages. Event content itself isn't translated (Version 1); that's what
  Personalize is for.

## 9. Configuration, builds and environments

- **`.env`** (git-ignored) has `EXPO_PUBLIC_API_URL`. **`.env.example`** is committed. SDK 58 only loads the standard
  `.env*` names.
- **`app.json` changes:** name "Momento", slug, Android package id (e.g. `com.bornmajor.momento`), icons and splash from
  the logo (pink tile), plugins `expo-calendar` (with `calendarPermission` text), `expo-localization`, `expo-font`,
  `expo-secure-store`, and the Google sign-in plugin. Android calendar permissions are confirmed when the plugin is
  added.
- **Development build** required (`expo-calendar`, Google sign-in and the font plugin don't run in Expo Go; confirmed in
  the SDK 58 docs). Android first. iOS config is kept but not tested (intent.md).
- `ios/` and `android/` are generated and never edited by hand (AGENTS.md).

### 9.1 No build variants yet

There's one app id and one API URL (from `.env`) for now; no dev/staging/prod flavours, since there's only one
backend. Adding variants later is a standard change: convert `app.json` to `app.config.ts` and switch the name, id and
API URL on `APP_VARIANT`.

### 9.2 Logging in release builds

- All app logging goes through `src/core/logger.ts`, whose methods do nothing unless `__DEV__` is true. Release builds
  therefore print nothing from our code.
- ESLint `no-console` (error) stops stray `console.*` calls; only the logger may use `console`.
- Never log tokens, passwords or full API responses, even in development.
- *Optional:* a Babel plugin that strips `console.*` from the whole bundle in production (including library logs). Not
  needed for Version 1.

### 9.3 CI/CD: GitHub Actions + EAS Workflows

| Pipeline | Runs on | Does |
|---|---|---|
| **GitHub Actions** `ci.yml` | Every pull request and every push to `main` | `npm ci` → `npx expo lint` → `npx tsc --noEmit` → `npm test` → `npx expo-doctor` |
| **EAS Workflow** `development-build.yml` | Manual trigger (or when native dependencies change) | EAS Build, `development` profile: Android dev-client APK for daily development |
| **EAS Workflow** `preview-build.yml` | Push to `main` (after a PR merges) | EAS Build, `preview` profile: an installable Android APK to share for testing |
| *(later)* `production` | Tag or manual | AAB for the Play Store, and EAS Submit. Not used in Version 1 (no store release). |

- `eas.json` profiles: `development` (`developmentClient: true`, internal APK), `preview` (internal APK), `production`
  (AAB).
- **Secrets:** `EXPO_TOKEN` as a GitHub secret (only needed if GitHub Actions calls EAS). `EXPO_PUBLIC_API_URL` set as
  an EAS environment variable for builds. Nothing secret ships in the app.
- The exact EAS Workflow YAML syntax gets checked against the current EAS docs when it's written (AGENTS.md).

## 10. Decisions log

| # | Decision | Outcome |
|---|---|---|
| 1 | Google sign-in library | **Deferred from Version 1 (2026-11-09): email + password only for now.** When added: `@react-native-google-signin/google-signin` (free version), confirmed in a short spike before the auth screens are wired. Fallback: `react-native-nitro-google-signin`. The backend's `GOOGLE_CLIENT_IDS` gets the Web client ID (the ID token's audience) and the Android client ID. |
| 2 | How to make development builds | EAS Build, triggered by EAS Workflows, with GitHub Actions for checks (§9.3) |
| 3 | Welcome collage photos | 5–6 free-licence event photos (e.g. Unsplash), compressed, credited in the README |
| 4 | Tabs | Explore · My Events · Settings |
| 5 | Screens without a design (Explore, Details, Personalize, My Events, Settings) | Mocked up in the welcome/auth visual language and approved by the user before they're built |
| 6 | Offline support | Included in Version 1, saved events only (§5.2); intent.md §4.6 |
| 7 | State and data | Zustand for client state, TanStack Query + `fetch` for server data (no axios) |
| 8 | Build variants | None for now (§9.1). Logging is silent in release builds (§9.2). |
| 9 | Code organisation | **Approved (2026-11-10):** layered features, sources → repository → use case (only with rules) → hooks/stores → UI, with `data/`, `domain/` and `presentation/` in each feature and a shared `core/` (§12) |

## 11. Testing strategy (lean)

- **Unit:** the API client (token header, single-flight refresh, error mapping), `buildCalendarNotes`, form schemas.
  The calendar helper is tested with `expo-calendar` mocked.
- **Component:** sign-in form (validation and API error display) and the Personalize flow with mocked API.
- **Session restore:** start-up refresh results in all three cases (success, `401`, network error), since the
  offline case is the one most likely to regress.
- **Manual on an Android dev build:** the end-to-end path against the API over ngrok: sign up → explore → details →
  personalize (Swahili) → add to calendar → My Events → remove → settings (theme, language, profile) → sign out.
- **Gates before each commit:** `npx expo lint`, `npx tsc --noEmit`, `npm test`.

## 12. Layered feature architecture (task 5.7)

> Status: **APPROVED (2026-11-10).** It replaces §1's diagram and §3's folder
> structure. No behaviour changes: it only reorganises the code.

### 12.1 Flow and rules

```
remote / local source  →  repository  →  use case (only with real rules)  →  hook / store  →  UI
   raw DTOs, raw errors    DTO → domain     business rules across            TanStack Query,    screens,
                           errors → failures repositories                     Zustand            components
```

1. **Sources** do I/O only: HTTP (`*-remote-source.ts`) or the device (`*-local-source.ts`: SecureStore, AsyncStorage,
   calendar). They return DTOs and throw raw errors (`ApiError`, `NetworkError`).
2. **Repositories** are the only place that maps:
   - DTOs → domain models (`*.mapper.ts`);
   - raw errors → **domain failures**.

   They **throw** failures; they don't return `Result` types, because TanStack Query's error states, retries and the
   offline queue all rely on thrown errors.
3. **Use cases** exist only when there are rules across steps or repositories. Pure reads (search, categories, `/me`)
   go straight from the hook to the repository.
4. **Hooks and stores** (presentation) hold server state (TanStack Query) and client state (Zustand), including
   optimistic updates and the offline queue.
5. **UI** turns a failure into words with `failureMessage(failure)` → i18n key → `t()`. Failures are types; messages
   live only in presentation.

**Dependency rules:**
- `presentation → domain ← data`: `domain/` imports nothing from `data/`, `presentation/`, React or TanStack.
- Features import other features **only through their public `index.ts`** (for example `useSession`, `signOut` and
  `User` from `@/features/auth`), never through their `data/` or `presentation/` internals. Route files in `src/app`
  may import a feature's screens directly. This is enforced with an ESLint `no-restricted-imports` rule.
- **Use cases receive their dependencies as an argument** (`signUp(input, deps)`): the interfaces (ports) are
  declared in `domain/ports.ts`, the data layer implements the repositories, presentation implements session state,
  and `presentation/session-controller.ts` wires them together.
- Domain models stay **JSON-safe**: dates are ISO strings, not `Date`, because the saved-events cache is persisted as
  JSON.
- **No DI container or `*Impl` classes:** a repository is a typed object (`export const authRepository:
  AuthRepository = {...}`), and tests replace it with `jest.mock`.

### 12.2 Folders and naming

```
src/
  app/                       routes only: one-line re-exports of feature screens (Expo Router needs them here)
  core/
    api/                     http-client.ts (fetch, Bearer, single-flight refresh, timeout, abort) · api-error.ts
                             · schema.d.ts (generated DTO types)
    failures/                app-failure.ts (Network, Unauthenticated, RateLimited, ServerUnavailable, Cancelled,
                             Unknown) · map-api-error.ts (shared codes → failures) · failure-message.ts (→ i18n key)
    calendar/ (the phone calendar, shared)  storage/  query/  i18n/  theme/  hooks/  logger.ts
  components/                shared UI kit (unchanged)
  features/<feature>/
    data/        sources/*-remote-source.ts · sources/*-local-source.ts · dto/*.dto.ts · mappers/*.mapper.ts
                 · <feature>-repository.ts
    domain/      models/*.ts · failures.ts · use-cases/*.ts
    presentation/ hooks/use-*.ts · state/*-store.ts · screens/*-screen.tsx · components/*.tsx · schemas.ts
```

File names are kebab-case with a role suffix, as listed above.

### 12.3 Features after the move

| Feature | data | domain (use cases) | presentation |
|---|---|---|---|
| auth | auth remote source, token local source, user mapper, auth repository | `sign-up`, `sign-in`, `sign-in-with-google`, `restore-session`, `sign-out` | session store, sign-up draft, hooks, sign-in and sign-up screens, strength meter, form schemas |
| events | events remote source, event mapper, events repository | none | `use-event-search`, `use-event`, `use-categories`, explore and details screens, event card, `format.ts` |
| saved-events | saved-events remote source, calendar-entries local source, repository | `remove-saved-event` (calendar + API) | `use-saved-events`, optimistic save and remove, offline queue (`setMutationDefaults`), My Events screen |
| personalize | personalize remote source, device-calendar local source, calendar repository | `add-event-to-calendar` (calendar entry + save + entry map) | personalize screen and form, `notes.ts` |
| profile | me remote source, profile repository | `delete-account` (API + calendar clean-up + sign-out) | `use-me`, `use-update-profile`, profile screen |
| settings | none (local preferences) | none | language and theme stores, settings screen |
| welcome | none | none | welcome screen, collage |

### 12.4 Error mapping

| Raw (data) | Failure (domain) | Shown as (presentation) |
|---|---|---|
| `NetworkError` | `NetworkFailure` | `errors.NETWORK` snackbar or error state |
| `ApiError` `SERVER_UNREACHABLE` / `UPSTREAM_UNAVAILABLE` / `INTERNAL` | `ServerUnavailableFailure` | `errors.SERVER_UNREACHABLE` |
| `ApiError` `UNAUTHENTICATED` | `UnauthenticatedFailure` | session ends (route guard) |
| `ApiError` `RATE_LIMITED` | `RateLimitedFailure` | `errors.RATE_LIMITED` |
| `RequestCancelledError` | `CancelledFailure` | nothing |
| `ApiError` `EMAIL_TAKEN` | auth `EmailTakenFailure` | email field error; sign-up step 2 returns to step 1 |
| `ApiError` `INVALID_CREDENTIALS` | auth `InvalidCredentialsFailure` | `errors.INVALID_CREDENTIALS` |
| `ApiError` `VALIDATION_ERROR` | `ValidationFailure(fields)` | errors on the matching fields |
| `ApiError` `AI_LIMIT_REACHED` | personalize `AiLimitFailure` | snackbar with "Use original text" |
| `ApiError` `SAVED_LIMIT_REACHED` | saved-events `SavedLimitFailure` | `errors.SAVED_LIMIT_REACHED` |
| `ApiError` `NOT_FOUND` (event) | events `EventNotFoundFailure` | not-found state / "gone while offline" notice |
| Google SDK errors | auth `GoogleSignInFailure(reason)` | `auth.googleFailed` / `googleNoPlayServices` / `googleEmailTaken` |
| Anything else | `UnknownFailure` | `errors.UNKNOWN` |

### 12.5 Testing

- **Repositories:** sources mocked; DTO mapping and error → failure mapping.
- **Use cases:** repositories mocked; their rules.
- The existing tests move with their code and keep passing at every step.
