# Design direction

Reference images are in [reference/](reference/). This file records how the final app differs from them.

## Welcome screen (shown right after the splash screen)

Based on [reference/welcome-screen.png](reference/welcome-screen.png):

- **Top:** a collage of tilted, rounded event photos with a soft fade. The source image is
  [reference/welcome-collage-source.png](reference/welcome-collage-source.png); `scripts/prepare-collage.cjs` crops it and
  makes the white background transparent (so it works in dark mode), writing `assets/images/welcome-collage.png`.
  A tall, gentle fade sits over the bottom (photos stay ~70–80% visible through most of it, solid only at the edge).
- **Below, everything centered:**
  1. App name **"Momento"** (large, bold), replacing "Live Every Event Moment"
  2. Slogan **"Looking ahead and planning what's next"**
  3. A wide, pill-shaped **Get Started** button
  4. **"Already have an account? Sign In"** ("Sign In" bold and tappable)
- The Google and Facebook circle buttons from the reference are **left out**. Google sign-in lives on the auth
  screens.
- **Brand colour:** Dribbble pink `#EA4C89`, replacing the reference's teal (see Logo below).

## Logo

**"Calendar M"**: a solid calendar page with two binder tabs and a cut-out "M", in `#EA4C89`. There's no
background tile: the mark itself is transparent, so the M cut-out shows whatever is behind it.

- **App icons** need an opaque background (iOS doesn't allow transparent icons): use the pink mark on a white
  tile, or a white mark on a pink tile.
- **Contrast:** `#EA4C89` on white is about 3.6:1. That's fine for the logo and large shapes, but too low for
  small white text. Buttons with white labels should use a darker pink such as `#C9356F` (about 5:1).

## Auth screens (Sign In, Sign Up, Forgot Password, Create New Password)

Based on [reference/auth-screens.webp](reference/auth-screens.webp), **without the dark blurred photo background**:

- **The background is plain** and follows the app theme (light or dark).
- **Layout:**
  - A round back button at the top left.
  - A centered bold title and a short subtitle.
  - Pill-shaped inputs with a leading icon (mail or lock), and an eye toggle on password fields.
  - A full-width pill-shaped primary button.
  - "or continue with" divider, then a pill-shaped **Google** button.
  - A footer link ("Don't have an account? Sign Up" / "Remember your password? Sign In").
- **Sign In:** email, password, a "Remember me" checkbox and a "Forgot Password?" link.
- **Sign Up:** not in the reference. Same style, with first name, last name, email and password.
- **Leave out Apple sign-in** in Version 1 (a future feature).
- **Forgot Password / Create New Password are UI templates only** in Version 1; no backend yet.
- The password checklist must match the backend rules: **at least 8 characters, one letter, one number**. The
  reference shows "one uppercase letter", which the backend doesn't require.

## Forms (all screens, app-wide rule)

- Fields scroll; the **actions are pinned to the bottom**: the primary button first, then secondary links such as
  "Already have an account? Sign In". They stay above the keyboard and the home indicator.
- Build every form with `FormScreen` (`src/components/ui/layout.tsx`) and pass the buttons as `actions`.
- Onboarding flows (Sign Up): a top bar with the back button, then the segmented progress indicator under it, both
  inside the top safe area.

## Explore (Home)

Based on the "Live Moment / Explore the Events" reference screen, adapted to Momento's pink theme and the original plan
(native tabs Explore · My Events · Settings, not the reference's floating tab bar):

- Header: initials avatar, "Hello" + full name, round search button (opens a search field under the title).
- Title on two lines, "Plan What's Next / Explore **the Events**", the emphasis in brand pink.
- Category pill chips ("All" first); the selected chip is filled with the primary colour.
- Event cards: title, date and venue, a "Details" pill on the right, and a large rounded image underneath.
- The Ticketmaster data has no attendee counts, so the reference's "1.2k+ people joined" row is left out.
