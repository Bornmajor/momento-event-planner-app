# Architecture

How Momento's code is organised: the layers, what each one does, how they talk to each other, and how errors turn
into messages. The design decisions behind it are in [spec.md §12](../spec.md). Sign-in and token handling are
covered separately in [authentication.md](authentication.md).

## The layers

Every feature follows the same flow, from where data comes from to what the user sees:

```
  source  ──▶  repository  ──▶  use case  ──▶  hook / store  ──▶  UI
 (I/O only)    (mapping)       (rules)        (state)           (screens)
   DTOs,       DTO → model,    only when       TanStack Query,   screens and
   raw errors  error → failure there are       Zustand           components
                               real rules
```

| Layer | Folder | Role | Knows about |
|---|---|---|---|
| **Source** | `data/sources/` | Talks to one thing: the API (`*-remote-source.ts`) or the device (`*-local-source.ts`: SecureStore, AsyncStorage, the Google SDK). Returns the API's shapes (DTOs) and throws raw errors. | HTTP, device APIs |
| **Repository** | `data/*-repository.ts` | The **only** place that converts: DTO → domain model (`mappers/`), raw error → domain failure. Throws failures. | Sources, mappers, domain types |
| **Use case** | `domain/use-cases/` | Business rules that span several steps or repositories, e.g. "create the account, start the session, then set its language". Plain functions that receive what they need as an argument. | Domain models, ports |
| **Hook / store** | `presentation/hooks/`, `presentation/state/` | Server state with TanStack Query (caching, loading, retries, offline queue) and client state with Zustand (session, preferences). | Use cases or repositories |
| **UI** | `presentation/screens/`, `presentation/components/` | Draws the screen, handles input, and turns failures into words. | Hooks, stores |

**Use cases only where there are rules.** Reading data (event search, categories, the profile) goes straight from a
hook to the repository. There's no use case that just passes a call through.

**`domain/` is plain TypeScript.** It holds the app's own models, rules, failures, the interfaces it needs (`ports.ts`)
and the use cases. It never imports `data/`, `presentation/`, React, TanStack Query, Zustand or Expo Router. A use case
gets its repositories as an argument (`signUp(input, deps)`), and each feature's presentation layer passes the real
ones in.

## Project structure

```
src/
  app/            Routes (Expo Router). Every file is a screen; each is a one-line re-export of a feature screen.
                  _layout.tsx is also the composition point that connects features that must not import each other.
  core/           Shared infrastructure, no feature code:
    api/            HTTP client (Bearer token, single shared token refresh, timeout, cancellation), raw API errors,
                    types generated from the backend's OpenAPI spec
    failures/       Domain failures shared by every feature, mapApiError, asFailure, failureMessage
    calendar/       The phone's calendar (used by personalize, saved events and profile)
    query/          TanStack Query client, cache times, query keys, retry rule
    i18n/  theme/  storage/  hooks/  logger.ts
  components/     Shared UI kit (buttons, fields, layouts, snackbar) and form helpers
  features/       One folder per feature: auth, events, saved-events, personalize, profile, settings, welcome
  locales/        en.json · fr.json · sw.json
```

### Inside a feature

```
features/auth/
  index.ts                 Public API: the only thing other features may import
  data/
    sources/               auth-remote-source.ts (/auth/*), token-local-source.ts (SecureStore),
                           google-account-source.ts (Google SDK)
    dto/                   auth.dto.ts: the API's JSON shapes
    mappers/               user.mapper.ts: DTO → domain model
    auth-repository.ts     Calls the sources, maps data and errors
  domain/
    models/                user.ts, session.ts
    failures.ts            EmailTakenFailure, InvalidCredentialsFailure, GoogleSignInFailure
    ports.ts               AuthRepository, SessionGateway, Preferences: what the use cases need
    use-cases/             sign-up.ts, sign-in.ts, sign-in-with-google.ts, session.ts (restore, refresh, sign-out)
  presentation/
    session-controller.ts  Wires the real repository and session into the use cases
    state/                 session-store.ts, sign-up-draft-store.ts (Zustand)
    hooks/                 use-sign-up.ts, use-sign-in.ts, use-google-sign-in.ts (TanStack Query)
    screens/               sign-in, details-step, password-step, …
    components/            auth-parts.tsx, password-strength-meter.tsx
    schemas.ts             Form validation (zod)
```

Simpler features have fewer folders: settings and welcome are presentation only, and events has no use cases.

**File names** are kebab-case with a role suffix: `*-remote-source.ts`, `*-local-source.ts`, `*.dto.ts`,
`*.mapper.ts`, `*-repository.ts`, `use-*.ts`, `*-store.ts`, `*-screen.tsx`.

### How the pieces may depend on each other

```
presentation ──▶ domain ◀── data        core/ and components/ ◀── everyone
      └──────────▶ data                  feature A ──▶ feature B only through B's index.ts
```

- `domain/` depends on nothing in its own feature; `data/` implements its interfaces; `presentation/` uses both.
- A feature imports another feature **only through its public `index.ts`** (`@/features/auth`), never its internals.
- `core/` and `components/` never import a feature.
- When two features would need each other, `src/app/_layout.tsx` connects them instead. For example, auth needs to
  save a new account's language, which belongs to profile, so the layout calls `configureAuth({ queueLanguageUpdate })`.

