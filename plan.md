# Plan — Momento mobile app (frontend)

> Status: **APPROVED (2026-11-09)**. Phase 3 of the workflow. Implements [spec.md](spec.md) (approved).
> Progress: **Batch 1 ✅** (`2-foundation`) · **Batch 2 ✅** (`3-auth`, email + password; Google deferred; awaiting review) · **Batch 3 ✅** (`4-events-personalize`) · **Batch 4 ✅** (`5-my-events-settings`, approved).

## How the work runs

- **Five batches, one branch each.** Each batch starts on a new branch and ends with your review. When you approve a
  batch, its branch is **pushed and a pull request opened into `main` right away**. Nothing piles up for the end.
- **Inside a batch:** lean tests first for the logic that matters (see spec §11), then the code. Before every commit:
  `npx expo lint`, `npx tsc --noEmit`, `npm test`.
- **Expo APIs are checked against the SDK 58 docs** before they're used (AGENTS.md). Packages are added only with
  `npx expo install`.
- **Design gate:** the screens with no design (Explore, Details, Personalize, My Events, Settings) are mocked up and
  approved by you **before Batch 3 starts**.
- **Stop mid-batch** only for a decision that's yours (e.g. a spec conflict), never to guess.

## Prerequisites from you

| Needed by | Item | Notes |
|---|---|---|
| Push of `1-frontend-spec` | An empty GitHub repo `momento-event-planner-app` | Remote URL without a token |
| Batch 1 | A free **Expo account** | I'll run `npx eas-cli@latest init` to create the EAS project; you sign in when asked |
| Batch 2 | **Google Cloud OAuth client IDs**: a *Web* client and an *Android* client | The Android client needs the package name `com.bornmajor.momento` and the **SHA-1 from the EAS keystore** (I'll get it with `eas credentials` after the first build). Both IDs go into the backend's `GOOGLE_CLIENT_IDS`; the Web one also goes into the app. |
| Batch 2 | Backend running and reachable over your ngrok domain | For sign-in testing on the device |
| Batch 2 | OK on the 5–6 welcome photos I propose | Free-licence (e.g. Unsplash), credited |
| Batches 1–5 | An **Android phone** (or emulator) with the dev build installed | To try each batch at review |

---

## Batch 1 — Foundation · branch `2-foundation`

Everything later screens stand on. At the end the app launches into a placeholder signed-out screen with the
brand theme, fonts, translations and the API client in place.

| # | Task | Done when |
|---|---|---|
| 1.1 | **Logo assets**: app icon (white mark on a pink tile), Android adaptive icon layers (foreground, background, monochrome), splash icon, favicon. SVG sources kept in `design/logo/`. | Icons render in the dev build; `app.json` points at them |
| 1.2 | **App config**: name "Momento", slug, `android.package` `com.bornmajor.momento`, splash colours, `userInterfaceStyle: "automatic"`. Remove the template demo screens and components. | `npx expo-doctor` passes |
| 1.3 | **Dependencies** (via `npx expo install`): expo-router extras as needed, `@tanstack/react-query` (+ persist client, AsyncStorage persister), `zustand`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-localization`, `i18next`, `react-i18next`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@react-native-community/netinfo`, `@expo-google-fonts/poppins`, `expo-calendar`; dev: `openapi-typescript`, `jest-expo`, `@testing-library/react-native` | Installed at SDK-compatible versions, lockfile committed |
| 1.4 | **Theme**: tokens (spec §7), `ThemeProvider`, `useTheme`, a theme store (System/Light/Dark, persisted), the native colour-scheme override (API checked in the RN 0.88 docs) | Switching the store value flips the whole app, including system UI |
| 1.5 | **Fonts**: Poppins through the `expo-font` config plugin | Text renders in Poppins in the dev build |
| 1.6 | **i18n**: i18next setup, `en`/`fr`/`sw` files (all keys present in each), device-language detection, persisted choice, `expo-localization` plugin | Changing the language updates visible text immediately |
| 1.7 | **UI kit** (`components/ui`): Button (primary/outline, loading), TextField and PasswordField (pill, leading icon, eye toggle, error text), BackButton, Checkbox, Divider ("or continue with"), Screen, EmptyState, ErrorState, OfflineBanner | Components follow the auth design in light and dark, with accessibility labels |
| 1.8 | **Logger**: `lib/logger.ts` (silent unless `__DEV__`) and ESLint `no-console` | `console.*` outside the logger fails lint |
| 1.9 | **API layer**: a committed copy of the backend's `openapi.yaml` in `api/openapi.yaml`; `npm run gen:api` (openapi-typescript) → `src/api/schema.d.ts`; `api/client.ts` (base URL from `EXPO_PUBLIC_API_URL`, headers, 15 s timeout, `ApiError`/`NetworkError`, single-flight refresh); typed `endpoints.ts` | **Tests:** Bearer header; two parallel 401s trigger one refresh; refresh 401 signs out, but a network error doesn't; error mapping |
| 1.10 | **Session**: session store (access token in memory), `lib/secure-tokens.ts` (refresh token in SecureStore, "remember me" respected), the start-up restore rule (spec §4: success / 401 / offline) | **Tests:** all three start-up cases |
| 1.11 | **Query client**: defaults (retries, `focusManager` with `AppState`, `onlineManager` with NetInfo), per-query cache times (spec §5.1), persistence wired for `['saved-events']` only | Cache and persistence ready for Batches 3–4 |
| 1.12 | **Root layout**: providers, splash held until fonts, cache restore and session restore finish, `Stack.Protected` guards for `(auth)` and `(app)` with placeholder screens | Without a session the app opens on the `(auth)` placeholder; with one, on `(app)` |
| 1.13 | **CI/CD**: `.github/workflows/ci.yml` (lint, typecheck, tests, expo-doctor); `eas.json` profiles (`development`, `preview`, `production`); EAS Workflow `development-build.yml` (syntax checked against current EAS docs); `.env.example` | CI passes on the pull request; the first dev build installs on your phone |

## Batch 2 — Authentication · branch `3-auth`

| # | Task | Done when |
|---|---|---|
| 2.1 | ~~**Google sign-in spike**~~ **Deferred (2026-11-09):** Version 1 starts with email + password only. The button component is kept but hidden. Original task: install `@react-native-google-signin/google-signin`, configure the plugin and Web client ID, get an ID token on the dev build, and confirm `POST /auth/google` accepts it. If it fails, switch to the fallback (`react-native-nitro-google-signin`). | A real Google account signs in against the backend |
| 2.2 | **Welcome screen**: photo collage fading into the background, "Momento", slogan, Get Started (to sign-up), "Already have an account? Sign In" | Matches the design in light and dark |
| 2.3 | **Sign in**: form (zod), remember me, Forgot Password link, Google button, API errors shown (`INVALID_CREDENTIALS`, `RATE_LIMITED`, offline) | **Test:** validation messages and API error display |
| 2.4 | **Sign up**: first and last name, email, password with a live rules checklist (8+ characters, a letter, a digit); `EMAIL_TAKEN` shown on the email field | Field errors from the API's `details` show on the right fields |
| 2.5 | **Forgot / Reset password**: UI templates from the design; buttons say "Coming soon" | Screens reachable and styled; no API calls |
| 2.6 | **Session lifecycle end to end**: sign in → restart → still signed in; sign out revokes on the server and clears everything | Verified on the device over ngrok |

## Design gate — mockups (before Batch 3)

Mockups of **Explore, Event details, Personalize, My Events, Settings and Profile**, in the welcome/auth visual
language, light and dark. Batch 3 starts once you approve them (changes go into `design/README.md`).

## Batch 3 — Events, Personalize and calendar · branch `4-events-personalize`

| # | Task | Done when |
|---|---|---|
| 3.1 | **Tabs**: native tabs Explore · My Events · Settings (icons and translated labels) | Tabs switch; the active tab uses the brand colour |
| 3.2 | **Explore**: debounced search, category chips (with "All"), infinite `EventCard` list (stops at the last page or result 1,000), pull to refresh, empty, error and offline states | Searching and filtering hit the API with the right parameters |
| 3.3 | **Event details**: image, status badge, date and time in the venue's time zone, venue, description, Tickets link, Set reminder; opens instantly from list data | Details show for searched events; unknown id shows "not found" |
| 3.4 | **Personalize**: Shorten/Translate options (user's language pre-selected), Apply → result in editable fields, "From cache" hint, `AI_LIMIT_REACHED` message with "use original text", reminder picker | **Test:** the flow with a mocked API |
| 3.5 | **Calendar** (`lib/calendar.ts`, new SDK 58 API, alarms checked in the docs and the migration guide): permission with a settings fallback, pick or create a writable calendar, create the event with an alarm, store the calendar entry id per user | **Tests:** `buildCalendarNotes`, calendar choice (mocked `expo-calendar`). The entry appears in the phone's calendar with the reminder. |
| 3.6 | **Save**: after the calendar entry is created, `POST /me/saved-events` (offline-capable mutation with key and `setMutationDefaults`) | The event appears in My Events (Batch 4) and on the server |

## Batch 4 — My Events, offline and Settings · branch `5-my-events-settings`

| # | Task | Done when |
|---|---|---|
| 4.1 | **My Events**: saved list (newest first), "Unavailable" items, remove (deletes the device calendar entry + `DELETE /me/saved-events/:id`, optimistic), empty state | Removing updates the list immediately and on the server |
| 4.2 | **Offline**: the persisted `['saved-events']` copy, details falling back to it, paused and resumed save/remove (including after an app restart), offline banner, 404-on-resume notice | **Manual test:** airplane mode → My Events still shows → remove one → back online → gone on the server |
| 4.3 | **Settings**: Theme (System/Light/Dark), Language (en/fr/sw, synced with `PATCH /me`, queued when offline), Sign out | Choices persist across restarts |
| 4.4 | **Profile**: edit first name, last name and phone (E.164 hint, API errors on fields); Delete account (confirmation → `DELETE /me` → removes the app's calendar entries → signed out) | Profile changes show after signing in again; deleted accounts can't sign in |

## Batch 5 — Release readiness · branch `6-release`

| # | Task | Done when |
|---|---|---|
| 5.1 | **EAS Workflow `preview-build.yml`** (on push to `main`) producing an installable APK | A preview APK installs from the EAS build page |
| 5.2 | **Accessibility and polish pass**: labels, touch targets, font scaling, contrast, loading skeletons, haptics on key actions (optional) | Checked with TalkBack and large text on the device |
| 5.3 | **Release logging check**: no console output in the preview build | Verified with `adb logcat` |
| 5.4 | **End-to-end on the device** against the API over ngrok: intent.md success criteria 1–8 | All 8 criteria pass |
| 5.5 | **Independent code review** (`/code-review`), fix findings | Findings fixed or explained |
| 5.6 | **README**: setup, `.env`, dev build install, scripts, architecture summary, photo credits | A new contributor can run the app from the README |
| 5.7 | **Layered feature architecture** (spec §12): move to sources → repository → use case → hooks/stores → UI, one feature per step (breakdown below) | spec §12 approved; every step keeps lint, typecheck and tests green; no behaviour change |
| 5.8 | **TODO (after the backend is hosted): production APK workflow** — an EAS Workflow `.eas/workflows/production-build.yml` (manual trigger, or on a version tag) that builds the `production` profile as an installable APK. Before it: host the backend on HTTPS, set `EXPO_PUBLIC_API_URL` for the EAS `production` environment to that URL, and add `"android": { "buildType": "apk" }` to the `production` profile (it builds a Play Store AAB by default). Syntax checked against the current EAS Workflows docs when written. | A production APK installs from the EAS build page and works against the hosted API |
| 5.9 | **Google sign-in for release builds**: add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the EAS `preview` and `production` environments, and create a Google Cloud Android OAuth client for each release keystore SHA-1 (EAS keystore, plus Google Play app signing if published there) | "Continue with Google" works in the preview APK |
| 5.10 | **Clear restored cache when signed out**: after a reinstall with an Android backup, the previous user's saved My Events can come back from AsyncStorage. At start-up with no stored session, clear the query cache and its saved copy (docs/authentication.md, "Known gap") | A different user signing in never sees the old list |

### 5.7 breakdown: layered feature architecture

Branch `7-layered-architecture`, one commit or more per step. Every step: `npx expo lint`, `npx tsc --noEmit`, `npm test`
green, and the app behaves the same.

| # | Step | Done when |
|---|---|---|
| 5.7.1 | **Core**: move the HTTP client, API errors, generated schema, storage, query client, i18n and logger into `src/core/`. Add `core/failures/` (`AppFailure` and the shared failures, `mapApiError`, `failureMessage`) with tests | Old imports updated; failure mapping tested |
| 5.7.2 | **Auth (reference feature)**: `data/` (auth remote source, token local source, user mapper, auth repository with error → failure mapping); `domain/` (User and Session models, auth failures, use cases `sign-up`, `sign-in`, `sign-in-with-google`, `restore-session`, `sign-out`); `presentation/` (session store, draft store, hooks, screens, components, schemas). Route files become re-exports | **Review gate:** you approve the auth layout before the other features follow it |
| 5.7.3 | **Events**: events remote source, event mapper, events repository; hooks and screens into `presentation/` | Explore, details and search behave the same |
| 5.7.4 | **Saved events**: remote source, calendar-entries local source, repository; use case `remove-saved-event`; optimistic updates and offline queue in `presentation/` | Offline save and remove test still passes |
| 5.7.5 | **Personalize**: personalize remote source, device-calendar local source, calendar repository; use case `add-event-to-calendar` | Personalize test still passes |
| 5.7.6 | **Profile, settings, welcome**: profile repository and use case `delete-account`; settings and welcome become presentation only | Account test still passes |
| 5.7.7 | **Guard rails and docs**: ESLint `no-restricted-imports` for the dependency rules (spec §12.1); remove the old `api/`, `lib/` and flat feature files; update the README's Project structure, `docs/authentication.md` file paths, and spec §1/§3 | Lint fails on a cross-layer import; docs match the code |

**Raw-error checks to switch to failures** (each when its feature gets a repository):

- [x] 5.7.2 `session.ts`: `ApiError` status `401` → `UnauthenticatedFailure` (refresh and restore)
- [x] 5.7.2 `form-errors.ts` and sign-up step 2: `EMAIL_TAKEN` / `VALIDATION_ERROR` → `EmailTakenFailure` / `ValidationFailure`
- [x] 5.7.2 `use-google-sign-in.ts`: `ApiError` `EMAIL_TAKEN` → `EmailTakenFailure`
- [x] 5.7.3 event details screen: `ApiError` `NOT_FOUND` → `EventNotFoundFailure`
- [ ] 5.7.4 saved-events offline queue: save `404` → `EventNotFoundFailure`
- [ ] 5.7.5 personalize form: `AI_LIMIT_REACHED` → `AiLimitFailure`
- [ ] 5.7.4 / 5.7.6 replace remaining deep cross-feature imports with public indexes: events → `saved-events/mutations` (`findSavedEvent`), `saved-events/calendar-entries`, `profile/use-me`; auth → `saved-events/mutations` (`queueLanguageUpdate`)
- [ ] 5.7.7 narrow `failureMessage()` and `shouldRetry()` to `AppFailure` only, once nothing passes raw errors

---

## Dependencies between batches

```
1-frontend-spec (docs) → 2-foundation → 3-auth → [design gate] → 4-events-personalize → 5-my-events-settings → 6-release
```

Each branch starts from the previous one. Pull requests merge into `main` in this order, using merge commits rather
than squash, so later branches stay in line.

## Risks and how they're handled

| Risk | Mitigation |
|---|---|
| Google sign-in fails on Android because of a SHA-1 or client ID mismatch | Spike first (2.1), using the SHA-1 from the EAS keystore; a fallback library is named in the spec |
| The new `expo-calendar` API (SDK 58) differs from older examples; alarm fields unverified | Read the SDK 58 page and the calendar migration guide before 3.5; tests mock it |
| There's no Expo doc for overriding light/dark at runtime | Check the RN 0.88 `Appearance` docs in 1.4; fallback: our ThemeProvider handles app colours and system UI follows the OS |
| Offline mutations lost after a restart | `setMutationDefaults` + mutation keys (spec §5.2), tested manually in 4.2 |
| Session lost when the app opens offline | Start-up restore rule (spec §4), unit-tested in 1.10 |
| A library is incompatible with SDK 58, React 19.3 or the React Compiler | `npx expo install` picks versions; `expo-doctor` runs in CI; issues show up in the first dev build |
| The ngrok URL or the backend is down during testing | `/health` check first; the app shows clear offline and error states |
| The backend contract changes | `api/openapi.yaml` copy + `gen:api`; type errors show exactly what broke |
| EAS free-tier build queue is slow | Build only when native dependencies change; JS changes reload on the existing dev build |

## Out of scope for this plan

- An iOS build and testing (config kept, not tested).
- App store release.
- Build variants (spec §9.1).
- Everything listed as "future" in intent.md.
