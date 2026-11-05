# GoTourGo: Smart Travel Companion (FYP Android MVP)

GoTourGo is an Expo / React Native travel companion for Pakistan. Its core experience is a **proximity-aware map**:

```
Open GoTourGo → see your location → explore nearby landmarks → travel toward one →
enter its geofence radius → notification → (app open) contextual card →
Learn more / Navigate → route drawn from your location → continue exploring
```

Stack: Expo SDK 58 · Expo Router · TypeScript · Supabase (Auth, Postgres + RLS, Realtime Broadcast, Storage, Edge Functions) ·
MapLibre React Native v11 · expo-location + expo-task-manager (geofencing) · expo-notifications · Gemini (server-side) ·
Uniwind (Tailwind v4 design tokens) · TanStack Query (offline cache).

Design: light, warm editorial theme (Fraunces + Plus Jakarta Sans, teal and terracotta on warm cream). Source of truth is the
Figma file `bO6d8RIpnNL3awG2lQQMA8`; tokens live in `global.css` with hex mirrors in `src/lib/theme.ts`. Fonts load at runtime
(`src/lib/fonts.ts`), so design changes ship as over-the-air updates.

> Gamification, achievements, badges, leaderboards, VR/AR and music are developed separately and are intentionally not part of this codebase.

---

## 1. Environment variables

| Variable | Service | Purpose | Required | Where | Client-safe |
|---|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Project URL | **Yes** | `.env.local` + EAS env | Yes |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase | Publishable key (`sb_publishable_…`; legacy anon key also works) | **Yes** | `.env.local` + EAS env | Yes (RLS protects data) |
| `EXPO_PUBLIC_MAP_STYLE_URL` | MapLibre tiles | Override map style (default OpenFreeMap *liberty*, no key) | No | `.env.local` + EAS env | Yes |
| `GEMINI_API_KEY` | Google Gemini | AI assistant + Visual Lens | Yes, for AI | Supabase secret | **No, server-only** |
| `GEMINI_MODEL` | Gemini | Model override (default `gemini-flash-latest`) | No | Supabase secret | Server-only |
| `AI_DAILY_LIMIT` | Edge Function | Requests per user per day (default 50) | No | Supabase secret | Server-only |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` … | Supabase | Injected into Edge Functions automatically | Auto | none | **Never in the app** |

Only `EXPO_PUBLIC_*` variables are bundled into the app. Never put the Gemini key or any secret/service-role key in `.env.local`.

```bash
cp .env.example .env.local   # then fill in your project URL and publishable key
```

If the build is missing the Supabase variables, the app shows a "Backend not configured" screen instead of crashing.

## 2. Supabase setup

Everything lives in `supabase/`:

```
supabase/migrations/   schema, RLS, realtime, storage, AI quota (apply in order)
supabase/seed.sql      Pakistan-wide demo data (43 curated landmarks, services, road alerts)
supabase/functions/ai  Gemini proxy Edge Function (Deno)
supabase/config.toml   CLI config (auth redirect, function JWT verification)
```

Option A, with the Supabase CLI:

```bash
bunx supabase login
```

```bash
bunx supabase link --project-ref <your-project-ref>
```

```bash
bunx supabase db push --remote --include-seed
```

```bash
bunx supabase secrets set GEMINI_API_KEY=<your-gemini-key>
```

```bash
bunx supabase functions deploy ai
```

If your CLI version has no `--include-seed`, run `bunx supabase db push --remote`, then paste `supabase/seed.sql` into the Dashboard SQL editor.

Option B, from the dashboard: run each file in `supabase/migrations/` in order in the SQL editor, then `supabase/seed.sql`.
Set the `GEMINI_API_KEY` secret under *Edge Functions → Secrets* and deploy the `ai` function with the CLI.

Then in the dashboard:

- **Authentication → URL Configuration → Redirect URLs:** add `gotourgodevelopment://reset-password` (password reset) and `gotourgodevelopment://` (email confirmation).
- **Authentication → Providers → Email:** enabled. Disable "Confirm email" if you want instant sign-up for demos.

The migrations were validated on PostgreSQL 16 with stubbed Supabase schemas, plus 35 behavioural RLS checks
(cross-user access, friendship gating, expiry, storage folders, realtime topics).

## 3. Run and build

`app.json` uses `web.output: "single"`: the app has no server routes, and `"server"` makes native builds also export a web server bundle, which fails with Uniwind.

Expo Go is **not** supported: MapLibre, background geofencing and the location foreground service need a development build or an APK.

```bash
bun install
```

Installable APK, built in the EAS cloud (no Android Studio needed):

```bash
bunx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext
```

```bash
bunx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_... --visibility plaintext
```

