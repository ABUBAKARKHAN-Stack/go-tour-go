# Adding and editing landmarks (bilingual CSV import)

The client fills **one sheet with English and Urdu side by side**; the owner imports it in the Supabase
dashboard. Each row creates a landmark, or **updates** the landmark with the same `slug`. Changes reach every
phone automatically (the landmarks data version goes up on every change and the app re-downloads its offline
copy on the next start or pull-to-refresh). No app update is needed.

Files in [landmarks-import/](landmarks-import/):

| File | Use |
|---|---|
| `landmarks-template.csv` | Empty sheet with the right headers for **new** landmarks. |
| `landmarks-example.csv` | One filled row showing every column. It improves an existing landmark (same slug), so importing it **would overwrite** that shrine's text: use it as a model only. |

To **edit existing landmarks**, start from an export of the current data (section 4), not the empty template.

Tip: open the CSV in Google Sheets (File → Import), fill it, then File → Download → CSV. Keep the header row
exactly as it is; Google Sheets keeps Urdu text intact.

## 1. The rule: both languages, always

| Columns | Rule |
|---|---|
| `name` + `name_ur`, `short_description` + `short_description_ur`, `description` + `description_ur` | **Required in both languages.** |
| `history`, `significance`, `culture`, `local_customs`, `food`, `shopping`, `tips` (each with its `_ur` column) | **Both or neither.** If History is written in English, History in Urdu must be filled too (and the other way round), so a page never shows a section in only one language. |
| `category`, `city`, `region`, `latitude`, `longitude`, `radius_m` | Required (no Urdu needed). |
| `opening_hours`, `entry_fee`, `best_time`, `image_url`, `image_credit`, `wikipedia_url` | Optional; one value shown in both languages. |

A row that breaks the rule is refused with a message naming the slug and the column, for example
*"Row faisal-mosque: history is filled in one language only. Fill both history and history_ur, or leave both
empty."* Nothing from that row is saved.

## 2. Columns

| Column | Rule |
|---|---|
| `slug` | Unique short id: lowercase letters, digits and `-`, 2–80 characters, e.g. `faisal-mosque`. A slug that already exists **updates** that landmark. |
| `name`, `name_ur` | Name in English and in Urdu script. |
| `category` | One of: `historical`, `religious`, `attraction`, `viewpoint`, `cultural`, `museum`, `food`, `shopping`, `park`, `nature`. |
| `city` | Town or city, e.g. `Lahore`. |
| `region` | `Punjab`, `Sindh`, `Khyber Pakhtunkhwa`, `Balochistan`, `Gilgit-Baltistan`, `Azad Kashmir`, `Islamabad Capital Territory`. |
| `latitude`, `longitude` | Decimal degrees. In Google Maps right-click the exact spot and click the numbers at the top of the menu to copy them; the first is latitude (23.5–37.2), the second longitude (60.8–77.9). Swapped or mistyped numbers are refused. |
| `radius_m` | Alert circle in metres, 50–5000. Shrine or building in a city: 200–500. Fort, park or large mosque: 500–1000. Lake, valley or viewpoint area: 1500–3000. |
| `short_description` (+`_ur`) | One line for cards and the landmark alert (about 60–120 characters). |
| `description` (+`_ur`) | A paragraph for the Overview tab, two to five sentences. |
| `history`, `significance` (+`_ur`) | History tab and "why it matters" in the alert: what the client brief asks for most. |
| `culture`, `local_customs` (+`_ur`) | Culture and etiquette (dress, shoes, photography). |
| `food`, `shopping` (+`_ur`) | Local food and things to buy nearby (they also feed the AI guide). |
| `tips` (+`_ur`) | Best time of day, crowds, parking. |
| `opening_hours`, `entry_fee`, `best_time` | Free text, e.g. `9am–5pm, closed Mondays`, `Rs 50 locals / Rs 500 foreigners`. |
| `image_url`, `image_credit` | Photo link and credit (section 5). |
| `wikipedia_url` | Shown as "Read more". |

Leave unused cells empty (not `-` or `N/A`). Do not add or rename columns.

## 3. Importing (owner)

1. **New landmark? Check it isn't already there:** Supabase → SQL editor:
   `select slug, name, city from destinations where name ilike '%shah shams%';`
   If it exists, edit that row instead (section 4) so you don't create a duplicate.
2. Supabase dashboard → **Table Editor** → **`landmark_import`** → **Insert** → **Import data from CSV** → choose the file.
3. Check the preview maps each column to the same name, then **Import data**.
4. If a row is refused, the import stops and shows why (section 1 and the list below). Rows before it are
   already saved. Fix the row in the sheet, delete the rows that went in from the file, and import again.
   Re-importing a row that went in is harmless: the same slug just updates it again.
   - *slug must be …*: capital letters, spaces or other characters in the slug;
   - *… is not in Pakistan*: latitude and longitude swapped or mistyped;
   - *radius_m must be …*: radius outside 50–5000;
   - *category "…" is not one of …*: category spelled differently from the list.
