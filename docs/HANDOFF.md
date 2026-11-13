# GoTourGo: agent and developer handoff

Read this first if you are picking up the project, whether you are another AI agent or a developer.
It describes the state on **6 Nov 2026** (latest main: PR #31). The project is being handed from
Claude Code to the owner's next agent (Antigravity); everything needed to continue is in this file,
[CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md) (the client's brief mapped to the app, with what is
left) and [ui-figma-gaps.md](ui-figma-gaps.md). The non-technical walkthroughs for the client are
separate documents shared with the owner.

## 0. Status board (read this first)

**Where things stand on 6 Nov 2026:** everything below is merged into `main` (PR #31 is the last). The
working tree is clean, there are no open PRs, and `claude/great-gates-0mn6vd` equals `main`. Client brief
coverage is about **95%** of features; landmark **content** is the main gap: 523 landmarks shown, 357 fully bilingual (all visible ones; 140 with AI-drafted Urdu to review), 166 English-only, 43 with the full guide. Landmarks are added and edited through the bilingual sheet: [LANDMARKS-IMPORT.md](LANDMARKS-IMPORT.md).

### Applied (merged)

| Area | What exists | PRs |
|---|---|---|
| Core MVP | Auth, onboarding, Home, Explore map, geofenced landmark alerts, details, search, trips, saved, AI guide, Lens, Scan, community, messaging, safety | #1–#3 |
| Redesign + Figma | Theme, fonts, floating tab bar; auth, Home and details close to Figma | #4, #22–#24 |
| Data | 523 landmarks shown (836 rows; 313 hidden), 37,111 places, offline search, Urdu guides | #7, #9–#11 |
| Journey mode | Route preview, turn-by-turn with voice, landmarks/hazards on the way, re-routing | #8 |
| Hazards | Traveller hazard reports, road alerts | #12 |
| Forms | React Hook Form + Zod everywhere | #13 |
| Brand | Logo set, icon, splash | #14, #18 |
| Offline Pakistan | Map downloads (country, overview, 4 regions), offline style, saved routes | #5, #6, #15–#17 |
| Safety | SOS + live links, web page, App Links | #18 |
| Stability | Offline sign-in, error screen + Last error, JSON-safe cache | #19, #20 |
| Motion | Tab pill, press feedback, skeletons, entrances | #25 |
| Client brief gaps | Map card rating + travel time, saved places on map, followers lists, AI culture/shopping/food guides | #28 |
| Cleanup | gluestack packages, template images and skill removed | #28 |
| Community | Posts at a place, All / Following feed, double-tap like, comments (instant, reply, confirm delete), stories (progress, pause, seen rings, next author) | #29 |
| Selected buddies | Live location with all friends or chosen friends (`location_share_viewers`); SOS always all friends | #37 |
| Video posts + haptics | Clips up to 60 s with poster frames, tap-to-play inline/full screen; touch feedback; unused native modules removed (**new APK**) | #39 |
| Instagram-style posting | Up to 10 photos/videos per post (carousel) and per story batch, video stories, captions optional with media, search any landmark or offline place as the location, background upload with a progress card on Community (Retry / Discard), @mention links, share links to `/p?id=` | #40, #41 |
| Social upgrade | For you / Nearby (50 km) / Following feeds; search (travellers, posts, places); bookmark + Saved posts; share with count; place rating and newest comment on each post; compose button; place-labelled stories; unread Messages badge | #38 |

### Tested on the owner's phone (Pixel 3, Android 12)

- Offline map engine, Karachi land fix, Lahore offline, offline sign-in, Home crash fix (PRs #17–#20).
- APK `4df88d41` installs; the #28 OTA update (map card, saved filter, followers, AI guides): **all working**
  (owner, 6 Nov).

### Built but NOT yet tested on a device

- **#29 community update + #37 buddies + #38 social upgrade**: the owner has not published/tested them yet. First job: ask the owner to run
  `bunx eas-cli update --channel preview --message "Community"` and walk through section 16 step 1.
- PR 6 details on the new APK: SOS WhatsApp link opening in the app (App Links), web page on desktop,
  "I'm safe", live link.
- Motion pass (#25) and auth redesign (#22) feel on the device (the owner said the app works; no detailed check).

### Remaining work, in priority order

**UI restyle to the client's design guide (started 9 Nov).** Same app, same features and tabs (Home · Explore ·
Trips · Community · Profile), new look; no Google sign-in and no features from the AI mockups that the app doesn't
have. Phases: A brand kit + style tile (done, Figma `oEFixqzn09XSHhoI3oXM39`) → B foundations (done: tokens, fonts,
components, logo) → C welcome/onboarding/auth (done: `features/brand/mood.tsx`, real Wikimedia photos in
`features/brand/hero-photos.ts`) → D Home + Explore → E destination page + "Ask AI" sheet → F AI
Assistant → G Trips/Community/Profile/Saved → sweep of the other screens → H app icon + splash (**the only native
step: new APK**). B–G and the sweep are OTA. Brand: `assets/brand/v2/README.md`.


1. Device test of #29 and PR 6 (above); fix what the owner reports.
2. ~~Selected buddies for live sharing~~ (client 7.3): done, needs a device test (two friends, pick one).
3. ~~Video posts~~ (client 6.2) + ~~haptics~~: done in #39 (native). **Needs a new APK build from the owner's
   login before testing; OTA updates published after #39 only reach that new build.**
4. **Landmark content**: the client fills the 166 English-only landmarks and richer sections through the
   bilingual sheet (LANDMARKS-IMPORT.md). Don't restart the Gemini Urdu job on the free key: it exhausts the
   daily quota the app's AI guide needs (see LANDMARKS-IMPORT.md section 7).
5. **Next APK build**: #39 added `expo-video` + `expo-haptics` and removed `expo-device` + `expo-web-browser`.
   Owner runs `bunx eas-cli build -p android --profile preview` from their own login.
6. **Duplicates:** cleaned on 6 Nov (14 hidden); re-run the near-duplicate query in LANDMARKS-IMPORT.md after big imports.
7. **PR 7 guest mode**: built (section 17); goes live when the owner enables anonymous sign-ins and manual linking.

## 1. What the project is

GoTourGo is an Android travel companion for Pakistan and the owner's final-year project (FYP). It is a
working MVP, not a mock-up.

| Part | Technology |
|---|---|
| App | Expo SDK 58, React Native 0.88, Expo Router (`src/app`), TypeScript, React Compiler |
| Styling | Uniwind (Tailwind v4) with semantic tokens in `global.css`; own components in `src/components` |
| Data | Supabase (Postgres + RLS, Auth, Storage, Realtime Broadcast), project id `bovepoelpxsstguclftl` |
| Server code | One Supabase Edge Function, `ai`, which calls Gemini (chat + Visual Lens) and enforces a per-user daily quota |
| Maps | MapLibre RN v11 with a self-built PMTiles map of Pakistan, published as a GitHub release; online fallback is OpenFreeMap |
| Routing / weather / nearby | FOSSGIS OSRM, Open-Meteo and Overpass (all keyless public services) |
| Client state | TanStack Query, persisted to `expo-sqlite` localStorage (offline reads); React Hook Form + Zod for forms |
| Animation | Reanimated 4 (CSS transitions + layout animations), see `src/lib/motion.ts` |
| Builds | EAS Build (`preview` profile, APK), EAS Update (OTA, `runtimeVersion: fingerprint`), EAS Hosting for the share site |

Live data (checked 6 Nov 2026): 545 active landmarks (`destinations.active`; 836 rows incl. 291 inactive OSM rows) in 169 cities and towns, 310 with photos,
332 with Urdu text, 37,111 `places` for offline search, 54 `nearby_services` and 10 `road_alerts`.

## 2. Repository layout

```
src/app/                 routes only (Expo Router). (auth)/ sign-in etc., (app)/(tabs)/ the 5 tabs,
                         (app)/* stack screens, sos.tsx + live.tsx (App Link targets), onboarding.tsx
src/features/<area>/     api.ts (Supabase/HTTP + React Query hooks), schemas.ts (Zod), components, tests
                         areas: ai alerts auth community data destinations inbox journey location map messaging
                         nearby notifications offline proximity reviews routing safety saved social trips weather
src/components/          shared UI (AppButton, form controls, Screen, states + skeletons, tab bar, Text wrapper)
src/lib/                 supabase client, env, i18n (tx), theme, motion, forms, query cache, crash log, geo
src/i18n/ur.ts           Urdu strings keyed by the English source text
supabase/migrations/     SQL migrations (file names = the versions applied in the project)
supabase/functions/ai/   Gemini edge function (secrets: GEMINI_API_KEY, optional GEMINI_MODEL, GEMINI_FALLBACK_MODEL, AI_DAILY_LIMIT, AI_DAILY_LIMIT_GUEST)
scripts/                 import_pakistan_data.py (OSM → Supabase), build-pakistan-map.sh, make-water-polygons.py,
                         check-pakistan-map.py, build-share-site.mjs, check-translations.cjs, brand/, tests/
site/                    static SOS / live-location web page (EAS Hosting)
docs/                    TESTING.md (device checklist), ui-figma-gaps.md, figma/screens-overview.jpg, this file
.github/workflows/       build-pakistan-map.yml, import-pakistan-data.yml (both manual, workflow_dispatch)
assets/brand/            logo set (see assets/brand/README.md); assets/illustrations/ auth hero, onboarding art
```

## 3. Build order and PR history

The owner's plan has 7 feature PRs (PR 1–7), plus a forms PR, a language PR and hotfixes. GitHub numbers
differ from plan numbers.

| GitHub | What it did |
|---|---|
| #1 | Initial MVP (all core features), Android permissions/plugins, EAS environments, docs |
| #2 | Fix EAS Android build (no web server bundle) |
| #3 | Fix unmatched route after onboarding/sign-out; add EAS Update |
| #4 | **Plan PR 1:** redesign basics (warm editorial theme, fonts, floating tab bar) + map-file workflow |
| #5, #6 | Offline map build fixes (cached sources, ocean polygons) |
| #7 | **Plan PR 2:** Pakistan places and landmarks, offline search |
| #8 | **Plan PR 3:** journey mode (route preview, turn-by-turn, landmarks + hazards on the way) |
| #9, #11 | Data import fixes (fail loudly; load CSV columns by header) |
| #10 | Language PR: English + Urdu first-class (UI, RTL, Nastaliq, Urdu guides) |
| #12 | **Plan PR 4:** exploring upgrades + traveller hazard reports |
| #13 | Forms: React Hook Form + Zod on all forms |
| #14 | Brand: logo set + Figma onboarding illustration |
| #15, #16 | Map build: Karachi sea fix (EPSG:4326 .prj), region packs, overview map, glyphs |
| #17 | **Plan PR 5:** Offline Pakistan (map downloads, offline style, saved routes) |
| #19 | Hotfix: stay signed in offline; error screen + Last error instead of crashing |
| #20 | Hotfix: Home crash after restart (a Map in the persisted cache; now a Record, buster v2) |
| #21 | Docs: UI gaps against Figma (`docs/ui-figma-gaps.md`) |
| #18 | **Plan PR 6:** SOS + live-location links, App Links, brand icon/splash (**native change**), offline map fixes |
| #22 | Auth screens: Figma photo hero, auto username with live availability check, one shell |
| #23, #24 | Home and destination details closer to Figma; record Figma progress |
| #25 | Motion: tab pill, press feedback, skeleton loaders, entrances (JS only) |
| #26, #27 | Docs: this handoff; `.gitignore` is part of the fingerprint |
| #28 | Client brief gaps (map card rating + travel time, saved places on map, followers/following lists, AI culture/shopping/food guides) + removal of unused gluestack packages, template images and skill; `docs/CLIENT-REQUIREMENTS.md` |
| #29 | Community: posts at a place (destination section, `place-posts/[id]`, Post from here), All / Following feed, double-tap like, comments (instant, reply, confirm delete, counts), stories (progress bar, hold to pause, seen rings, next author, own bubble) |
| #30 | Docs: final handoff, status board, PR 7 plan |
| #31 | Hand-fed landmarks: CSV templates + guide (`docs/LANDMARKS-IMPORT.md`), Pakistan bounds check, `landmark-photos` bucket, Urdu import by slug; landmark counts corrected to 545 shown |

## 4. Current status and phase

**Phase:** device testing of the new APK and OTA updates; closing the last client-brief gaps.

| Plan PR | State |
|---|---|
| 1 Redesign basics | Done |
| 2 Data + offline search | Done |
| 3 Journey mode | Done |
| 4 Exploring + hazards | Done |
| 5 Offline maps | Done; tested on a Pixel 3 (Android 12): engine test, Karachi land fix, Lahore offline |
| 6 SOS links + App Links + icon | Merged (#18). Site deployed. **APK built** 5 Nov (build `4df88d41`, from #25); owner device test of SOS links / App Links pending |
| 7 Guest mode | Built: guest rules in the database (`20261111154858_guest_mode`), "Continue as guest", account prompt, guest profile, upgrade keeping saved data, smaller AI quota. Live once the owner turns on anonymous sign-ins and manual linking and deploys the `ai` function |

**APK build (5 Nov):** the build started through the Expo MCP connector (`fbb72c6e`) failed: that token
has scopes `VIEW,RUN` and cannot read the Android keystore. The owner then built from their own login:
build `4df88d41-dd7f-49ef-ba7f-c507fb1bb53d`, commit 9eb6665 (#25), runtime version
`3fe76e5cf118d6dab2ca927c48939d3ffb301edf`. **Always start builds from the owner's login**
(`bunx eas-cli build -p android --profile preview`), never through MCP.

**Known issues / open items**

- Attabad Lake has 3 rows in `destinations` (duplicate cleanup pending; check for other duplicates too).
- UI: on hold until the client shares their own design (8 Nov); the old Figma gaps in
  [ui-figma-gaps.md](ui-figma-gaps.md) are no longer planned work.
- Not yet tested on a device: see section 0 ("Built but NOT yet tested").
- Haptics: `src/lib/haptics.ts` (Android system effects, no VIBRATE needed): like/bookmark, segmented
  controls, posting, SOS hold, live sharing start/stop. One per action, always with a visual change.
- Posting pipeline: composers (`post/new.tsx`, `story/new.tsx`) build `DraftMedia` with `media-strip.tsx` /
  `media-picker.ts` and a `PlaceTag` with `place-picker.tsx`, then call `startUpload` (`upload-queue.ts`) and close.
  The queue resizes photos, streams each file to a signed upload URL with progress (`lib/upload-progress.ts`,
  `expo-file-system/legacy` upload task), then inserts the post + `post_media` rows (or one story per item).
  Jobs live in memory: if the app is killed mid-upload the job is lost (the composer can be reopened).
- Video posts: `post-videos` bucket (50 MB, video types), `community_posts.video_url` + `video_duration_ms`;
  clips up to 60 s; poster frame from `expo-video` thumbnails; tap-to-play (`features/community/post-video.tsx`).
  Keep `expo-glass-effect` and `expo-symbols` (expo-router needs them) and `react-native-url-polyfill`
  (side-effect import in `src/lib/supabase.ts`).
- The UI is built from `src/components` only; gluestack-ui was removed in #28. Do not reintroduce it.

## App-wide constants

`src/constants/app.constants.ts` holds what the whole app shares: the app's name, slug, scheme and Android
package (read from `app.json`, which stays the source for native values), the share-site address, every
external service URL (map style, OSRM routing, Open-Meteo, Overpass, Photon, offline-map release), hand-off
links (Google Maps, OpenStreetMap, WhatsApp), Pakistan's map centre and search box, and the emergency
numbers (labels translated in `src/features/safety/emergency.ts`). It is plain data with no app imports, so
pure, unit-tested modules can use it. Secrets never go there (`src/lib/env.ts` reads `EXPO_PUBLIC_*`).
The share site (`site/`) and its build script are plain JS and keep their own copies of the site address
and emergency numbers.

## 5. OTA and fingerprint rule

- `runtimeVersion` uses the **fingerprint** policy. An EAS Update only reaches builds with the same fingerprint.
- Check: `node node_modules/@expo/fingerprint/bin/cli.js fingerprint:generate --platform android` → `.hash`.
- In this container main's Android fingerprint computed as `50642d95dbd0ddbe8d392f9d5ac17a55a6931fe7` up to #38
  and `fc7027e2ee6625133a886b657e51cbbedcc863bc` after #39 (native modules changed), while
  EAS recorded runtime `3fe76e5c…` for the same code (computed on the owner's machine). Hashes differ
  between machines, so compare **before vs after on the same machine**: unchanged = OTA-safe. OTA updates
  published by the owner reach APK `4df88d41` (and later builds with the same native config), not older APKs.
- The app icon and splash PR (phase H of the restyle: new icon, adaptive icon, monochrome and splash
  PNGs, brand background colours in `app.json`) changes it again, to `ab8db1e4f9e65dc0a358c9c7ffcafd1862b751e8`
  in this container. It ships with a new APK; after that build, OTA updates go to the new APK only.
- The rename to `com.abubakaraijaz.gotourgo` / `gotourgo://` (section on the share site) changes it to
  `7ef8854e7f769e1d955c1e6b69aac8dc395203e4` (slug kept as `go-tour-go-development`). That build is a new app id,
  so it installs next to the old one.
- JS-only PRs must keep the fingerprint unchanged. Anything that changes it (new native module, app.json
  plugins/icons, Android config) must go into a PR that is merged together with an APK build. Say so in the PR.
- PR #18 was handled this way (draft until the owner approved the build). Do the same for future native changes.

## 6. Hard constraints from the owner

- Never hard-code API keys, Supabase credentials or secrets. Never expose the service-role key.
- `EXPO_PUBLIC_` only for client-safe values (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  optional `EXPO_PUBLIC_MAP_STYLE_URL`). Server secrets live in Supabase function secrets or GitHub secrets.
- **No** gamification, achievements, badges, leaderboards, VR/AR or music.
- Tell the owner before any step that needs them or touches the outside world: dashboard settings, uploads,
  builds, deploys, paid credits (Expo Free plan, free Higgsfield credits only).
- Keep the fingerprint unchanged except in the APK build PR (section 5).
- No model identifiers in commits, PRs or code. Commits end with the session's `Co-Authored-By` /
  `Claude-Session` trailers; PR bodies end with the "Generated with Claude Code" footer.
- Merge policy: the owner approved creating **and** merging PRs after checks pass (section 7).
- Branches: `claude/great-gates-0mn6vd` for features; `claude/great-gates-0mn6vd-hotfix` for OTA-safe fixes and docs.
- Persisted React Query data must be **JSON-safe** (no `Map`/`Set`/class instances). Bump the persister buster
  when a cached shape changes (`src/lib/query-cache.test.ts` guards this).
- Routes only in `src/app`; Expo Router for navigation; `bunx expo install` for packages; never edit
  `android/`/`ios/` (CNG).

## 7. Run and verify (before every PR)

```bash
bun install
bunx tsc --noEmit
bunx expo lint
bun test
node scripts/check-translations.cjs        # must print "0 missing"
node node_modules/@expo/fingerprint/bin/cli.js fingerprint:generate --platform android   # compare .hash
EXPO_OFFLINE=1 CI=1 bunx expo export --platform android --output-dir /tmp/export
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/tests
```

Do **not** run `prettier --write` on the repo: there is no Prettier config, and the defaults reformat
every file (double quotes, 80 columns).

Do not edit `.gitignore` in a JS-only PR: it is part of the native fingerprint. Run the Python tests
with `PYTHONDONTWRITEBYTECODE=1` so no `__pycache__` files are left behind.

## 8. Debugging on a device

- The root ErrorBoundary shows a friendly error screen instead of closing; the error is saved on the phone.
- Settings → Demo tools → **Last error** shows and shares the latest error (`src/lib/crash-log.ts`).
- Expo Observe / simulators need a paid plan; the owner is on Free. Ask the owner for screenshots of the
  error screen or the Last error text.
- Demo tools also simulate a journey towards a landmark, drive an active journey at 50 km/h, reset
  landmark cooldowns, and open the offline map engine test.

## 9. Supabase

- Project `bovepoelpxsstguclftl`. Migrations are applied through the Supabase MCP (`apply_migration`), then
  the local file in `supabase/migrations/` is renamed to the version the project recorded, so local and
  remote stay in step (`list_migrations` to check).
- RLS on every table, policies `to authenticated` with `(select auth.uid())`; helpers in schema `private`.
- RPCs used by the app: `get_shared_location`, `end_shared_location`, `end_my_live_links` (share links),
  `username_available` (anon-callable, sign-up).
- Run `get_advisors` (security + performance) after schema changes.
- Edge function `ai`: secrets `GEMINI_API_KEY` (required), `GEMINI_MODEL` (default `gemini-flash-latest`),
  `GEMINI_FALLBACK_MODEL` (default `gemini-flash-lite-latest`, asked when the first is slow or busy),
  `AI_DAILY_LIMIT`, `AI_DAILY_LIMIT_GUEST`. Thinking is kept short (`thinkingLevel: low`, or
  `thinkingBudget: 0` on 2.5 models); every attempt logs its model and time. A failed answer does not
  use up a question.
- Edge function `translate-urdu` (owner-run machine-Urdu job, `verify_jwt = false`, single-use tokens),
  driven by `pg_cron` job `urdu-translation`; it unschedules itself when done. See
  [LANDMARKS-IMPORT.md](LANDMARKS-IMPORT.md) section 7.
- **Landmark content rules (6 Nov):** `destinations.locked` is set on every hand edit; the OSM import skips
  locked rows. New or edited landmarks go through `landmark_import` (English + Urdu side by side, strict pair
  rule); export current data from the `landmark_sheet` view. Never write landmark text straight into
  `destinations` from code without also writing the Urdu row.

## 10. Map and data workflows (GitHub Actions)

- **Import Pakistan places and landmarks** (`import-pakistan-data.yml`, manual): downloads the Pakistan OSM
  extract, runs `scripts/import_pakistan_data.py` (tests first) and loads into Supabase. Secret:
  `SUPABASE_DB_URL` (use the session pooler URL; the direct URL is IPv6-only and is rejected).
- **Build offline map of Pakistan** (`build-pakistan-map.yml`, manual, input = max zoom): Planetiler builds
  `pakistan.pmtiles`, the overview, region packs and glyphs, checks them with `check-pakistan-map.py`, and
  publishes to the `pakistan-map` GitHub release that the app downloads from. Region bounds in
  `src/features/offline/catalog.ts` must match `REGIONS` in `scripts/build-pakistan-map.sh`.

## 11. Share-link site (SOS and live location)

- Pages in `site/`; build with `node scripts/build-share-site.mjs` (writes `site-dist/`, including
  `.well-known/assetlinks.json` for App Links).
- Deploy (owner's step, tell them first): `bunx eas-cli deploy --export-dir site-dist --prod`.
- Deployed at https://go-tour-go.expo.app (`SHARE_SITE` in `src/features/safety/share-links.ts`). It moved there
  from go-tour-go-development.expo.app (Nov 2026). The Android App Links filter in `app.json` lists the new host.

### Rename: no more "development" (Nov 2026)

The app dropped its "development" names: URL scheme `gotourgo://`, Android package
`com.abubakaraijaz.gotourgo` (was `…gotourgodevelopment`), npm name `go-tour-go`. The EAS project id is unchanged,
so EAS Update keeps working. A new package id is a **new app** on the phone: install it fresh (sign in again,
download offline maps again); the old app can be uninstalled. Owner steps:
1. The EAS slug stays `go-tour-go-development`: expo.dev does not let a project's slug change, and EAS refuses
   a build whose `app.json` slug differs from the project's. The slug is internal (not shown in the app, the
   phone or any link), so only the visible names changed.
2. Build: `bunx eas-cli build -p android --profile preview`. When asked for credentials for the new package,
   EAS generated a new keystore for the new package; its SHA-256
   (`03:F6:90:23:…:8D:BB:CE`, see `bunx eas-cli credentials -p android`) is the default in
   `scripts/build-share-site.mjs`.
3. Supabase → Authentication → URL Configuration: Site URL `gotourgo://`, Redirect URLs add
   `gotourgo://reset-password` (and `gotourgo://`).
4. Redeploy the share site so `/.well-known/assetlinks.json` names the new package.
QR codes made before the rename (`gotourgodevelopment://destination/…`) still scan.
  The SHA-256 cert fingerprint in assetlinks was confirmed by the owner.
- Links: `/sos?t=<token>` and `/live?t=<token>`; in the app they open `src/app/sos.tsx` / `live.tsx`.
- Shared posts: `/p?id=<post id>` (`site/post.html`, `site/assets/post.js`, RPC `get_shared_post`: only posts by
  public profiles). "Open in GoTourGo" uses an Android intent on the custom scheme (`gotourgo://post/<id>`),
  so no App Link change (and no APK) was needed. **Redeploy the site after changing `site/`.**

## 12. Internationalisation

- Every user-facing string goes through `tx('English text', { 0: value })` from `src/lib/i18n.ts`.
- Add the Urdu entry to `src/i18n/ur.ts` (keyed by the English text); `check-translations.cjs` must report
  0 missing. Urdu switches the app to RTL (restart) and uses Noto Nastaliq Urdu.
- Landmark content in Urdu lives in `destination_translations` (locale `ur`). There is one language for
  everything: the AI guide, Visual Lens and voice guidance follow the app language (English or Urdu).
- Hazard reports: at the traveller's location by default; on Explore, long-press the map or use
  "Choose on map" in the report sheet to report at a spot. Hazards draw as warning-triangle markers
  above the landmark layers; a hazard card's "Show on map" flies Explore to it and outlines its area.
- Settings → Demo tools shows which OTA update is running (date + id), to confirm before testing.

## 13. Design system

- Tokens in `global.css` (teal `#0F4C4A`, cream `#FBF8F3`, terracotta `#C8643B`, plus semantic names such as
  `bg-card`, `text-muted-foreground`, `bg-primary-soft`). Use tokens, never raw colours in components.
- Fonts: Fraunces (display), Plus Jakarta Sans (UI), Noto Nastaliq Urdu. Always use `@/components/text`
  (`Text`), which maps weights to the right font file on Android.
- Motion rules (`src/lib/motion.ts`): press scale 0.97 / 120 ms ease-out; moving indicators 250 ms
  ease-in-out; entrances 250 ms with 40 ms stagger; tab screens switch instantly; every animation honours
  Reduce Motion; no `entering` on virtualised list rows.
- Loading: `LoadingState variant=...` (list, cards, feed, profile, detail skeletons; `spinner` for actions).

## 13a. Design system (client guide, 9 Nov)

- Tokens in `global.css` (+ hex mirrors in `src/lib/theme.ts`): mist background `#F6FAFC`, ink text `#15384F`,
  ocean primary `#19709B` (buttons use `brandGradient` → `#2381B6`), link accent `#1672AE`, navy headings
  (`text-heading` `#1A5372`), decorative sky `#2E9FD9` (never small text), ice `#E8F2F9`, sand/mint/peach/lemon tiles.
- Fonts (runtime, OTA): Outfit for `font-display` (Bold; `font-display font-semibold` = SemiBold), Plus Jakarta Sans
  body, Caveat via `font-script` for one or two handwritten accents per screen, Noto Nastaliq for Urdu.
- Components: gradient pill buttons, pill inputs on ice, ice chips (navy when selected), white cards with a soft navy
  `shadow()`, `BrandLogo`/`BrandSymbol`, `WaveEdge`, `LeafSprig`, `IconTile` (`src/components/brand.tsx`).

## 14. Figma

**On hold (8 Nov):** the client will provide their own UI design later; this file is reference only.

- File: https://www.figma.com/design/bO6d8RIpnNL3awG2lQQMA8. Node ids per screen are in
  [ui-figma-gaps.md](ui-figma-gaps.md).
- The connector uses the owner's "abubakar khan" **Starter** account, which allows very few calls a month.
  Look at [figma/screens-overview.jpg](figma/screens-overview.jpg) first; fetch screenshots with
  `enableBase64Response: true` (this container cannot download figma.com URLs).

## 15. Where the owner's pending steps stand

| Step | State |
|---|---|
| OTA publish + offline tests of PR 5 | Done (Lahore offline, Karachi land, offline sign-in passed) |
| EAS Hosting deploy of the share site | Done: go-tour-go.expo.app (assetlinks confirmed) |
| APK build for PR 6 | Done by the owner: build `4df88d41` (5 Nov) |
| OTA update with #28 + tests | Done, all working (6 Nov) |
| OTA update with #29 (community) + tests | **Pending** (owner: `bunx eas-cli update --channel preview`) |
| Test PR 6 on the new APK (SOS links, App Links) | Pending |
| Supabase anonymous sign-ins | Owner turns on with PR 7 (plus **Allow manual linking** for the upgrade) |

## 16. Next steps

1. Owner publishes the #29 update and tests:
   - a landmark page shows "Traveller posts"; "Post from here" opens New post with the place tagged, and
     the post appears in that section and in "See all";
   - Community: All travellers / Following switch; double-tap a photo likes it (heart burst);
   - comments: appear instantly, Reply prefills @username, Delete asks first, counts stay right;
   - stories: progress bar fills, hold pauses, seen authors turn grey and move last, the viewer continues
     to the next person, own story is the first bubble with +.
   Also PR 6: SOS from Safety (WhatsApp message carries `https://go-tour-go.expo.app/sos?t=…`,
   which opens the in-app SOS screen on the phone and the web page on a desktop); "I'm safe" ends it
   (the open SOS is saved on the phone, `gtg.safety.sos`, so leaving Safety or restarting keeps "I'm safe");
   Share live link. Add the passing checks to `docs/TESTING.md`.
2. Then section 0 "Remaining work" in order.

## 17. PR 7: guest mode

**Status:** built (JavaScript + SQL, OTA-safe; no native change). Not in the client brief (it says users log
in); added on the owner's request.

**Owner steps to switch it on**
1. Supabase → Authentication → Sign In / Providers: turn on **Allow anonymous sign-ins** and **Allow manual
   linking** (manual linking lets a guest add an email and keep their data). Consider CAPTCHA (Supabase rate
   limits anonymous sign-ins to 30 per hour per IP).
2. Deploy the `ai` Edge Function (guest daily limit). Optional secret `AI_DAILY_LIMIT_GUEST` (default 10).
3. Publish the OTA update.

**Database** (`supabase/migrations/20261111154858_guest_mode.sql`, applied)
- `private.is_guest()` reads the JWT's `is_anonymous` claim.
- **Restrictive** policies stop guests from: posting, editing posts, post media, comments, likes, stories,
  reviews, follows, messages, editing their profile, live location sharing and viewers, live links
  (`sos_events.kind = 'live'`) and storage uploads. Hazard reports and votes already refused guests.
- Guests **can**: save places and posts, trips, trusted contacts, and **SOS links** (safety).
- `send_friend_request`, `respond_friend_request` and `start_conversation` refuse guests themselves (security
  definer skips table policies); friend requests to a guest are refused too.
- `profiles.is_guest` is set by `handle_new_user` and kept in sync by a trigger on `auth.users.is_anonymous`;
  people search filters `is_guest = false`.
- `private.delete_stale_guests(interval default '30 days')` removes inactive guests; not scheduled (ask the
  owner before adding a pg_cron job).
- Verified in a rolled-back transaction as a guest and a member (every allowed/blocked case above), then
  `get_advisors` (no new findings).

**App**
- Sign-in: **Continue as guest** (`signInAsGuest`). `useAuth().isGuest` comes from `session.user.is_anonymous`;
  the route guards treat guests as signed in.
- `src/features/auth/guest-gate.tsx`: `useRequireAccount()` gates actions ("You need an account to …" sheet:
  Create account / I already have an account / Not now); the sheet also opens when a guest write is refused by
  the database (safety net on React Query mutations). Gated: compose, stories, likes, comments, reviews,
  follow, friend requests, live sharing and live links, hazard reports.
- Profile tab for guests: a guest card instead of the header, only Visited and Saved stats, no Friends or
  Messages rows, "Leave guest mode" (warns that a guest cannot sign back in).
- Upgrade (`/create-account` → email → `/finish-account`): `updateUser({ email, data })` links the email to the
  same user, the email link confirms it, the guest chooses a password, then the profile gets the chosen name
  and username (a taken username keeps the automatic one). Saved places and trips are kept. Signing in to
  another account from guest mode leaves the guest data behind (warned).
- Whole members-only screens (`post/new`, `story/new`, `review/new`, `profile/edit`, `friends`, `messages`,
  `messages/[id]`) are wrapped in `AccountRequired`: a guest arriving from a link or notification sees why and
  "Create account" instead of a screen that cannot work.
- AI function (v6, deployed): guests get `AI_DAILY_LIMIT_GUEST` (default 10) questions a day, members
  `AI_DAILY_LIMIT` (50). Every chat/lens answer returns `usage: { used, limit, guest }` and `{ mode: 'usage' }`
  reads it for free; `useAiUsage()` keeps it in the query cache and `AiQuota` shows "7 of 10 AI questions left
  today" (with a bar) on the AI guide, the place chat sheet and Lens. The day resets at 00:00 UTC (5 am PKT).
