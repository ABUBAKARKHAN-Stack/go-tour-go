/**
 * App-wide constants: who the app is, where its links and data come from, and
 * country facts. Edit values here; feature tuning (radii, timings, sizes)
 * stays next to the code that uses it.
 *
 * Native identifiers (name, slug, scheme, Android package) live in app.json,
 * because the build reads them from there; they are re-exported here so the
 * code has one place to look. Changing one of those needs a new APK.
 * Secrets never go here: the Supabase URL and publishable key come from
 * EXPO_PUBLIC_* variables (src/lib/env.ts), the Gemini key stays on the server.
 */
import appJson from '../../app.json';

// Plain data only: no app imports, so pure modules (and their unit tests) can use it.
const expo = appJson.expo;

/** The app itself (from app.json). */
export const APP = {
  name: expo.name,
  slug: expo.slug,
  /** Deep links: gotourgo://destination/<slug>, gotourgo://reset-password … */
  scheme: expo.scheme,
  androidPackage: expo.android.package,
  version: expo.version,
} as const;

/**
 * Website behind shared links (EAS Hosting): /sos and /live show a shared
 * location, /p shows a shared post. Android opens these straight in the app
 * (App Links in app.json list the same host).
 */
export const SHARE_SITE_URL = 'https://go-tour-go.expo.app';

/** Free, keyless public services the app talks to (fair-use limits apply). */
export const SERVICES = {
  /** Default map style; EXPO_PUBLIC_MAP_STYLE_URL overrides it. */
  mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
  /** OSRM routing by travel mode (FOSSGIS servers). */
  routing: {
    driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
    cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
    walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  },
  /** Current weather (Open-Meteo). */
  weather: 'https://api.open-meteo.com/v1/forecast',
  /** Nearby services from OpenStreetMap (Overpass). */
  overpass: 'https://overpass-api.de/api/interpreter',
  /** Place search fallback (Photon). */
  photon: 'https://photon.komoot.io/api/',
  /** Offline Pakistan map files, published as a GitHub release of this repository. */
  offlineMapRelease: 'https://github.com/ABUBAKARKHAN-Stack/go-tour-go/releases/download/pakistan-map',
} as const;

/** Other apps and sites the app hands off to. */
export const EXTERNAL = {
  googleMapsDirections: 'https://www.google.com/maps/dir/',
  openStreetMap: 'https://www.openstreetmap.org/',
  whatsapp: 'https://wa.me/',
} as const;

/** The country the app covers. */
export const COUNTRY = {
  name: 'Pakistan',
  /** Map centre for the whole-country view ([longitude, latitude]). */
  center: [70.5, 30.5] as [number, number],
  /** Bounding box for search: west, south, east, north. */
  bbox: [60.5, 23.3, 77.9, 37.2] as const,
} as const;

export type EmergencyService = 'police' | 'rescue' | 'edhi' | 'motorway';

/**
 * Emergency numbers in Pakistan, shown on the Safety screen; `sos` ones also
 * on the SOS screen. Labels are translated in src/features/safety/emergency.ts.
 * The share site lists 15, 1122 and 115 too (site/assets/share.js).
 */
export const EMERGENCY_NUMBERS: readonly { number: string; service: EmergencyService; sos: boolean }[] = [
  { number: '15', service: 'police', sos: true },
  { number: '1122', service: 'rescue', sos: true },
  { number: '115', service: 'edhi', sos: true },
  { number: '130', service: 'motorway', sos: false },
];