5. Each imported row in `landmark_import` gets `result` = `created` or `updated`, as a log.

Every landmark created or edited this way is **locked**: the automatic OpenStreetMap data refresh never
changes or re-shows it again.

## 4. Editing existing landmarks

1. Supabase → SQL editor → run `select * from landmark_sheet;` → **Download CSV**. It has every shown
   landmark in the import columns, English and Urdu side by side (plus `urdu_machine_translated`, which is
   ignored on import).
2. In the sheet, delete the rows you are not changing, then edit the rest. Urdu drafted by AI is marked
   `urdu_machine_translated = true`; correcting it removes the "machine-translated" note in the app.
3. Import the file into `landmark_import` as in section 3. Same slug = update.

**Filling the landmarks that are still English-only** (174 on 7 Nov, OpenStreetMap entries without photos):
export only those with
`select * from landmark_sheet where short_description_ur is null or description_ur is null;`
fill the `_ur` columns (and improve the English if you like), then import as usual.

Quick single fixes can also be made directly in the Table Editor (`destinations` for English,
`destination_translations` with `locale = ur` for Urdu). Editing a landmark there also locks it.

**Hide** a landmark without deleting it: Table Editor → `destinations` → set `active` to `false` (it keeps
its reviews and posts, and stays hidden through data refreshes). **Delete** only rows added by mistake:
deleting also removes its reviews, posts and trip entries.

## 5. Photos

- **Best:** Supabase → **Storage** → bucket **`landmark-photos`** → Upload (JPEG, PNG or WebP, up to 5 MB;
  landscape about 1600 px wide). Name the file after the slug, e.g. `faisal-mosque.jpg`. Click the file →
  **Get URL** and paste it into `image_url`.
- **Or:** a public link from Wikimedia Commons or the place's official site (it may break later).
- Only photos the client owns or that are free to use; fill `image_credit`.

## 6. Near-duplicates (owner, any time)

```sql
select a.slug, a.name, b.slug as other_slug, b.name as other_name,
       round(111320 * sqrt(power(a.latitude - b.latitude, 2)
             + power((a.longitude - b.longitude) * cos(radians(a.latitude)), 2))) as metres
from destinations a
join destinations b on a.id < b.id and a.active and b.active
where abs(a.latitude - b.latitude) < 0.004 and abs(a.longitude - b.longitude) < 0.004
order by metres;
```

Hide the weaker of a real duplicate (`active = false`), keeping the row with the photo, the longer text and
the Urdu. Two different places close together (a fort and a mosque inside it) are fine.

## 7. For agents

- Migrations: `20261106221257_landmark_manual_import` (Pakistan bounds check, `landmark-photos` bucket),
  `…_landmark_bilingual_import` (`destinations.locked` + trigger `private.lock_hand_edits`, OSM import skips
  locked rows, `landmark_import` + trigger `private.apply_landmark_import`, view `landmark_sheet`),
  `…_drop_landmark_urdu_import`, and the machine-Urdu job migrations (`machine_urdu_job*`).
- **Locking:** any write to `destinations` locks the row unless it runs with
  `set_config('gotourgo.system_write', 'on', true)` (only `private.import_osm_dataset()` and
  `public.apply_machine_urdu()` do). The OSM import never updates, deactivates or rewrites the Urdu of a
  locked row; for curated rows it only fills an empty photo, Wikipedia link or Urdu name.
- **Machine Urdu:** edge function `supabase/functions/translate-urdu` (Gemini, `verify_jwt = false`,
  authenticated by single-use tokens in `private.job_tokens`). Start or resume with
  `select private.start_urdu_chain(6, 80);` (batch size, max runs); it fills only empty Urdu fields for
  shown landmarks, labels them `machine_translated`, and continues by itself. Progress:
  `select * from private.urdu_job_log order by id desc;`. The queue is `public.urdu_translation_queue()`.
  Gemini can answer 503 (busy); the next scheduled run retries.
- **Lessons (6–7 Nov):** on the free Gemini key the job hit the daily quota after ~40 requests (429), which also
  blocks the app's AI guide and Lens until midnight Pacific. Flash-Lite looped, invented text and packed other
  sections into `tips`, so it is not used. Structured output (`responseSchema`), an output budget sized to the
  input and `thinkingBudget: 0` were needed for Gemini Flash. All visible landmarks were finished by hand;
  only restart the job (`select cron.schedule('urdu-translation', '*/2 * * * *', 'select private.urdu_cron_tick()');`)
  with a paid key or a separate translation key, and check the output for non-Urdu scripts afterwards.
- New imports cannot create one-language content; the job is only for older data or a future language.
