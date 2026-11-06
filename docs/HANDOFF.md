# GoTourGo: agent and developer handoff

Read this first if you are picking up the project, whether you are another AI agent or a developer.
It describes the state on **6 Nov 2026** (latest main: PR #29). The project is being handed from
Claude Code to the owner's next agent (Antigravity); everything needed to continue is in this file,
[CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md) (the client's brief mapped to the app, with what is
left) and [ui-figma-gaps.md](ui-figma-gaps.md). The non-technical walkthroughs for the client are
separate documents shared with the owner.

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

Live data (checked 5 Nov 2026): 836 landmarks (`destinations`) in 253 cities and towns, 310 with photos,
345 with Urdu text, 37,111 `places` for offline search, 54 `nearby_services` and 10 `road_alerts`.

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
supabase/functions/ai/   Gemini edge function (secrets: GEMINI_API_KEY, optional GEMINI_MODEL, AI_DAILY_LIMIT)
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

## 4. Current status and phase

**Phase:** device testing and bug fixing after plan PR 5, plus getting the PR 6 APK built.

| Plan PR | State |
|---|---|
| 1 Redesign basics | Done |
| 2 Data + offline search | Done |
| 3 Journey mode | Done |
| 4 Exploring + hazards | Done |
| 5 Offline maps | Done; tested on a Pixel 3 (Android 12): engine test, Karachi land fix, Lahore offline |
| 6 SOS links + App Links + icon | Merged (#18). Site deployed. **APK built** 5 Nov (build `4df88d41`, from #25); owner device test of SOS links / App Links pending |
| 7 Guest mode | Not started; Supabase "Allow anonymous sign-ins" must stay **off** until this PR. Not in the client brief (it says users log in), so it ranks below the client gaps in CLIENT-REQUIREMENTS.md |

**APK build (5 Nov):** the build started through the Expo MCP connector (`fbb72c6e`) failed: that token
has scopes `VIEW,RUN` and cannot read the Android keystore. The owner then built from their own login:
build `4df88d41-dd7f-49ef-ba7f-c507fb1bb53d`, commit 9eb6665 (#25), runtime version
`3fe76e5cf118d6dab2ca927c48939d3ffb301edf`. **Always start builds from the owner's login**
(`bunx eas-cli build -p android --profile preview`), never through MCP.

**Known issues / open items**

- Attabad Lake has 3 rows in `destinations` (duplicate cleanup pending; check for other duplicates too).
- UI does not yet fully match Figma: auth, Home and details are done; **Explore** (icon markers, two map
  buttons, "Around you" sheet), the no-photo placeholder and the rest are still open. See
  [ui-figma-gaps.md](ui-figma-gaps.md).
- Not yet tested on a device: everything in PR 6 (SOS/live links, App Links, new icon), the motion pass (#25),
  the auth redesign (#22) and Home/details (#23).
- Haptics are deferred: `expo-haptics` is a native module, so add it with the next APK build.
- Unused **native** packages to remove with the next APK build: `expo-device`, `expo-web-browser`.
  Keep `expo-glass-effect` and `expo-symbols` (expo-router needs them) and `react-native-url-polyfill`
  (side-effect import in `src/lib/supabase.ts`).
- The UI is built from `src/components` only; gluestack-ui was removed in #28. Do not reintroduce it.

## 5. OTA and fingerprint rule

- `runtimeVersion` uses the **fingerprint** policy. An EAS Update only reaches builds with the same fingerprint.
- Check: `node node_modules/@expo/fingerprint/bin/cli.js fingerprint:generate --platform android` → `.hash`.
- In this container main's Android fingerprint computes as `50642d95dbd0ddbe8d392f9d5ac17a55a6931fe7`, while
  EAS recorded runtime `3fe76e5c…` for the same code (computed on the owner's machine). Hashes differ
  between machines, so compare **before vs after on the same machine**: unchanged = OTA-safe. OTA updates
  published by the owner reach APK `4df88d41` (and later builds with the same native config), not older APKs.
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
- Edge function `ai`: secrets `GEMINI_API_KEY` (required), `GEMINI_MODEL`, `AI_DAILY_LIMIT`.

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
- Deployed at https://go-tour-go-development.expo.app (`SHARE_SITE` in `src/features/safety/share-links.ts`).
  The SHA-256 cert fingerprint in assetlinks was confirmed by the owner.
- Links: `/sos?t=<token>` and `/live?t=<token>`; in the app they open `src/app/sos.tsx` / `live.tsx`.

## 12. Internationalisation

- Every user-facing string goes through `tx('English text', { 0: value })` from `src/lib/i18n.ts`.
- Add the Urdu entry to `src/i18n/ur.ts` (keyed by the English text); `check-translations.cjs` must report
  0 missing. Urdu switches the app to RTL (restart) and uses Noto Nastaliq Urdu.
- Landmark content in Urdu lives in `destination_translations` (locale `ur`). The AI can also reply in
  Chinese or Arabic (AI only, not the UI).

## 13. Design system

- Tokens in `global.css` (teal `#0F4C4A`, cream `#FBF8F3`, terracotta `#C8643B`, plus semantic names such as
  `bg-card`, `text-muted-foreground`, `bg-primary-soft`). Use tokens, never raw colours in components.
- Fonts: Fraunces (display), Plus Jakarta Sans (UI), Noto Nastaliq Urdu. Always use `@/components/text`
  (`Text`), which maps weights to the right font file on Android.
- Motion rules (`src/lib/motion.ts`): press scale 0.97 / 120 ms ease-out; moving indicators 250 ms
  ease-in-out; entrances 250 ms with 40 ms stagger; tab screens switch instantly; every animation honours
  Reduce Motion; no `entering` on virtualised list rows.
- Loading: `LoadingState variant=...` (list, cards, feed, profile, detail skeletons; `spinner` for actions).

## 14. Figma

- File: https://www.figma.com/design/bO6d8RIpnNL3awG2lQQMA8. Node ids per screen are in
  [ui-figma-gaps.md](ui-figma-gaps.md).
- The connector uses the owner's "abubakar khan" **Starter** account, which allows very few calls a month.
  Look at [figma/screens-overview.jpg](figma/screens-overview.jpg) first; fetch screenshots with
  `enableBase64Response: true` (this container cannot download figma.com URLs).

## 15. Where the owner's pending steps stand

| Step | State |
|---|---|
| OTA publish + offline tests of PR 5 | Done (Lahore offline, Karachi land, offline sign-in passed) |
| EAS Hosting deploy of the share site | Done: go-tour-go-development.expo.app (assetlinks confirmed) |
| APK build for PR 6 | Done by the owner: build `4df88d41` (5 Nov) |
| Publish an OTA update with #28 to that APK | Pending (owner: `bunx eas-cli update --channel preview`) |
| Test the new APK (SOS links, App Links, icon, motion, #28 features) | Pending |
| Supabase anonymous sign-ins | **Not enabled**, on purpose, until PR 7 |

## 16. Next steps

1. Owner publishes an OTA update of main to the new APK, installs/tests: new icon, splash and light theme;
   SOS from Safety (the WhatsApp message carries `https://go-tour-go-development.expo.app/sos?t=…`,
   which opens the in-app SOS screen on the phone and the web page on a desktop); "I'm safe" ends it;
   Share live link; offline Lahore with Airplane mode; motion (#25); Explore card rating/travel time,
   "Saved" filter, followers lists, AI guides (#28). Add the passing checks to `docs/TESTING.md`.
2. Client gaps, in the order of [CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md): selected buddies for
   live sharing (migration + JS), video posts (native, next APK), content.
3. Figma fidelity pass: Explore first, then the remaining gaps in `ui-figma-gaps.md`.
4. Next APK build: add `expo-haptics`, `expo-video` (if video posts), remove `expo-device` and
   `expo-web-browser`, in one native PR.
5. Plan PR 7, guest mode (anonymous sign-ins; then the owner enables the Supabase setting). Not in the
   client brief, so after the items above.
6. Clean duplicate landmarks (Attabad Lake ×3 and any others), keeping the row with photo and Urdu text.
