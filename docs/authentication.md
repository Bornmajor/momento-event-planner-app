# Authentication and staying signed in

How Momento signs people in, keeps them signed in, and signs them out. It covers the app
(`momento-event-planner-app`) and the parts of the backend
([momento-planner-api](https://github.com/Bornmajor/momento-planner-api)) it depends on.

## In short

- Sign in once with email and password, or with Google.
- You stay signed in until you **sign out**, **clear the app's storage**, or **reinstall** the app. The one exception
  is not opening the app for more than 30 days.
- The app talks to the backend with a **short-lived access token** (15 minutes). It renews it with a **refresh token**
  (30 days) kept in the phone's secure storage.

## The two tokens

| | Access token | Refresh token |
|---|---|---|
| What it is | A JWT signed by the backend (HS256, `JWT_SECRET`), holding the user id (`sub`) and an expiry | A random string (not a JWT) |
| Lifetime | 15 minutes | 30 days, counted from its last use (`REFRESH_TOKEN_TTL_DAYS`) |
| Sent with | Every protected request: `Authorization: Bearer <access token>` | Only `/auth/refresh` and `/auth/logout` |
| Kept on the phone | In memory only, never written to storage | SecureStore (Android Keystore) |
| Kept on the backend | Nothing: checked by signature and expiry only, no database lookup | MongoDB `RefreshToken` collection, stored only as a **SHA-256 hash** |

Why two tokens:

- **The access token** is cheap to check and goes with every request. If one leaks, it's useless within 15 minutes.
- **The refresh token** is long-lived but rarely sent. The server can revoke it, which is how sign-out works.

## Signing in

All three ways end the same way. The backend returns `{ accessToken, refreshToken, user }`, and the app calls
`startSession`.

| Way | Endpoint | Notes |
|---|---|---|
| Email and password | `POST /auth/login` | "Remember me" decides whether the session is kept after the app closes (see [Remember me](#remember-me)) |
| Sign up (two steps) | `POST /auth/register` | Always remembered |
| Google | `POST /auth/google` | Always remembered; see [Google sign-in](#google-sign-in) |

`startSession`:
1. Saves the refresh token and user id in SecureStore.
2. Keeps the access token in memory.
3. Sets the session to `signedIn`.

The route guard then switches from the sign-in screens to the tabs.

## Staying signed in

### When the app starts (`restoreSession`)

The app shows nothing until it knows the session state, so neither Welcome nor the tabs flash. Then:

1. **No refresh token stored:** you're signed out and see Welcome.
2. **Refresh token found:** the app calls `POST /auth/refresh`.
   - **Success:** you get a new access token **and a new refresh token**. The new refresh token replaces the old one
     in SecureStore. Signed in.
   - **`401`** (expired, revoked or reused): you're signed out.
   - **No connection, timeout or `5xx`:** you're signed in **offline**, with no access token. Cached data such as My
     Events still shows. The first request once you're back online gets a `401`, refreshes, and carries on.

### During use

1. Every request sends the access token.
2. After 15 minutes the backend answers `401`.
3. The API client refreshes **once** and retries the request with the new access token. You don't notice.
4. If several requests get `401` at the same moment, they **share one refresh** (`refreshOnce`). See
   [Rotation and reuse detection](#rotation-and-reuse-detection) for why.

### Rotation and reuse detection

- **Rotation:** every refresh returns a **new pair**, and the old refresh token stops working. A refresh token is used
  once. Because each refresh also starts a new 30 days, someone who opens the app at least once a month stays signed
  in indefinitely.
- **Families:** all refresh tokens from one sign-in form a **family**.
- **Reuse detection:** if anyone presents a refresh token that was already rotated or revoked, the backend revokes the
  **whole family**. Normally only a thief replaying a stolen copy would do that. Both the thief and the real user are
  signed out, and the user signs in again.

That's why the app:
- never runs two refreshes at once, since the second would look like reuse;
- never cancels a refresh halfway through, even when the request that started it is cancelled.

### Remember me

| Remember me | Refresh token kept in | After the app is closed |
|---|---|---|
| On (default) | SecureStore | Still signed in |
| Off (shared phones) | Memory only | Signed out |

Sign up and Google sign-in always remember.

## Signing out

1. The app calls `POST /auth/logout`, and the backend revokes the refresh token. If the phone is offline this step is
   skipped, and the token simply expires on the server.
2. The refresh token and user id are deleted from SecureStore, and the access token is dropped.
3. Session-end listeners run:
   - the query cache and its saved copy on the phone are cleared, so the next person never sees old data;
   - the Google account is signed out, so the account picker shows next time.

Deleting the account (`DELETE /me`) also deletes this user's calendar entries made by Momento, then signs out.

## When you have to sign in again

| Situation | Signed out? | Why |
|---|---|---|
| Closing and reopening the app | No | Refresh token in SecureStore |
| Phone restart | No | Same |
| Opening the app offline | No | Signed in offline with cached data |
| Not opening the app for more than 30 days | **Yes** | Refresh token expired |
| Signing out | **Yes** | Token revoked and deleted |
| Clearing the app's storage (Android: Settings → Apps → Momento → Clear storage) | **Yes** | SecureStore wiped |
| Reinstalling on Android | **Yes** | See [Storage and backups](#storage-and-backups) |
| Reinstalling on iOS | Maybe not | iOS Keychain can survive uninstall (see below) |
| Remember me was off, app closed | **Yes** | Token was in memory only |
| The token was reused (theft suspected) | **Yes** | Whole family revoked |
| Backend `JWT_SECRET` changed | No, after a quick refresh | Old access tokens fail with `401`, and refresh issues new ones |

## Storage and backups

Checked against the [`expo-secure-store` docs for SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/).

**SecureStore (refresh token, user id):**

- **Android uninstall:** the data is deleted. The encryption keys live in the Android Keystore, which removes them
  when the app is uninstalled.
- **Android Auto Backup:** a backup restored after reinstall couldn't be decrypted anyway, so `expo-secure-store`
  excludes its data from backups. Its config plugin option `configureAndroidBackup` defaults to `true` and does this
  automatically, as long as the app has no custom backup configuration. Momento lists the plugin without options and
  has no custom backup rules, so this applies. **Reinstalling on Android always means signing in again.**
- **iOS:** Keychain data can survive an uninstall and reinstall with the same bundle ID, but Expo warns not to rely
  on it. Momento is Android-first; on iOS a reinstall may or may not keep you signed in.

**AsyncStorage (not secret) is included in Android Auto Backup:**

- theme and language preferences;
- the map of calendar entries Momento created (per user);
- the saved copy of My Events (the query cache).

After a reinstall with a restored backup, preferences come back, which is good. You're still signed out, because
SecureStore wasn't backed up.

**Known gap:** after such a restore, the old user's saved-events copy can also come back. If a *different* person
then signs in on that phone, they could briefly see the previous user's My Events list until it refreshes. The fix is
to clear the query cache at start-up when there's no stored session. Not done yet.

## Edge cases

- **App killed mid-rotation.** The backend has issued a new refresh token, but the app was killed before saving it.
  The phone still holds the old one, so on the next launch the backend sees reuse and revokes the family. You sign in
  again. This is very rare and fails safely. A short "grace period" on the backend would avoid it, but it isn't worth
  weakening reuse detection for.
- **Refresh fails with no connection.** The session is kept, and the app retries on the next request. Only a real
  `401` from `/auth/refresh` signs you out.
- **Google account with the same email as an email/password account.** The backend links them only when Google says
  the email is verified; otherwise it refuses with `409 EMAIL_TAKEN`.

## Google sign-in

1. **Configure:** `GoogleSignin.configure({ webClientId })`, using `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, which is the
   Google Cloud "Web application" client ID. It isn't secret.
2. **Pick an account:** `GoogleSignin.signIn()` opens Android's account picker. The app never sees the Google
   password.
   - Before answering, Google checks the app's package name (`com.bornmajor.momento`) and signing key SHA-1 against
     the **Android OAuth client**. If they don't match, it fails with `DEVELOPER_ERROR`.
3. **Get the ID token:** Google returns a signed **ID token**, a JWT holding the Google user id (`sub`), email,
   whether the email is verified, and the name. Its audience (`aud`) is the Web client ID.
4. **Send it:** the app posts `{ idToken }` to `POST /auth/google`.
5. **Check it:** the backend verifies it with `google-auth-library`: signature, issuer, expiry, and an audience that
   must be in `GOOGLE_CLIENT_IDS`.
6. **Find or create the user:**
   - **Known Google id:** that user.
   - **Same email:** link the accounts, only if Google verified the email; otherwise `409 EMAIL_TAKEN`.
   - **Otherwise:** a new user with no password, and `isNewUser: true`.
7. **Start a session:** the backend returns normal Momento tokens, and the session continues exactly like email
   sign-in. The Google ID token is used once and never stored.

Release builds need their own Android OAuth client for the release key's SHA-1, and the client ID set as an EAS
environment variable (plan task 5.9).

## Where it lives

| Part | File |
|---|---|
| Start-up restore, refresh, sign-out (rules) | `src/features/auth/domain/use-cases/session.ts` |
| Session state, tokens on the device, sign-out listeners | `src/features/auth/presentation/state/session-store.ts` |
| Wiring the use cases, connecting refresh to the HTTP client | `src/features/auth/presentation/session-controller.ts` |
| SecureStore and Remember me | `src/features/auth/data/sources/token-local-source.ts` |
| `/auth/*` calls; mapping data and errors | `src/features/auth/data/sources/auth-remote-source.ts`, `src/features/auth/data/auth-repository.ts` |
| Bearer header, shared refresh on `401` | `src/core/api/http-client.ts` |
| Email sign-in and sign-up | `src/features/auth/domain/use-cases/sign-in.ts`, `sign-up.ts` |
| Google sign-in | `src/features/auth/domain/use-cases/sign-in-with-google.ts`, `src/features/auth/data/sources/google-account-source.ts` |
| Clearing cached data on sign-out | `src/core/query/query-client.ts` (`clearQueryCache`) |
| Route guards | `src/app/_layout.tsx` |
| Backend tokens (JWT, rotation, reuse detection) | `src/modules/auth/tokens.ts` in the API repo |
| Backend Google verification | `src/modules/auth/google-verifier.ts` in the API repo |
