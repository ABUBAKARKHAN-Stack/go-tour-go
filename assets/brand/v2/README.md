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

**Phase H (next APK build):** render these SVGs to the PNG sizes `app.json` uses
(`assets/brand/*.png`) and switch the icon/splash. Not referenced yet on purpose:
changing files `app.json` points at changes the native fingerprint, so OTA
updates would stop reaching the installed APK.
