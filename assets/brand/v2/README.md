# GoTourGo brand kit v2 (client design guide, approved 9 Nov 2026)

Source: the client's traced logo, split into pin, plane and wordmark and coloured
like their reference. Editable kit and style tile: Figma file
`oEFixqzn09XSHhoI3oXM39` ("GoTourGo Brand Kit").

| File | Use |
|---|---|
| `wordmark-horizontal.svg` (+ `-white`, `-black`) | Main logo; white on navy/photos; one colour |
| `wordmark-stacked.svg` | Splash / sign-in lockup |
| `logo-symbol.svg` (+ `-white`, `-black`) | Pin + plane alone |
| `wordmark.svg`, `wordmark-white.svg` | "GoTourGo" letters alone |
| `icon.svg` | App icon (light sky background, symbol at 62%) |
| `adaptive-foreground.svg` / `adaptive-background.svg` | Android adaptive icon |
| `monochrome.svg` | Android themed icon, notification icon (one colour) |
| `splash-icon.svg` | Splash image |

Colours: pin gradient `#1EB9EF → #035591`, plane `#1C7DBF`, "Go…Go" navy `#1A5372`,
"Tour" sky `#2E9FD9`.

In the app the logo is drawn from `src/components/brand-paths.ts` (same outlines) by
`BrandLogo` / `BrandSymbol` in `src/components/brand.tsx`.

**Phase H (done):** `icon.svg`, `adaptive-foreground.svg`, `adaptive-background.svg`,
`monochrome.svg` and `splash-icon.svg` were rendered at 1024 × 1024 to `assets/brand/*.png`
(favicon 48 × 48), and `app.json` uses them with the brand page colour `#F6FAFC` for the splash
and the adaptive-icon background image. This changed the native fingerprint, so it ships with a
new APK.
