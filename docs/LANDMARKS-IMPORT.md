# Adding landmarks by hand (CSV import)

The client fills a spreadsheet; the owner imports it in the Supabase dashboard. New landmarks reach every
phone automatically: each insert bumps the landmarks data version (trigger `destinations_bump_version`), and
the app re-downloads its offline copy on the next start or pull-to-refresh. No app update is needed.

Files in [landmarks-import/](landmarks-import/):

| File | Use |
|---|---|
| `landmarks-template.csv` | Empty sheet with the right headers. Give this to the client. |
| `landmarks-example.csv` | One filled row to copy from. **Do not import it**: that shrine is already in the app (`shrine-complex-of-shah-shams-sabzwari-w900538787`). |
| `landmarks-urdu-template.csv` | Optional Urdu text, one row per landmark, matched by `slug`. |
| `landmarks-urdu-example.csv` | One filled Urdu row. |

Tip: open the template in Google Sheets (File → Import), let the client fill it, then File → Download →
CSV. Keep the header row exactly as it is.

## 1. Columns (main file)

| Column | Required | Rule |
|---|---|---|
| `slug` | yes | Unique short id: lowercase letters, digits and `-` only, 2–80 characters, e.g. `faisal-mosque`. Never reuse one. |
| `name` | yes | Name in English. |
| `category` | yes | Exactly one of: `historical`, `religious`, `attraction`, `viewpoint`, `cultural`, `museum`, `food`, `shopping`, `park`, `nature`. |
| `city` | yes | Town or city, e.g. `Lahore`. |
| `region` | yes | Province / area: `Punjab`, `Sindh`, `Khyber Pakhtunkhwa`, `Balochistan`, `Gilgit-Baltistan`, `Azad Kashmir`, `Islamabad`. |
| `latitude`, `longitude` | yes | Decimal degrees. In Google Maps, right-click the exact spot and click the numbers at the top of the menu to copy them; the first is latitude (23.5–37.2 in Pakistan), the second longitude (60.8–77.9). Anything outside Pakistan is rejected. |
| `radius_m` | yes | Alert circle in metres, 50–5000. A shrine or building in a city: 200–500. A fort, park or large mosque: 500–1000. A lake, valley or viewpoint area: 1500–3000. |
| `short_description` | yes | One line shown on cards and in the landmark alert (about 60–120 characters). |
| `description` | yes | A paragraph for the Overview tab. Two to five sentences. |
| `history`, `significance` | recommended | History tab and "why it matters" in the landmark alert. These are what the client brief asks for most. |
| `culture`, `local_customs` | optional | Culture and etiquette (dress, shoes, photography). |
| `food`, `shopping` | optional | Local food and things to buy nearby (also feed the AI guide). |
| `tips` | optional | Tips tab: best time of day, crowds, parking. |
| `opening_hours`, `entry_fee`, `best_time` | optional | Free text, e.g. `9am–5pm, closed Mondays`, `Rs 50 locals / Rs 500 foreigners`, `October to March`. |
| `image_url` | optional | A public photo link (see section 3). Without one the app shows a category illustration. |
| `image_credit` | optional | Who took the photo, e.g. `Photo: Ali Khan`. |
| `wikipedia_url` | optional | Shown as "Read more" on the landmark page. |

Leave optional cells empty rather than writing `-` or `N/A`. Do not add other columns; leave out `id`,
`active`, `popularity`, `featured` and the timestamps (the database fills them in).

## 2. Importing (owner)

1. **Check for duplicates first.** Search the app, or run in Supabase → SQL editor (replace the name):
   `select slug, name, city from destinations where name ilike '%shah shams%';`
2. Supabase dashboard → **Table Editor** → `destinations` → **Insert** → **Import data from CSV** → choose the file.
3. Check the preview: every column should map to a column of the same name. Then **Import data**.
4. If a row breaks a rule, the import stops and shows the error. Common ones:
   - `destinations_in_pakistan`: latitude/longitude swapped or mistyped;
   - `destinations_slug_key` / duplicate key: that slug already exists;
   - `slug` check: capital letters, spaces or other characters in the slug;
   - `radius_m` check: radius outside 50–5000;
   - invalid input value for enum `destination_category`: category spelled differently from the list.
   Fix the row in the sheet and import again (rows already imported stay; remove them from the sheet first).
5. Phones pick the new landmarks up the next time the app opens or the user pulls to refresh. Landmark
   alerts start working for them straight away.

## 3. Photos

- **Best:** Supabase → **Storage** → bucket **`landmark-photos`** → Upload (JPEG, PNG or WebP, up to 5 MB;
  landscape about 1600 px wide is ideal). Name the file after the slug, e.g. `faisal-mosque.jpg`. Click the
  file → **Get URL** and paste it into `image_url`.
- **Or:** a public link from Wikimedia Commons or the place's official site (it may break if they remove it).
- Only use photos the client owns or that are free to use, and fill `image_credit`.

## 4. Urdu text (optional, after the main import)

1. Fill `landmarks-urdu-template.csv`: `slug` must match an imported landmark; `name` (Urdu) is required,
   the other columns are optional.
2. Table Editor → **`landmark_urdu_import`** → Import data from CSV.
3. A trigger copies each row into the app's Urdu content (`destination_translations`, locale `ur`) and
   sets the Urdu name. Importing a slug again updates its Urdu text. An unknown slug stops the import with
   "No landmark with slug …".

The rows stay in `landmark_urdu_import` as a log. That table is closed to the app (no access for app
users); only the dashboard can read or write it.

## 5. Editing or hiding later

- **Edit:** Table Editor → `destinations` → find the row (filter by `slug`) → edit the cell. Saving also
  updates phones.
- **Hide without deleting:** set `active` to `false`. Hidden landmarks disappear from the app but keep
  their reviews and posts.
- **Delete** only if it was added by mistake: deleting removes its reviews, posts and trip entries too.

## 6. Checking for near-duplicates (owner, any time)

Pairs of active landmarks less than about 300 m apart:

```sql
select a.slug, a.name, b.slug as other_slug, b.name as other_name,
       round(111320 * sqrt(power(a.latitude - b.latitude, 2)
             + power((a.longitude - b.longitude) * cos(radians(a.latitude)), 2))) as metres
from destinations a
join destinations b on a.id < b.id and a.active and b.active
where abs(a.latitude - b.latitude) < 0.004 and abs(a.longitude - b.longitude) < 0.004
order by metres;
```

Hide the weaker one of a real duplicate (`active = false`), keeping the row with the photo, the longer
text and the Urdu content. Two different places close together (a fort and a mosque inside it) are fine.

## 7. For agents

- Migration `supabase/migrations/20261106221257_landmark_manual_import.sql` added the Pakistan bounds
  check, the `landmark-photos` bucket and `landmark_urdu_import` + trigger `private.apply_landmark_urdu`.
- Hand-imported rows get `source = 'curated'` (the default). OpenStreetMap rows are `source = 'osm'`. The
  OSM import (`private.import_osm_dataset()`, run by the GitHub workflow) never overwrites curated text: for a
  curated row that matches an OSM landmark (same Wikidata item, or close by with a similar name) it only
  fills an empty photo, Wikipedia link or Urdu name, and does not add the OSM duplicate.
