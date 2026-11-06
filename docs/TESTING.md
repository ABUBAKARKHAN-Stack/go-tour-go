# GoTourGo: Test plan and results

## Automated (run in CI or locally)

| Check | Command | Status |
|---|---|---|
| TypeScript | `bunx tsc --noEmit` (with generated typed routes) | Pass |
| Lint | `bunx expo lint` | Pass (0 errors, 0 warnings) |
| Unit tests | `bun test` | Pass (22 tests): proximity engine, OSRM parsing, QR parsing, phone/WhatsApp helpers |
| Android JS bundle | `bunx expo export --platform android` | Pass |
| Native config | `bunx expo prebuild --platform android --no-install` | Pass (permissions, foreground service, plugins verified, then folder removed) |
| SQL migrations + seed | applied to PostgreSQL 16 with stubbed `auth`/`storage`/`realtime` | Pass, seed is idempotent |
| RLS behaviour | 35 scripted checks across three users | Pass |

Proximity engine cases covered by unit tests: outside radius · approach → single notification despite repeated
fixes · high-confidence immediate entry · borderline drift needs confirmation · boundary flapping suppressed by hysteresis ·
leave and re-enter within cooldown (no notify) · re-enter after cooldown (notify) · staying inside past cooldown (no notify) ·
overlapping radii grouped nearest-first · second landmark later · GPS jump rejection · out-of-order fixes ·
inaccurate fixes vs small radius · OS geofence transitions de-duplicated with the foreground engine.

## Manual on-device checklist (Android APK / dev build)

Use **Settings → Demo tools → Simulate journey** for proximity tests indoors. Use *Reset landmark cooldowns* between runs.

### Authentication
- [ ] Sign up (new email) → confirmation email (if enabled) → sign in
- [ ] Sign up with an existing email → "already exists" message
- [ ] Wrong password → "Incorrect email or password"
- [ ] Kill and reopen app → still signed in (session persistence)
- [ ] Forgot password → email link opens app → set new password
- [ ] Sign out → returns to sign-in, cached data cleared

### Map
- [ ] First open: "Turn on location" card → Allow → blue user dot
- [ ] Deny permission → "Location permission denied" + Open settings
- [ ] Turn off device GPS → "Location services are off"
- [ ] Markers render; category chips filter; geofence rings toggle
- [ ] Tap marker → preview → Details / Navigate
- [ ] Navigate → route line + distance + ETA → Start → camera follows → arrival prompt → Mark visited
- [ ] Drive/Walk toggle recalculates; Google Maps hand-off opens

### Proximity (core)
- [ ] Simulate journey to Badshahi Mosque: outside → approaching → inside → **one** notification
- [ ] With app open, the contextual card appears (image, distance, why it matters, nearby)
- [ ] Card → Navigate → route shown without searching
- [ ] Card → Learn more → destination details
- [ ] Notification tap → details; notification "Navigate" action → route
- [ ] Repeated GPS updates while inside → no further notifications
- [ ] Leave and re-enter within cooldown → no notification; after reset → notifies again
- [ ] Simulate Fort Road Food Street → grouped "+1 more" (overlap with Badshahi), pager in card
- [ ] Settings → enable background alerts → grant "Allow all the time" → close the app → walk/drive (or emulator route playback) into a radius → notification
- [ ] Background permission denied → explanation, foreground alerts still work

### Destinations, trip, saved
- [ ] Details: sections, weather, nearby attractions, reviews, audio guide, QR, language switch (Urdu names)
- [ ] Save / unsave → Saved places list; open details from it
- [ ] Add to trip → change status → notes + planned date → remove; persists after restart
- [ ] Airplane mode → trip, saved places and destinations still visible; edits show offline message

### Nearby, weather, alerts, offline
- [ ] Nearby categories list with distances; navigate to a service
- [ ] Overpass unavailable → seeded fallback note
- [ ] Weather card on Home and details; airplane mode → "Weather is unavailable"
- [ ] Alerts list sorted by severity; alert markers on the map
- [ ] Download Lahore offline region → airplane mode → map still renders in Lahore

### AI
- [ ] Assistant: ask "What should I see near Badshahi Mosque?" → relevant answer
- [ ] Loading state shown; airplane mode → "AI service unavailable"
- [ ] Visual Lens: photo of a landmark/sign → result; matched landmark links to details
- [ ] Smart Scan: scan a destination QR (from details → QR code) → opens destination

### Social & community
- [ ] Edit profile (photo, bio, privacy) → saved
- [ ] User B searches A → friend request → A accepts (notification + feed entry)
- [ ] Message between A and B → realtime delivery, timestamps
- [ ] Create post with photo + tagged place → like → comment → delete own post
- [ ] Story → visible in strip → viewer → expires after 24 h
- [ ] Review with stars + photo → average updates; second review edits the first (no duplicates)

### Safety
- [ ] Add trusted contact (03xx number → stored as +92…)
- [ ] Hold SOS 1 s → location captured → "WhatsApp <contact>" opens WhatsApp with message + map link
- [ ] Friend receives in-app SOS notification with location
- [ ] Share location 15 min → friend sees marker with "x min ago"; stop sharing → marker disappears
- [ ] Sharing banner visible on map; foreground-service notification while backgrounded
- [ ] Location older than 10 min shows as stale
