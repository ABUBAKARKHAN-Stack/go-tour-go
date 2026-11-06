# Client requirements vs the app

The client's feature brief is `documents/GoTourGo Client Requirements (Roman Urdu).pdf` (10 scanned
pages in Roman Urdu, no text layer). This file is its English summary, mapped to what the app does,
so agents can search it. Status checked against the code and the live database on **6 Nov 2026**,
after PR #29. Each requirement counts equally.

| # | Client asks for | Where it is in the app | Status | % |
|---|---|---|---|---|
| 1.1 | Welcome screen with intro, login and sign-up | `src/app/onboarding.tsx` | Done | 100 |
| 1.2 | Login with credentials, then Home | `src/app/(auth)/*`, `src/features/auth` | Done | 100 |
| 1.3 | Home dashboard: map, nearby, AI, other features | `src/app/(app)/(tabs)/index.tsx` | Done | 100 |
| 2.1 | Live GPS, own location and movement on the map, nearby landmarks identified | `src/features/location`, `src/features/map/travel-map.tsx` | Done | 100 |
| 2.2 | Automatic alert near famous / historical places, viewpoints, hidden gems; tap opens info | `src/features/proximity`, `src/features/notifications` | Done | 100 |
| 2.3 | Explore map: markers, ratings, travel time, saved places on the map | `explore.tsx`, `src/features/map/place-preview.tsx` (rating + travel time on the card; saved ring + "Saved" filter) | Done | 100 |
| 3 | Notification opens basic info; AI available for more | proximity card → details; "Ask AI" on details | Done | 100 |
| 3.1 | Basic introduction, history, why the place is famous | `destination/[id].tsx` Overview / History / Tips | Screen done; **content thin** (see Data) | 100 |
| 3.2 | AI cultural guide: culture, clothing, traditions, etiquette | `assistant.tsx` "Culture & etiquette" guide | Done | 100 |
| 3.3 | AI shopping and souvenirs guide | `assistant.tsx` "Shopping & souvenirs" guide | Done | 100 |
| 3.4 | AI culinary guide: dishes, famous food places | `assistant.tsx` "Food guide" + Nearby restaurants | Done | 100 |
| 4.1 | Multilingual text + audio guide; overcome language barriers | English/Urdu UI (RTL), audio guide (`expo-speech`), AI + Lens in en/ur/zh/ar | Urdu text for 332 of 545 landmarks only | 85 |
| 4 | Visual search | `lens.tsx` (Gemini vision) | Done | 100 |
| 5.1 | 24/7 AI chatbot, instant answers, any language | `assistant.tsx`, `supabase/functions/ai` | Done (daily per-user quota) | 100 |
| 6.1 | Instagram-style profile, followers/following, public or private | `(tabs)/profile.tsx`, `users/[id].tsx`, `follows/[id].tsx`, `profile/edit.tsx` (Public / Private (friends only)) | Done; profile grid of posts is a list, not a photo grid | 95 |
| 6.2 | Photo **and video** posts tied to coordinates; see posts made at a place; visual reviews | Photo posts with location/destination (`post/new.tsx`); "Traveller posts" on every destination page (`features/community/place-posts.tsx`) and `place-posts/[id].tsx`; "Post from here"; reviews with photos | **No video** | 75 |
| 6.3 | Direct messages with friends / fellow travellers | `messages/*` | Friends only | 90 |
| 7.1 | Buddy tracking on the map | friends layer on Explore, `src/features/safety` | Done | 100 |
| 7.2 | SOS button: live location + alert to trusted followers or local authorities | `safety/index.tsx`, `sos.tsx`, share site | Authorities: one-tap calls only (no public police API) | 85 |
| 7.3 | Live location for 15 min / 1 h / until stopped, with **selected** buddies | `safety/index.tsx`, `location_shares` | **Shares with all accepted friends; no picking** | 80 |

**Features overall: about 95%** across the 18 numbered requirements 1.1–7.3 (87% before PR #28, 94% after it).

## Data (landmark content), 6 Nov 2026

Counts are for **active** landmarks, the ones the app shows (`destinations.active`). The table also holds
291 inactive low-quality OpenStreetMap rows that the app never shows (836 rows in total; earlier documents
wrongly reported 836 as the landmark count).

| Content | Count | Share |
|---|---|---|
| Landmarks shown in the app | 545 in 169 cities/towns (43 hand-written, 502 from OpenStreetMap) | — |
| Full paragraph description (200+ chars) | 231 | 42% |
| Short description only (under 80 chars, e.g. "Viewpoint in Multan") | 199 | 37% |
| Full guide fields (history, significance, culture, food, shopping, tips) | 43 | 8% |
| Photo | 310 | 57% |
| Urdu text (`destination_translations`, locale `ur`) | 332 | 61% |
| Offline search places | 37,111 | done |

New landmarks can be added by hand with a CSV import: see [LANDMARKS-IMPORT.md](LANDMARKS-IMPORT.md).

## Remaining work to reach 100% (in priority order)

1. ~~Posts at a place (6.2)~~: done in #29.
2. **Selected buddies (7.3):** a `location_share_viewers (owner_id, viewer_id)` table; RLS on
   `location_shares` select = accepted friend **and** (no viewer rows for owner **or** viewer listed);
   a friend picker in Safety. Migration + JavaScript; no native change.
3. **Video posts (6.2):** `pick-image.ts` → allow videos (size/duration limit), a `post-videos`
   storage bucket, `media_type` column, playback with `expo-video` (**native: next APK build**).
4. **Content:** fill `history`, `significance`, `food`, `shopping`, `tips` for the most visited
   landmarks first (draft with Gemini from Wikipedia, human review), and Urdu for the rest.
5. **Messaging non-friends (6.3):** optional; currently friends only by design (safety).
6. **SOS to authorities (7.2):** stays a stated limitation; the app offers one-tap calls to 1122 / 15 / 115 / 130.

Not in the client brief but built: offline Pakistan maps, offline search, journey mode with voice,
saved routes, hazard reports, road alerts, trips, saved places, reviews, stories, nearby services,
weather, QR scan, SOS/live web page, demo tools. **Guest mode (plan PR 7) is not in the brief**
(it says users log in), so it ranks below the items above.
