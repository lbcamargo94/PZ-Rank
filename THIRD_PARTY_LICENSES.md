# Third-Party Licenses

This document lists third-party components used in the PZ Community ecosystem,
their respective licenses, and how they are used.

These components are NOT covered by the PZ Community Proprietary License.
Each component remains subject to its own license terms.

---

## PZ Community Rank — Backend (`backend/`)

---

### @supabase/supabase-js

- **Version:** ^2.45.0
- **License:** MIT
- **Origin:** https://github.com/supabase/supabase-js
- **Use in project:** Database client; communicates with Supabase PostgreSQL in production.

---

### bcryptjs

- **Version:** ^3.0.3
- **License:** MIT
- **Origin:** https://github.com/dcodeIO/bcrypt.js
- **Use in project:** Password hashing for moderator accounts.

---

### better-sqlite3

- **Version:** ^12.11.1
- **License:** MIT
- **Origin:** https://github.com/WiseLibs/better-sqlite3
- **Use in project:** Local SQLite database for development without Supabase.

---

### cors

- **Version:** ^2.8.5
- **License:** MIT
- **Origin:** https://github.com/expressjs/cors
- **Use in project:** CORS middleware for the Express API.

---

### dotenv

- **Version:** ^16.4.5
- **License:** BSD-2-Clause
- **Origin:** https://github.com/motdotla/dotenv
- **Use in project:** Environment variable loading from `.env` files.

---

### express

- **Version:** ^4.21.0
- **License:** MIT
- **Origin:** https://github.com/expressjs/express
- **Use in project:** HTTP server framework for the backend API.

---

### express-rate-limit

- **Version:** ^8.5.2
- **License:** MIT
- **Origin:** https://github.com/express-rate-limit/express-rate-limit
- **Use in project:** Rate limiting middleware to protect sync and lookup endpoints.

---

### helmet

- **Version:** ^8.0.0
- **License:** MIT
- **Origin:** https://github.com/helmetjs/helmet
- **Use in project:** HTTP security headers middleware.

---

### jsonwebtoken

- **Version:** ^9.0.3
- **License:** MIT
- **Origin:** https://github.com/auth0/node-jsonwebtoken
- **Use in project:** JWT generation and validation for moderator authentication.

---

### resend

- **Version:** ^6.18.0
- **License:** MIT
- **Origin:** https://github.com/resend/resend-node
- **Use in project:** Transactional email delivery.

---

## PZ Community Rank — Frontend (`frontend/`)

---

### react

- **Version:** ^18.3.1
- **License:** MIT
- **Origin:** https://github.com/facebook/react
- **Use in project:** UI library for the ranking website.

---

### react-dom

- **Version:** ^18.3.1
- **License:** MIT
- **Origin:** https://github.com/facebook/react
- **Use in project:** DOM rendering for React.

---

### react-router-dom

- **Version:** ^7.18.0
- **License:** MIT
- **Origin:** https://github.com/remix-run/react-router
- **Use in project:** Client-side routing for the SPA.

---

### leaflet

- **Version:** ^1.9.4
- **License:** BSD-2-Clause
- **Origin:** https://github.com/Leaflet/Leaflet
- **Use in project:** Interactive map for heatmap visualization.

---

### @types/leaflet

- **Version:** ^1.9.21
- **License:** MIT
- **Origin:** https://github.com/DefinitelyTyped/DefinitelyTyped
- **Use in project:** TypeScript type definitions for Leaflet (dev dependency).

---

### embla-carousel-react

- **Version:** ^8.6.0
- **License:** MIT
- **Origin:** https://github.com/davidjerleke/embla-carousel
- **Use in project:** Carousel component.

---

### embla-carousel-autoplay

- **Version:** ^8.6.0
- **License:** MIT
- **Origin:** https://github.com/davidjerleke/embla-carousel
- **Use in project:** Autoplay plugin for the carousel.

---

### vite

- **Version:** ^5.4.0
- **License:** MIT
- **Origin:** https://github.com/vitejs/vite
- **Use in project:** Build tool and development server (dev dependency).

---

### vitest

- **Version:** ^4.1.9
- **License:** MIT
- **Origin:** https://github.com/vitest-dev/vitest
- **Use in project:** Test runner for frontend and backend (dev dependency).

---

### typescript

- **Version:** ^5.5.4
- **License:** Apache-2.0
- **Origin:** https://github.com/microsoft/TypeScript
- **Use in project:** TypeScript compiler (dev dependency, both frontend and backend).

---

### tsx

- **Version:** ^4.19.0
- **License:** MIT
- **Origin:** https://github.com/privatenumber/tsx
- **Use in project:** TypeScript execution for backend development and scripts.

---

## PZ Rank Companion

---

### electron

- **Version:** ^28.3.3
- **License:** MIT
- **Origin:** https://github.com/electron/electron
- **Use in project:** Desktop application framework for the Companion.

---

### electron-builder

- **Version:** ^25.1.8
- **License:** MIT
- **Origin:** https://github.com/electron-userland/electron-builder
- **Use in project:** Packaging and distribution of the Companion app.

---

### electron-updater

- **Version:** ^6.8.9
- **License:** MIT
- **Origin:** https://github.com/electron-userland/electron-builder
- **Use in project:** Auto-update functionality for the Companion.

---

### chokidar

- **Version:** ^3.6.0
- **License:** MIT
- **Origin:** https://github.com/paulmillr/chokidar
- **Use in project:** File system watching for PZ sync file detection.

---

## Project Zomboid (Mod Integration)

---

### Project Zomboid Game Engine / Lua API

- **License:** TODO: CONFIRM — subject to The Indie Stone's End User License Agreement
- **Origin:** https://store.steampowered.com/app/108600/Project_Zomboid/
- **Use in project:** The official mods (PZCommunityRank, PZ-Dayvinho-Blessings, etc.)
  run inside Project Zomboid and use its Lua scripting API.
- **Observations:** Mod development is subject to The Indie Stone's EULA and modding
  policies. Consult their official documentation for current terms.

---

## Frontend — Assets e Fontes (via CDN)

---

### Tabler Icons

- **Version:** 3.19.0
- **License:** MIT
- **Origin:** https://github.com/tabler/tabler-icons
- **CDN:** https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css
- **Use in project:** Icon set used throughout the frontend UI via CSS classes (`ti ti-*`).
- **Observations:** Loaded at runtime via CDN; not bundled. MIT License — no attribution
  required in the UI, but credited here per best practice.

---

### Share Tech Mono (Google Fonts)

- **Version:** Latest (served by Google Fonts CDN)
- **License:** SIL Open Font License 1.1 (OFL-1.1)
- **Origin:** https://fonts.google.com/specimen/Share+Tech+Mono
- **CDN:** https://fonts.googleapis.com
- **Use in project:** Monospace font used in the frontend UI.
- **Observations:** Loaded at runtime via Google Fonts CDN. Subject to Google Fonts Terms
  of Service in addition to the OFL-1.1 font license.

---

### Oswald (Google Fonts)

- **Version:** Latest (served by Google Fonts CDN)
- **License:** SIL Open Font License 1.1 (OFL-1.1)
- **Origin:** https://fonts.google.com/specimen/Oswald
- **CDN:** https://fonts.googleapis.com
- **Use in project:** Display/heading font used in the frontend UI.
- **Observations:** Loaded at runtime via Google Fonts CDN. Subject to Google Fonts Terms
  of Service in addition to the OFL-1.1 font license.

---

*This document was last updated: 2026.*
*If you identify a missing or incorrect entry, please open an issue or contact the project maintainers.*
