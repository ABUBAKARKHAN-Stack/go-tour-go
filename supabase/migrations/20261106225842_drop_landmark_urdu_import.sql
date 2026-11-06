-- The Urdu-only import (added earlier the same day, never used, no rows) is
-- replaced by the bilingual landmark_import table.
drop trigger if exists landmark_urdu_import_apply on public.landmark_urdu_import;
drop table if exists public.landmark_urdu_import;
drop function if exists private.apply_landmark_urdu();
