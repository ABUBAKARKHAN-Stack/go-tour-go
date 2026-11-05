# GoTourGo brand assets

Logo: a location pin with two Karakoram peaks and a terracotta sun.
Colours: teal `#0F4C4A`, cream `#FBF8F3`, terracotta `#C8643B`.
Wordmark: "GoTourGo" in Fraunces SemiBold (the app's display face), outlined
so it needs no font.

| File | Size | Use |
|---|---|---|
| `icon.png` / `icon.svg` | 1024 × 1024 | App icon (store, legacy launchers); symbol inside the middle 66% |
| `adaptive-foreground.png` | 1024 × 1024, transparent | Android adaptive icon foreground; symbol inside the 66 dp safe circle |
| `adaptive-background.png` | 1024 × 1024 | Android adaptive icon background (solid cream) |
| `monochrome.png` | 1024 × 1024, transparent | Android 13+ themed icon (one colour, Android tints it) |
| `splash-icon.png` | 1024 × 1024, transparent | Splash screen image on a cream background |
| `favicon.png` | 48 × 48 | Web favicon |
| `logo-symbol.png` / `.svg` | 512 × 700, transparent | Symbol alone, for in-app use |
| `wordmark-horizontal.png` / `.svg` | 1508 × 418 | Logo + wordmark side by side |
| `wordmark-stacked.png` / `.svg` | 1222 × 799 | Logo above wordmark (splash, onboarding) |

## Switching the app icon (PR 6, with the next APK build)

These files are not referenced by `app.json` yet, so they don't change the
native fingerprint and OTA updates keep reaching the installed APK. With the
next APK build, `app.json` changes to:

```json
"icon": "./assets/brand/icon.png",
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/brand/adaptive-foreground.png",
    "backgroundColor": "#FBF8F3",
    "monochromeImage": "./assets/brand/monochrome.png"
  }
},
"web": { "favicon": "./assets/brand/favicon.png" },
"plugins": [
  ["expo-splash-screen", { "image": "./assets/brand/splash-icon.png", "imageWidth": 200, "backgroundColor": "#FBF8F3" }],
  ["expo-notifications", { "icon": "./assets/brand/monochrome.png", "color": "#0F4C4A" }]
]
```

## Rebuilding

```bash
pip install fonttools
python3 scripts/brand/make-brand-svgs.py
node scripts/brand/render-brand-pngs.cjs
```

`adaptive-background.png` is the same cream as an image, for tools that want a file instead of `backgroundColor`.
