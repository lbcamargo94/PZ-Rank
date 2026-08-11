# Licensing Structure — PZ Community Ecosystem

This document describes the licensing structure of all components in the PZ Community
ecosystem. It is a reference for contributors, collaborators, and users who need to
understand the intellectual property boundaries of the project.

---

## Overview

The PZ Community ecosystem is **proprietary software** by default.

Being publicly visible on GitHub does not make a component open source. Public source
code availability is a deliberate transparency and collaboration choice, not a grant
of open-source rights.

> "Public source code" ≠ "Open Source License"

All components developed originally for this project are covered by the
**PZ Community Proprietary License v1.0** unless explicitly noted otherwise.

---

## Component Licensing Matrix

| Component | Description | License | Redistribution |
|---|---|---|---|
| PZ Community Rank (frontend) | React SPA — ranking website | Proprietary | Not authorized |
| PZ Community Rank (backend) | Express API — all endpoints | Proprietary | Not authorized |
| PZ Community Rank (API) | REST API routes, auth, validation | Proprietary | Not authorized |
| PZ Rank Companion | Electron desktop sync app | Proprietary | Not authorized |
| PZCommunityRank Mod | Official Lua mod for Project Zomboid | Proprietary | Not authorized |
| PZ-Dayvinho-Blessings Mod | Official Lua mod for Project Zomboid | Proprietary | Not authorized |
| Pz-Helicopter-Events-Spawn Mod | Official Lua mod for Project Zomboid | Proprietary | Not authorized |
| Database schema | Supabase/SQLite schema and structure | Proprietary | Not authorized |
| Scoring system | Scoring and ranking algorithms | Proprietary | Not authorized |
| Season system | Season management and rules | Proprietary | Not authorized |
| Achievement system | Achievement definitions and logic | Proprietary | Not authorized |
| Heatmap system | In-game geographic data processing | Proprietary | Not authorized |
| Competition system (Brasileirão PZ) | Rules, ranking, and administration | Proprietary | Not authorized |
| Proprietary assets | Logos, icons, banners, artwork | All Rights Reserved | Not authorized |
| External dependencies | npm packages, libraries, frameworks | Own license | Per license |

---

## Categories of Intellectual Property

### A — Software

Includes all source code, compiled binaries, scripts, configuration, and tooling
developed originally for the project.

- PZ Community Rank (frontend + backend + API)
- PZ Rank Companion
- All official mods
- Internal tools and scripts

**License:** PZ Community Proprietary License v1.0
**See:** [LICENSE](../LICENSE)

---

### B — Content

Includes documentation, competition rules, narrative content, database records,
and any text produced as part of the project.

- This documentation
- Competition rules and scoring definitions
- Player records and rank data
- Season history and records

**License:** All Rights Reserved, unless stated otherwise in a specific document.

---

### C — Artwork and Visual Identity

Includes logos, icons, banners, UI illustrations, thumbnails, and all graphic
elements created for the project.

- PZ Community logo
- Brasileirão PZ visual identity
- Season artwork
- UI icons not sourced from third-party icon sets

**License:** All Rights Reserved, except assets explicitly attributed to third parties.

---

### D — Branding

The following names and identifiers are brand identifiers of the project:

- **PZ Community**
- **PZ Community Rank**
- **Brasileirão PZ**
- Season names
- Official logos and symbols

Use of these identifiers in a way that suggests official affiliation, endorsement,
or partnership without authorization is prohibited.

**TODO: REVIEW TRADEMARK REGISTRATION STATUS WITH BRAZILIAN IP ATTORNEY**

---

## External Dependencies

External libraries and frameworks used by this project retain their own licenses.
Using this software does not grant you any rights over those third-party components.

**See:** [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md)

---

## Components With Non-Proprietary Licenses

| Component | License | Notes |
|---|---|---|
| PZ-Emmanuelle-VHS-Collection | MIT (Copyright (c) 2026 Lucas Camargo) | Existing license — TODO: CONFIRM IF CHANGE IS INTENDED |

> **Note:** `PZ-Emmanuelle-VHS-Collection` currently has an MIT License. If the
> intent is to bring it under the proprietary license, the LICENSE file in that
> repository must be manually updated and any prior MIT recipients must be notified.
> **Do not change retroactively without legal review.**

---

## Licensing FAQ

**Q: The code is on GitHub. Can I clone and use it?**
You may clone the repository for personal review. You may not use, copy, modify,
or distribute the code beyond what Section 2 of the LICENSE permits.

**Q: Can I contribute to the project?**
Contributions are welcome at the maintainer's discretion. Contributing code implies
you agree that your contribution will be subject to the project's proprietary license.
TODO: FORMALIZE A CONTRIBUTOR LICENSE AGREEMENT (CLA) IF NEEDED.

**Q: Can I use parts of this project for my own PZ server?**
No, without written authorization from the copyright holder.

**Q: Can I fork the project privately for local testing?**
Private forks for personal testing may be acceptable at the maintainer's discretion.
Contact the maintainer for clarification.

---

*This document does not constitute legal advice.*
*Last updated: 2026*
