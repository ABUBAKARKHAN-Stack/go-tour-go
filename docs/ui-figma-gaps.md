# UI vs Figma: gaps to close (later)

The owner reviewed the app on a phone and said the UI does not match the Figma
design closely enough, especially the **auth screens** and **Home**. This page
records what was verified on 5 Nov 2026 so the work can be picked up later.

- Figma file: https://www.figma.com/design/bO6d8RIpnNL3awG2lQQMA8 (pages: Foundations `0:1`, Screens `4:2`, Components `4:3`)
- All 10 screens in one image: [figma/screens-overview.jpg](figma/screens-overview.jpg)
- Figma access: the connector now uses the "abubakar khan" account (Starter plan). Starter allows very few MCP
  calls a month, so prefer one `get_screenshot` of a whole page (`4:2`, `enableBase64Response: true`; this
  container cannot download figma.com URLs) and `download_assets` only for the images the app needs.

## Screens and node ids

| # | Screen | Node | App file |
|---|---|---|---|
| 01 | Onboarding | `7:2` | `src/app/onboarding.tsx` |
| 02 | Sign in | `7:19` (hero photo `7:20`) | `src/app/(auth)/sign-in.tsx`, `src/features/auth/auth-shell.tsx` |
| 03 | Home | `7:59` | `src/app/(app)/(tabs)/index.tsx` |
| 04 | Explore | `8:100` | `src/app/(app)/(tabs)/explore.tsx` |
| 05 | Destination details | `8:246` | `src/app/(app)/destination/[id].tsx` |
| 06 | Proximity moment | `8:328` | `src/features/proximity/proximity-card.tsx` |
| 07 | Where to | `11:189` | `src/app/(app)/search.tsx` |
| 08 | Route preview | `11:300` | `src/app/(app)/journey/index.tsx` |
| 09 | Navigating | `11:411` | `src/app/(app)/journey/navigate.tsx` |
| 10 | Hazard ahead | `11:473` | `src/features/alerts/hazard-card.tsx` |

Not in Figma (designed in code): Offline Pakistan, SOS/live link screen, Guest welcome.

## Gaps found so far (code compared with the frames)

### Auth (02 Sign in; Sign up, Forgot/Reset password follow it)
- **Hero art:** Figma uses a full-bleed **photo** of the Badshahi Mosque at sunset (300 px high, fading into
  the background). The app draws a vector scene (`HeroScene` in `src/components/illustrations.tsx`), made
  when Figma exports were rate-limited. Export `7:20` with `download_assets` and use it as the hero image.
- **Layout:** title "Welcome back" sits on the fade over the photo; check spacing (form starts at y 262,
  fields 56 px high with 24 px label gap, 16 px between fields, "Forgot password?" right-aligned, 56 px
  buttons, "or" divider, outline "Create an account", terms line pinned near the bottom).
- Sign up / Forgot / Reset use `AuthShell compact`; Figma has no frames for them, so they should follow 02.

### Home (03)
- Matches: context line (day · temperature · city), greeting in the display font, bell with dot and avatar,
  search field with a filter button, "You're near" card, category chips with "All" selected, "Near you"
  carousel, floating tab bar.
- Differences in the app:
  - Extra blocks between the header and "Near you" (location status card, travel alerts) push the carousel
    below the fold; Figma shows "Near you" directly after the chips.
  - Destination tiles have no **bookmark button** on the photo (Figma: white square button, top right).
  - **235 of 545** active destinations have no photo (310 have one, checked 5 Nov), so those tiles show a
    category icon; Figma assumes photos everywhere. Needs a better placeholder or more photos.
  - The "You're near" card only shows within 5 km of a landmark; Figma shows it as a permanent spotlight.
  - Extra sections below (shortcuts grid, weather, popular, trips, saved) are not in Figma; keep them below
    "Near you" but match the card styles.

### Destination details (05)
- Figma splits the content with an **Overview / History / Tips** segmented control; the app shows the
  sections one after another. Figma also has a photo count badge on the hero, share and bookmark buttons on
  the photo, a rating · distance · open-now line, and Hours / Entry info cards.

### Still to verify (need current app screenshots)
- Onboarding (now uses the Figma illustration), Explore bottom sheet and map controls, the rest of
  Destination details, Proximity card, Where to, Route preview, Navigating, Hazard card.
- Ask the owner for screenshots of each app screen, then compare side by side with the frames above.