These rules are checked by ESLint (`no-restricted-imports` in `eslint.config.js`), so `npm run lint` fails on a
wrong import.

## Example: signing up

What happens when someone taps **Create Account** on the second sign-up step.

```
PasswordStepForm  (presentation/screens/password-step-screen.tsx)
   │  form valid (zod) → signUp.mutateAsync({ firstName, lastName, email, password })
   ▼
useSignUp         (presentation/hooks/use-sign-up.ts)  – TanStack useMutation
   │  signUp(input, authDeps)
   ▼
signUp            (domain/use-cases/sign-up.ts)        – the rules
   │  1. auth.register(input)
   │  2. session.start(session, remember = true)
   │  3. new accounts start in English → queue the app's language if it differs
   ▼
authRepository    (data/auth-repository.ts)            – mapping
   │  authRemoteSource.register(dto) → toAuthSession(dto)
   ▼
authRemoteSource  (data/sources/auth-remote-source.ts) – I/O
   │  POST /auth/register through core/api (JSON, timeout, typed raw errors)
   ▼
Momento API
```

On the way back:

1. The source returns the API's JSON (`AuthResponseDto`).
2. The repository maps it to the domain `AuthSession` with `toUser()`, keeping only known fields.
3. The use case calls `session.start()`. The session store saves the refresh token in SecureStore, puts the user in
   the `me` cache, and marks the session `signedIn`.
4. The route guard in `src/app/_layout.tsx` sees `signedIn` and opens the tabs. The screen shows "Welcome to Momento,
   Ada!".

## Errors: from raw error to message

Errors change shape exactly twice, each time in one place:

```
raw error  ──(repository)──▶  domain failure  ──(UI)──▶  message on screen
ApiError(409,'EMAIL_TAKEN')    EmailTakenFailure          "An account with this email already exists."
NetworkError                   NetworkFailure             "No connection. Check your internet and try again."
```

**1. Sources throw raw errors.** The HTTP client (`core/api/http-client.ts`) turns every outcome into one of:
`ApiError(status, code, message, details)` when the API answered with an error, `NetworkError` when there was no
answer, or `RequestCancelledError` when the request was cancelled.

**2. Repositories turn raw errors into domain failures.** Each repository checks its own codes first, then hands
the rest to the shared `mapApiError()`:

| Raw error | Failure | Where defined |
|---|---|---|
| `EMAIL_TAKEN` / `INVALID_CREDENTIALS` | `EmailTakenFailure` / `InvalidCredentialsFailure` | auth |
| `NOT_FOUND` (an event) | `EventNotFoundFailure` | events |
| `SAVED_LIMIT_REACHED` | `SavedLimitFailure` | saved-events |
| `AI_LIMIT_REACHED` | `AiLimitFailure` | personalize |
| `VALIDATION_ERROR` | `ValidationFailure(fields)` | core |
| `UNAUTHENTICATED` | `UnauthenticatedFailure` | core |
| `RATE_LIMITED` | `RateLimitedFailure` | core |
| `SERVER_UNREACHABLE`, `UPSTREAM_UNAVAILABLE`, `INTERNAL` | `ServerUnavailableFailure` | core |
| `NetworkError` / `RequestCancelledError` | `NetworkFailure` / `CancelledFailure` | core |
| Any other API code | `RejectedFailure(code)` | core |
| Google SDK errors | `GoogleSignInFailure` | auth |

Every failure extends `AppFailure` and has a `code`. Repositories **throw** failures rather than returning them,
because TanStack Query's error states, retries and offline queue all work with thrown errors.

**3. The UI turns failures into words.** Failures say *what* went wrong; only presentation decides *what to say*:

- `failureMessage(failure)` returns the translation key `errors.<code>` (or `errors.UNKNOWN`), and `t()` turns it
  into a sentence in the user's language (`locales/*.json`).
- `applyFailure()` puts a `ValidationFailure` on the matching form fields; anything else becomes a snackbar.
- Screens handle special cases with `instanceof`. In the sign-up example, `EmailTakenFailure` sends the user back to
  step 1 with the email field marked, and `AiLimitFailure` on Personalize offers "Use original text".
- Presentation never looks at raw API errors. Anything that isn't a failure (a bug) becomes `UnknownFailure`
  (`asFailure`).

**Failures also drive behaviour, not just messages:**

- TanStack Query retries only `NetworkFailure` and `ServerUnavailableFailure`, at most twice.
- Only an `UnauthenticatedFailure` from the token refresh signs the user out. No connection keeps them signed in with
  cached data.
- A save queued offline that fails with `EventNotFoundFailure` is removed from My Events, with a notice.

## Testing by layer

| Layer | What the tests check | Example |
|---|---|---|
| Repository | DTO mapping (unknown fields dropped), raw error → failure | `events-repository-test.ts` |
| Use case and flow | The rules, with only the sources faked, so mapping, use case and store run for real | `session-test.ts`, `google-sign-in-test.tsx` |
| Screen | Validation, failures shown in the right place | `password-step-test.tsx`, `personalize-form-test.tsx` |
| Core | HTTP client, failure mapping, retry rule | `http-client-test.ts`, `failures-test.ts` |

Tests live next to the code in each feature's `__tests__/` folder (outside `src/app`, where every file is a route).
