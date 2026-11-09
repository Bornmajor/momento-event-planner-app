# Momento

**Looking ahead and planning what's next.** Momento is an Android-first mobile app for finding live events (concerts,
sports, theatre, film) and adding them to your phone's calendar. Before saving an event, you can have AI shorten its
description or translate it into English, French or Swahili.

> **Needs the backend.** The app talks only to the Momento API: events, accounts, AI and saved events all go through
> it. Set up and run **[momento-planner-api](https://github.com/Bornmajor/momento-planner-api)** first, or the app
> can't sign in or load anything.

## Screenshots

| Welcome | Sign up: your details | Sign up: password |
|---|---|---|
| <img src="docs/screenshots/welcome.jpg" width="220" alt="Welcome screen with the photo collage" /> | <img src="docs/screenshots/sign-up-details.jpg" width="220" alt="Sign up step 1: name and email" /> | <img src="docs/screenshots/sign-up-password.jpg" width="220" alt="Sign up step 2: password with strength meter" /> |

| Explore | My Events | Settings |
|---|---|---|
| <img src="docs/screenshots/explore.jpg" width="220" alt="Explore: categories, Happening now / Upcoming filters and events" /> | <img src="docs/screenshots/my-events.jpg" width="220" alt="My Events: saved events in the calendar" /> | <img src="docs/screenshots/settings.jpg" width="220" alt="Settings: profile, theme and language" /> |

| Personalize | Personalize: translated by AI |
|---|---|
| <img src="docs/screenshots/personalize.jpg" width="220" alt="Personalize: shorten and translate switches, editable details, Add to Calendar" /> | <img src="docs/screenshots/personalize-translated.jpg" width="220" alt="Personalize: details translated to Swahili, reminder choices" /> |

## Features

- **Explore events** from Ticketmaster (GB, US, IE, AU, NZ, CA): search, category filter, and Happening now / Upcoming
  filters. Times show in your own time zone.
- **Personalize with AI**: shorten and/or translate an event's details, then edit the result.
- **Add to calendar** with a reminder (at start, 15 min, 1 hour or 1 day before), using the phone's own calendar.
- **My Events, offline**: saved events open without a connection; saving and removing offline sync when you're back
  online.
- **Account**: email and password sign-up with a guided two-step flow and password strength meter; profile editing and
  account deletion.
- **Settings**: light, dark or system theme; English, Français or Kiswahili.

## Tech stack

| Area | Choice |
|---|---|
| App | Expo SDK 58, React Native, TypeScript, React Compiler |
| Navigation | Expo Router (native tabs, protected routes) |
| Server data and offline | TanStack Query, cache persisted with AsyncStorage |
| App state | Zustand |
| Forms | React Hook Form + Zod |
| Calendar | `expo-calendar` |
| Languages | i18next (`en`, `fr`, `sw`) |
| Secure storage | `expo-secure-store` for the sign-in token |
| API types | Generated from the backend's OpenAPI spec (`openapi-typescript`) |
| Tests and CI | Jest + React Native Testing Library, GitHub Actions, EAS Build and Workflows |

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- **The backend** running: [momento-planner-api](https://github.com/Bornmajor/momento-planner-api) (follow its README)
- **An Android phone or emulator.** Momento uses native modules (calendar, secure storage), so it runs in a
  [development build](https://docs.expo.dev/develop/development-builds/introduction/), not Expo Go.

### 1. Install

```bash
git clone https://github.com/Bornmajor/momento-event-planner-app.git
cd momento-event-planner-app
npm install
```

### 2. Point the app at your backend

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` to your backend's address, including `/api/v1`:

| Where the backend runs | Example |
|---|---|
| Your PC, phone on the same Wi-Fi | `http://192.168.1.20:4000/api/v1` (your PC's IP) |
| Your PC, phone over USB (`adb reverse tcp:4000 tcp:4000`) | `http://localhost:4000/api/v1` |
| Your PC, Android emulator | `http://10.0.2.2:4000/api/v1` |
| A tunnel or a hosted server | `https://your-domain.example/api/v1` |

Plain `http` addresses only work in development builds. Preview and release builds need `https`.

### 3. Install the development build (once)

Build it in the cloud with EAS and install the APK from the link it gives you:

```bash
npx eas-cli@latest build --profile development --platform android
```

Or build and install it locally (needs Android Studio):

```bash
npx expo run:android
```

Rebuild only when native dependencies change. JavaScript changes load from the dev server.

### 4. Run

```bash
npm start
```

Open the Momento app on your phone and connect to the dev server. Press `r` in the terminal to reload.

## Project structure

> A first outline; it will be revised.

```text
src/
  app/            Screens and navigation (Expo Router: every file is a route)
    (auth)/         Welcome, sign in, two-step sign up, password templates
    (app)/          Signed-in area: tabs (Explore, My Events, Settings), event details, Personalize, Profile
  features/       Feature logic and components
    auth/           Session, sign-in/up forms, password strength
    events/         Search, categories, event cards, date formatting
    personalize/    AI personalize form, add to calendar
    saved-events/   My Events, offline save/remove queue, calendar entry ids
    profile/        Profile form, account deletion
    settings/       Language preference
    welcome/        Welcome collage
  components/     Shared UI (buttons, fields, snackbar, layouts) and form fields
  api/            API client, endpoints, types generated from the backend's OpenAPI spec
  lib/            Query cache, calendar, i18n, storage, logger
  locales/        Translations: en, fr, sw
  theme/          Colours, typography, theme store
api/openapi.yaml  Copy of the backend's API spec
design/           Design references and logo sources
scripts/          Asset generators (logo, welcome collage)
```

Tests sit next to the code in `__tests__` folders (outside `src/app`, since every file there becomes a screen).

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the dev server for the development build |
| `npm test` | Run the tests |
| `npm run lint` / `npm run typecheck` | Lint and type-check |
| `npm run gen:api` | Regenerate API types after copying the backend's `docs/openapi.yaml` to `api/openapi.yaml` |
| `npm run doctor` | Check Expo dependencies and config |

## Credits

Welcome screen photos from [Pexels](https://www.pexels.com/), free to use under the
[Pexels license](https://www.pexels.com/license/). Event data from the Ticketmaster Discovery API.

## License

[MIT](LICENSE) © 2026 Bornmajor

## Project docs

[intent.md](intent.md) (what and why) · [spec.md](spec.md) (how) · [plan.md](plan.md) (build plan) ·
[design/](design/README.md) (design references)