```bash
bunx eas-cli build --platform android --profile preview
```

Development build, for live reload against `bunx expo start`:

```bash
bunx eas-cli build --platform android --profile development
```

```bash
bunx expo start --dev-client
```

### Over-the-air updates (EAS Update)

Builds include `expo-updates`, using the `preview` / `development` / `production` channels from `eas.json`.
JavaScript-only changes (screens, logic, styles) can be shipped without a rebuild:

```bash
bunx eas-cli update --channel preview --environment preview --message "Describe the change"
```

The app downloads the update in the background and applies it on the next launch. `runtimeVersion` uses the
`fingerprint` policy, so an update is only delivered to builds with matching native code. Changes to native
packages, permissions or `app.json` plugins still need a new `eas build`.

Quality checks:

```bash
bunx tsc --noEmit
```

```bash
bunx expo lint
```

```bash
bun test
```

### Pakistan places and landmarks (data import)

Search, the map and landmark alerts use thousands of places and famous landmarks from OpenStreetMap, enriched with
Wikidata, Wikipedia summaries and Wikimedia Commons photos (`scripts/import_pakistan_data.py`). The phone keeps a local copy
(`src/features/data/sync.ts`) so search and alerts work offline; it re-downloads a dataset only when its version on the
server changes. Curated destinations are never overwritten: a matching landmark only adds its photo, Urdu name and links.

One-time setup, the database connection for the import:

1. In the Supabase dashboard, open your project and click **Connect** (top bar).
2. Choose the **Session pooler** connection string and copy the URI (host `…pooler.supabase.com`, user `postgres.<project-ref>`). Do not use "Direct connection" (`db.<ref>.supabase.co`): it is IPv6-only and GitHub cannot reach it. Replace
   `[YOUR-PASSWORD]` with your database password (**Project Settings → Database → Reset database password** if you do not know it).
3. On GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Name: `SUPABASE_DB_URL`, value: the URI.

Then run **Actions → Import Pakistan places and landmarks → Run workflow** (about 15 to 40 minutes). The run summary shows
how many places and landmarks were loaded; phones pick them up on their next sync (or **Settings → Offline data → Update now**).
Re-run it any time to refresh the data. Text from Wikipedia is CC BY-SA 4.0 and photos keep their Commons author and
licence, both shown on the destination screen.

### Offline map of Pakistan (map file)

The street-level offline map is one PMTiles file built from OpenStreetMap with Planetiler
(`scripts/build-pakistan-map.sh`) and published on this repository's **`pakistan-map`** GitHub Release, which the app
downloads from. Building it needs internet access to Geofabrik, so it runs in GitHub Actions:

1. On GitHub, open the repository's **Actions** tab.
2. Choose **Build offline map of Pakistan** in the left list.
3. Click **Run workflow**, keep the `main` branch and the default zoom (14), then **Run workflow** again.
4. Wait for the green tick (roughly 20 to 60 minutes). The run summary shows the file sizes.
5. Check **Releases → Offline map of Pakistan**: it lists `pakistan.pmtiles`, `karachi-test.pmtiles` and `manifest.json`.

Re-run the workflow whenever you want fresher map data; the files on the release are replaced.

To build on your own computer instead (Java 21+, about 12 GB free disk): run `bash scripts/build-pakistan-map.sh`, then on
GitHub open **Releases → Draft a new release**, set the tag to `pakistan-map`, title it "Offline map of Pakistan", attach the
three files from `map-build/out/` and publish. Keep the tag name exactly `pakistan-map`; the app looks for it.

**Settings → Demo tools → Offline map engine test** checks on a phone that the map engine draws the file, both streamed and
downloaded.

## 4. Architecture

```
src/app/                 Expo Router routes only
  _layout.tsx            providers, splash/hydration gate, Stack.Protected guards
  onboarding.tsx, (auth)/, reset-password.tsx
  (app)/_layout.tsx      location + proximity providers, realtime inbox, notification routing, proximity card
  (app)/(tabs)/          Home · Explore (map) · Trips · Community · Profile (custom floating tab bar)
  (app)/…                destination/[id], search, nearby, alerts, offline-maps, assistant, lens, scan,
                         friends, users/[id], messages, notifications, safety, post, story, review, settings
src/features/<area>/     data access + hooks + feature components (proximity, location, map, routing, …)
src/components/          shared UI (screen scaffold, text with fonts, buttons, forms, states, cards, tab bar, illustrations)
src/lib/                 supabase client, storage, query client, geo maths, theme, fonts, types
```

### Proximity system (core feature)

