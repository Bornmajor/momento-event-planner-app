# Intent — Smart Event Planner (Momento)

> Status: **DRAFT — awaiting approval**. Phase 1 of the workflow (intent → spec → plan → TDD → review → release).
> Once approved, this is the source of truth for scope. Changes need explicit agreement.
>
> Related docs:
> - **Backend spec:** `C:\Users\Admin\Documents\node\momento-planner-api\spec.md` (approved)
> - **Frontend spec:** to be written in this repo

## 1. Purpose

A mobile app that helps people discover events worldwide and add them to their device calendar. Before saving,
the user can have the event's details personalized with AI: shortened, rewritten in their language, or both.
It's a portfolio project built as a full-stack system: an Express + MongoDB backend and an Expo (React Native) mobile client.

## 2. Target users & platforms

- **Users:** people anywhere in the world looking for events to attend.
- **Event coverage (Version 1):** English-speaking countries only (GB, US, IE, AU, NZ, CA). Ticketmaster's language
  filter turned out to be unreliable (backend spec §8), so the country is used to filter instead.
- **Platforms:** Android (primary, tested). iOS is supported where it costs little extra, but iOS isn't guaranteed to be tested.
- **Not supported:** web.
- **Not published to app stores in Version 1.**
- **Deployment:** runs locally for the demo. The backend should be easy to host later (config through environment variables, no hard-coded hosts).

## 3. Guiding principles

- **The backend does the work.** The mobile app is a thin client. Event fetching, authentication, AI and user data
  all go through our backend. The app never calls Ticketmaster or the AI provider directly, and no third-party
  secrets ship in the app.
- **The device calendar is the one exception.** Writing to the calendar happens on the device. The backend records
  which events the user saved.
- **Easy to swap the event source.** Ticketmaster is the first event provider. The backend should allow another provider
  to be added later without changes to the mobile app.
- **Keep it simple and cheap.** Prefer one well-designed AI call over chaining several services together.

## 4. In scope — Version 1

### 4.1 Authentication
- Sign up and log in with **email + password**.
- Sign up and log in with **Google**.
- Log out. The session stays active across app restarts.
- The backend issues and checks sessions. The mobile app stores the session securely on the device.
- Screens for **Verify email** and **Forgot password** exist in the app as **UI templates only** (not functional in Version 1).

### 4.2 Event discovery (through the backend, sourced from Ticketmaster)
- Browse a list of upcoming events, with pagination or infinite scroll.
- **Search** events by keyword.
- **Filter** events by category, using Ticketmaster's categories (e.g. Music, Sports, Arts & Theatre, Film).
- An event details screen: title, image, date and time, venue, category, description or info, and a link to buy tickets on Ticketmaster.

### 4.3 Saved events ("My Events")
- The backend stores **only the event IDs** each user has saved. No copy of the event's data is stored.
- The **My Events** screen gets the user's saved IDs and loads each event's current details through the backend.
- If an event is no longer available from the source (cancelled or removed), it's shown as unavailable and the user can remove it.
- The user can **remove** a saved event. This deletes the backend record and, if it exists on this device, the calendar entry.
- The ID of each **device calendar entry is stored on the device**, not in the backend, because each device's calendar
  has its own IDs. It's needed to update or delete the calendar entry later.

### 4.4 Personalize & add to calendar (AI)
When the user taps **Set reminder / Book event**:
1. The app opens a **Personalize** screen with the event's details.
2. The user picks options:
   - **Shorter description**: a short version that keeps the important information (date and time, venue, ticket link, key notes).
   - **Translate**: rewrite in a chosen language (English, French or Swahili). The current app language is selected by default.
   - The options can be combined. The user can also skip AI and use the original details.
3. The backend makes **one AI request** that summarizes and translates together, and returns the personalized text.
4. The user **previews and can edit** the result, picks a reminder time, and confirms.
5. The app writes the personalized event to the **device calendar**, and the backend records the event ID as saved.

