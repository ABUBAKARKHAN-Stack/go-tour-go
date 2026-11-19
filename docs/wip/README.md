# Work in progress: bundled offline database

`bundled-offline-db.patch` holds unfinished changes found uncommitted in the
working tree (not made by the session that saved them). They ship a
pre-built SQLite copy of places and landmarks inside the app
(`assets/data/gotourgo-data.db`) so the first launch works offline, then
let sync keep it up to date.

Not applied because the bundle file and its build script
(`scripts/build-offline-db.ts`) don't exist yet: with the patch applied,
`expo export` fails ("Unable to resolve ../../assets/data/gotourgo-data.db").

To continue: `git apply docs/wip/bundled-offline-db.patch`, add the build
script and the `.db` asset (and `db` to Metro's `assetExts`), then check
`expo export --platform android` and the fingerprint before shipping.