- `features/proximity/engine.ts` is a **pure, unit-tested** geofence engine shared by the foreground watcher, the background
  task and the simulator. It handles GPS drift with 2-fix confirmation and exit hysteresis (`radius × 1.15 + 50 m`), and
  ignores repeated events (it only announces the outside→inside transition). Re-entry needs an exit **and** a cooldown
  (1/6/24 h, configurable). It drops inaccurate fixes, GPS jumps above 300 km/h and out-of-order events. Overlapping radii
  produce one grouped notification, nearest first.
- **Foreground:** `watchPositionAsync` (Balanced, ≥10 s / ≥25 m), paused when the app is backgrounded. It only does local
  distance maths, with no network calls per fix.
- **Background:** OS geofencing (`startGeofencingAsync`, nearest ≤90 landmarks), opt-in from Settings. It needs notification
  permission and location "Allow all the time". Shared persisted state de-duplicates it against the foreground engine.
- **Notifications** have *Learn more* / *Navigate* actions. While the app is open, a contextual card shows the image,
  description, why it matters, nearby attractions and distance, with Learn more / Navigate / Dismiss.
- **Navigate** computes an OSRM route from the current location and draws it on the map, without searching again.
- **Settings → Demo tools → Simulate journey** drives a synthetic path through any landmark's radius, so the whole flow can
  be shown without travelling. *Reset landmark cooldowns* lets you repeat it.

### Journey mode (turn-by-turn)

```
Search "Qayyumabad" → route preview (drive / bike / walk, landmarks and road alerts on the way) → Start journey →
turn-by-turn with voice, landmark alerts and "hazard ahead" warnings → automatic re-route when off route → arrival
```

- **Routing:** FOSSGIS OSRM car, bike and foot profiles, fetched in parallel for the preview (modes that make no sense
  for the distance are skipped). Re-routing is throttled to once per 20 s.
- **Along the route** (`features/journey/route-geometry.ts`, `journey-items.ts`): landmarks within their alert radius or
  800 m of the route and active medium/high/critical road alerts are found on the phone with a grid-indexed corridor
  search, so it works with thousands of landmarks and offline.
- **Navigation** (`features/journey/navigation.ts`, unit tested): snaps GPS to the route, next manoeuvre and distance, time
  left, off-route after 3 fixes beyond an accuracy-aware threshold, arrival. Voice (expo-speech) at 800/300/60 m when
  driving (shorter when cycling or walking), "You're near …" for landmarks, "Caution …" about 2 km before hazards.
- **Background:** with "Allow all the time", an Android foreground service ("Navigating to …") keeps alerts, hazard
  warnings and arrival working with the screen off (`features/journey/journey-task.ts`). Without it, guidance and alerts
  run while the app is open. The active journey survives an app restart.
- **Demo:** Settings → Demo tools → **Drive the active journey** drives the planned route at 50 km/h.

### Seeded landmarks for geofence testing

Radii vary per landmark, for example: Wazir Khan Mosque 300 m, Minar-e-Pakistan 500 m, Badshahi Mosque 1000 m
(overlaps Fort Road Food Street 300 m), Jahangir's Tomb 1500 m, Lake Saiful Muluk / Attabad Lake 3000 m.

## 5. External services (free tiers)

| Service | Used for | Key | Notes |
|---|---|---|---|
| Supabase | Auth, DB, Realtime, Storage, Edge Functions | publishable key (client), secrets (server) | Free tier pauses inactive projects |
| OpenFreeMap | Vector map tiles/style | none | Fair use; keep offline downloads small |
| FOSSGIS OSRM (`routing.openstreetmap.de`) | Car/foot routes | none | Fair use, no SLA; one request per user action |
| Overpass API | Live nearby services (OSM) | none | Rate-limited; falls back to seeded `nearby_services` |
| Open-Meteo | Weather | none | Non-commercial free use; cached 30 min |
| Google Gemini | AI assistant, Visual Lens | `GEMINI_API_KEY` (server) | Free-tier quotas; per-user daily cap enforced |

## 6. Known limitations (FYP scope)

- Background geofencing stops if the user force-stops the app. Android may delay geofence events by a few minutes.
- No remote push (FCM). Friend/message/SOS alerts show as local notifications while the app process is alive, and always in the in-app feed.
- SOS is a **demonstration**. It opens WhatsApp share links to trusted contacts and alerts GoTourGo friends in-app. It never contacts emergency services.
- Offline: downloaded map regions, cached destinations/trip/saved places and the last route. No offline routing or sync queue.
- Seed destinations ship without photos (category placeholders). Add licensed image URLs with `update public.destinations set image_url = … where slug = …`.
- Road alerts and nearby-service fallbacks are seeded demo data.
- Visual Lens and Smart Scan are demonstrations, and AI answers can be wrong.
- Urdu/Chinese/Arabic translations cover names and short descriptions. Longer content falls back to English, and the UI chrome is English.