AI rules:
- The AI may only use the event's real data. Missing details are left out, not made up. Dates, times, venue and links are kept exactly as given.
- AI runs **only when the user asks for it**, never in advance for every event.
- Results are **cached** for each event, option set and language, so asking again costs nothing. Each user has a request limit.
- A small, low-cost model is used: `claude-haiku-5-5` (see the backend spec).

### 4.5 Settings
- **Theme:** follows the system by default. The user can switch to Light or Dark, and the choice is kept.
- **Language:** English, French or Swahili, applied to all app text. The choice is kept and sent to the backend
  as the default language for personalization.
- **Profile:** view and edit first name, last name and phone number. Email is shown but can't be edited.
- Log out.

### 4.6 Offline support (saved events only)
- **My Events and its event details open without a connection,** from the last synced copy kept on the device.
- **Saving or removing an event while offline is queued** and sent automatically when the connection returns.
- Search, event discovery and AI personalization need a connection and show a clear "You're offline" message.
- Calendar entries already work offline, because they live in the device calendar.

## 5. Out of scope — future features

| Feature | Notes |
|---|---|
| Location-based filtering ("near me") | Needs location permission and a radius search. Ticketmaster supports this. |
| Email verification, forgot or reset password | Screens are stubbed in Version 1 |
| Sign in with Apple | Needed before publishing to the iOS App Store when Google sign-in is offered |
| Profile picture | Upload and storage |
| Translating event descriptions on the details screen | Can reuse the Version 1 AI translation and its cache |
| Offline support beyond saved events (e.g. search history) | Saved events are offline in Version 1 (§4.6) |
| AI event recommendations ("For you") | Needs interests and booking history |
| Capacity limits / RSVP counts | — |
| Payments / ticket purchase in the app | Version 1 links out to Ticketmaster |
| Extra event sources (better Africa coverage) | Enabled by the swappable event source |
| Worldwide events (all countries) | Needs offline language detection on event text, so translation is offered only when the text isn't already in the user's language |
| Push notifications, web support, app store release | — |

## 6. Constraints

- **Mobile:** Expo SDK 58 with Expo Router (already set up in this repo). Native features need a development build.
- **Backend:** Express.js + MongoDB.
- **Event data:** Ticketmaster Discovery API. The free key has a daily request limit, so the backend should cache responses.
  This matters most for My Events, which loads event details by ID.
- **AI:** called only from the backend, with the key in environment variables.
- **Budget:** demo or portfolio project, so the cost of outside services should be close to zero.

## 7. Success criteria (Version 1 demo)

1. A new user can sign up with email and password or with Google, close the app, and still be logged in after reopening it.
2. The user can browse, search and filter by category, and open an event's details.
3. The user can personalize an event (shorter and/or translated, e.g. into Swahili), edit the result, and add it to their Android calendar with a reminder.
4. The saved event appears under My Events with current details, and removing it also deletes the calendar entry.
5. Switching theme or language takes effect immediately and is kept after a restart.
6. Profile edits are saved to the backend and appear again after logging back in.
7. No third-party API keys are in the mobile app bundle.
8. With the network off, My Events still shows the saved events. An event removed offline is gone from the server
   once the connection returns.

## 8. Decisions log

| # | Decision | Outcome |
|---|---|---|
| 1 | Translating the details screen | Future feature |
| 2 | Event source | Ticketmaster only for Version 1, with a swappable provider design |
| 3 | Saved event storage | Event IDs only, no copy of event data. Calendar entry IDs stay on the device. |
| 4 | Sign in with Apple | Future (no app store release planned) |
| 5 | Personalization approach | One AI request on demand (shorten and/or translate), cached, previewed by the user |
| 6 | Offline support | Moved into Version 1 (2026-11-06), **saved events only**, using TanStack Query persistence, not WatermelonDB (frontend spec §5.2) |
