# Spec — Momento mobile app (frontend)

> Status: **DRAFT — awaiting approval**. Phase 2 of the workflow. Implements [intent.md](intent.md), following the
> design direction in [design/README.md](design/README.md). The backend is documented in the
> `momento-planner-api` repo (`docs/API-REFERENCE.md`, `docs/openapi.yaml`).
> Expo facts below were checked against the **SDK 58** docs on 2026-11-06.

## 1. Architecture overview

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
| HTTP | **`fetch` wrapper** in `src/api/client.ts` (no axios) | Adds the base URL, Bearer token and ngrok header, refreshes tokens once at a time, maps errors to `ApiError { code, message, details }` |
| API types | **`openapi-typescript`**, generated from the backend's `docs/openapi.yaml` into `src/api/schema.d.ts` | Request and response types can't drift from the backend contract |
| Forms | **react-hook-form + zod** | Validation rules mirror the backend (password: 8+ characters, a letter and a digit; names 1–50) |
| Client state | **Zustand** with persistence to **AsyncStorage** (`@react-native-async-storage/async-storage`) | Small and explicit. Holds theme and language choice, plus the event id → calendar entry id map. |
| Tokens | **`expo-secure-store`** | Encrypted storage (Android Keystore / iOS Keychain). Works in Expo Go. |
| i18n | **i18next + react-i18next** with **`expo-localization`** | Expo docs list react-i18next as an option. Mature: interpolation and plurals. Device language read with `getLocales()`. |
| Dates | `Intl.DateTimeFormat` with the event's time zone | Recommended by the Expo docs. No date library needed. |
| Theme | Own tokens (light/dark) + the user's choice: **System** (default), Light or Dark | `app.json` `userInterfaceStyle: "automatic"`; `expo-system-ui` is already installed (needed on Android) |
| Fonts | **Poppins** via `@expo-google-fonts/poppins` + the **`expo-font` config plugin** | Matches the reference design. The config plugin is the documented recommended method (needs a dev build). |
| Images | **`expo-image`** (already installed) | Caching and placeholders for event photos |
| Calendar | **`expo-calendar`** (new object API: `ExpoCalendar`, `createEvent`, `event.delete()`) | Writes the personalized event and its reminder to the device calendar |
| Google sign-in | **Decision needed, see §10** | Both Expo-recommended libraries need a dev build |
| Tests | **jest-expo + React Native Testing Library**, lean (core logic plus key flows) | Matches the project's lean-testing preference |
| Builds | **Development build** (EAS Build or `npx expo run:android`) | `expo-calendar`, Google sign-in and the font plugin don't run in Expo Go |

All packages are added with `npx expo install` so the versions match SDK 58.

## 3. Folder structure

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
- **Splash:** `SplashScreen.preventAutoHideAsync()` at module level, then hidden once fonts are loaded and the session
  restore has finished (success or not).
- Route guards are client-side only (Expo docs). The API still checks every request.

## 5. API client and token handling

- **Base URL:** `process.env.EXPO_PUBLIC_API_URL` (dot notation is required for inlining), e.g.
  `https://satisfiable-nonlethargical-freddy.ngrok-free.dev/api/v1`. It's set in `.env`. It's not secret: it's
  bundled into the app.
- **Every request** sends `Content-Type: application/json`, `ngrok-skip-browser-warning: true` and, when signed in,
  `Authorization: Bearer <accessToken>`.
- **Access token:** in memory only (session store). **Refresh token:** `expo-secure-store` (key `momento.refresh`).
- **On `401 UNAUTHENTICATED`:** run one shared refresh (a single in-flight promise), save the new pair, retry the
  request once. If the refresh fails, clear the tokens and the query cache, which flips the guard to the welcome screen.
  This avoids the backend's reuse detection logging the user out (backend docs/API.md).
- **Errors** become `ApiError { status, code, message, details }`. Screens show translated messages per `code`, and
  forms map `details[].path` to field errors.
- **Query keys:** `['events', params]`, `['event', id]`, `['categories']`, `['me']`, `['saved-events']`. After saving
  or removing an event, invalidate `saved-events`. After `PATCH /me`, set `['me']` from the response.

## 6. Feature behaviour

| Feature | Behaviour |
|---|---|
| **Welcome** | Photo collage at the top fading into the background, then centered: "Momento", the slogan "Looking ahead and planning what's next", the **Get Started** button (to sign-up), and "Already have an account? **Sign In**" |
| **Sign in / Sign up** | Pill inputs with icons, password eye toggle, inline field errors from zod and from the API's `details`, a "Remember me" checkbox (off means the refresh token isn't persisted and the session ends when the app closes), "or continue with" **Google**. No Apple button. |
| **Forgot / Reset password** | Screens built from the design, **UI only**: the buttons show "Coming soon" |
| **Explore** | Search field (debounced 400 ms), category chips (from `/events/categories`), infinite list of `EventCard`s (`size=20`). Pull to refresh. Empty and error states. |
| **Event details** | Image, title, status badge (cancelled, postponed…), date and time in the venue's time zone, venue, description, "Tickets" link (opens in the browser), **Set reminder** button |
| **Personalize** (`events/[id]/personalize`) | Original text first. Toggles for **Shorten** and **Translate** (language picker, user's language pre-selected). **Apply** calls the API and shows the result in editable fields (with a "From cache" hint). A reminder time picker (at start, 15 min, 1 h, 1 day before). **Add to calendar**. |
| **Add to calendar** | Ask for calendar permission. Pick a writable calendar: the primary one that allows changes, or create a "Momento" calendar if none. Create the event (start from `event.start.dateTime` in its time zone, or an all-day event if there's no time; 2-hour default end; notes = description + facts). Store `eventId → calendarEventId` locally, then `POST /me/saved-events`. |
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
- **Development build** required. Android first. iOS config is kept but not tested (intent.md).
- `ios/` and `android/` are generated and never edited by hand (AGENTS.md).

## 10. Open decisions

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Google sign-in library | `@react-native-google-signin/google-signin`: mature and widely used; the free version uses the older Google Sign-In SDK, while Android's newer Credential Manager is in its paid tier · `react-native-nitro-google-signin`: Credential Manager included, newer and less proven | **@react-native-google-signin (free)**, checked in a short spike first. Either way the backend's `GOOGLE_CLIENT_IDS` gets the Web client ID (audience of the ID token) and the Android client ID. |
| 2 | How to make development builds | **EAS Build** (cloud, free tier, no Android Studio needed) · **`npx expo run:android`** (needs Android Studio and the SDK locally) | EAS Build if Android Studio isn't installed |
| 3 | Welcome collage photos | Your own photos · free-licence photos (e.g. Unsplash, credited) · abstract illustrated tiles in brand colours | Free-licence event photos, 5–6 images, compressed |
| 4 | Tabs | Explore · My Events · Settings | As listed |
| 5 | Screens without a design (Explore, Details, Personalize, My Events, Settings) | Derived from the welcome and auth visual language | A quick mockup of these for your approval before building them |

## 11. Testing strategy (lean)

- **Unit:** the API client (token header, single-flight refresh, error mapping), `buildCalendarNotes`, form schemas.
  The calendar helper is tested with `expo-calendar` mocked.
- **Component:** sign-in form (validation and API error display) and the Personalize flow with mocked API.
- **Manual on an Android dev build:** the end-to-end path against the API over ngrok: sign up → explore → details →
  personalize (Swahili) → add to calendar → My Events → remove → settings (theme, language, profile) → sign out.
- **Gates before each commit:** `npx expo lint`, `npx tsc --noEmit`, `npm test`.
