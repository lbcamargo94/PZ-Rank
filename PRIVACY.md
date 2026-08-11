# Privacy Policy

**PZ Community | PZ Community Rank**
Version 1.0 — 2026

> This Privacy Policy describes what data is collected by the PZ Community
> services, how it is used, and your rights regarding that data.
>
> This policy was drafted based on analysis of the actual data collected by
> the system. Items marked TODO indicate areas that require confirmation or
> additional review before publishing.
>
> TODO: REVIEW WITH LEGAL COUNSEL BEFORE PUBLISHING AS A BINDING PRIVACY POLICY.
> This document may need to be adapted to comply with the LGPD (Lei Geral de
> Proteção de Dados — Lei 13.709/2018) and other applicable regulations.

---

## 1. Data Controller

TODO: CONFIRM LEGAL ENTITY OR INDIVIDUAL RESPONSIBLE AS DATA CONTROLLER
(Nome completo e CPF/CNPJ do responsável, conforme exigido pela LGPD)

Contact: lb.camargo94@gmail.com

---

## 2. What Data We Collect

### 2.1 Player Account Data

When a player registers on the platform, the following data is collected:

| Data | Purpose | Notes |
|---|---|---|
| Username (nick) | Identify the player in the ranking | Public |
| Email address | Account authentication and communication | Private |
| Password (bcrypt hash) | Authentication | Stored as hash only; original never stored |
| Gender (optional) | TODO: CONFIRM USE | Optional field |
| YouTube channel URL | Link player profile to streaming activity | Public |
| YouTube channel ID | Internal: live detection and verification | Internal use |
| Twitch URL | Optional profile link | Public if provided |
| Kick URL | Optional profile link | Public if provided |
| TikTok URL | Optional profile link | Public if provided |

### 2.2 Game Data (Sync)

Data sent by the official mod (PZCommunityRank) via the PZ Rank Companion:

| Data | Purpose | Notes |
|---|---|---|
| Character name | Identify the run in the ranking | Public |
| Character profession | Display in player profile | Public |
| Character traits | Display in player profile | Public |
| Days survived | Ranking and scoring | Public |
| Kills count | Ranking and scoring | Public |
| Skill levels | Scoring and profile display | Public |
| Survival time (minutes) | Ranking and scoring | Public |
| Alive/dead status | Ranking display | Public |
| Sandbox/debug status | Anti-cheat validation | Internal |
| Disqualification reason | Moderation record | Partially public |
| In-game objectives progress | Scoring (Brasileirão PZ system) | Public |
| Mod version | Compatibility validation | Internal |
| Sync code timestamp | Anti-replay validation | Internal |

### 2.3 Extended Stats (Optional — sent only if present)

Additional statistics sent by newer versions of the mod:

- Animals killed, fish caught, crops harvested, items crafted
- Houses looted, hours without sleep, trees cut, books read
- Structures built, crops planted, Spiffo's restaurants visited
- Various other in-game milestones

All extended stats are public if present.

### 2.4 Heatmap Data

The Companion may send heatmap delta data representing in-game geographic
positions (coordinates within the Project Zomboid game world). This is NOT
real-world location data. Heatmap data is used to generate aggregate
activity maps within the game world.

### 2.5 Achievement Data

Achievements earned by players are stored and publicly displayed on player profiles.

### 2.6 YouTube Integration Data

- YouTube channel ID (yt_channel_id): stored to identify the player's channel
- YouTube subscription expiry (yt_sub_expires_at): internal, for subscriber features
- Last live video ID (yt_last_live_video_id): internal, for live stream detection

### 2.7 Technical Data

| Data | Purpose | Notes |
|---|---|---|
| IP addresses | Rate limiting (anti-abuse) | TODO: CONFIRM RETENTION PERIOD |
| Player token (UUID) | API authentication | Private; never exposed publicly |
| Request timestamps | System logs | TODO: CONFIRM LOG RETENTION POLICY |
| Account status (approved, blocked) | Access control | Internal |

### 2.8 Moderator Account Data

Moderator accounts collect:
- Login (username)
- Email address
- Password (bcrypt hash)
- Role level
- Account creation date

---

## 3. How We Use Your Data

| Data | Use |
|---|---|
| Account data | Authentication, account management, and communication |
| Game sync data | Computing rankings, scores, and player profiles |
| Extended stats | Player profile display and competition features |
| Heatmap data | Generating aggregate in-game activity maps |
| Achievement data | Displaying accomplishments on player profiles |
| YouTube data | Live stream detection; linking to streaming content |
| IP addresses | Rate limiting to prevent API abuse |
| Player token | Authenticating sync requests from the Companion |

We do not use your data for:
- Advertising
- Sale to third parties
- Profiling unrelated to the competition

TODO: CONFIRM AND EXPAND THIS LIST AFTER REVIEWING ALL DATA FLOWS

---

## 4. Data Sharing

4.1 **Public data** — Ranking data (scores, character names, stats, achievements)
is publicly visible on the PZ Community website.

4.2 **Private data** — Email addresses, passwords (hashed), IP addresses, and
player tokens are not publicly displayed and are not sold or shared with third
parties, except as required by law.

4.3 **Infrastructure providers** — Data is stored using Supabase (PostgreSQL
database) in production. TODO: CONFIRM SUPABASE DATA PROCESSING TERMS AND REGION.

4.4 **YouTube API** — The platform may access YouTube API services to detect
live streams. This is subject to YouTube's Terms of Service and Google's Privacy
Policy. TODO: CONFIRM EXACT YOUTUBE API DATA USED.

---

## 5. Data Retention

TODO: CONFIRM DATA RETENTION PERIODS FOR EACH CATEGORY:
- Player accounts
- Soft-deleted accounts (deleted_at field)
- Game sync data / entry history
- IP logs
- Moderator accounts

---

## 6. Security

6.1 Passwords are stored as bcrypt hashes. The original password is never stored.

6.2 API access requires a player token (UUID) or a signed JWT. Tokens are not
exposed publicly.

6.3 Rate limiting is applied to all public endpoints to prevent abuse.

6.4 HMAC signature validation is applied to sync requests from supported
Companion versions.

6.5 We take reasonable technical measures to protect stored data, but cannot
guarantee absolute security.

---

## 7. Your Rights (LGPD)

Under the Brazilian Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018),
you may have the right to:

- Access your personal data
- Correct inaccurate data
- Request deletion of your data (subject to legal retention obligations)
- Request information about how your data is processed
- Revoke consent where applicable

To exercise these rights, contact: TODO: ADD CONTACT EMAIL

TODO: REVIEW LGPD COMPLIANCE REQUIREMENTS WITH LEGAL COUNSEL

---

## 8. Cookies and Tracking

TODO: CONFIRM WHETHER THE WEBSITE USES COOKIES OR ANALYTICS TOOLS.

The frontend SPA does not use persistent authentication (no localStorage for
session tokens, based on code analysis). No analytics service has been identified
in the current codebase.

If third-party analytics or tracking tools are added in the future, this policy
will be updated.

---

## 9. Changes to This Policy

This Privacy Policy may be updated over time. Material changes will be announced
through official channels when possible. Continued use of the Services after an
update constitutes acceptance of the revised policy.

---

## 10. Contact

For privacy-related inquiries: TODO: ADD CONTACT EMAIL

---

*PZ Community — 2026*
*This document does not constitute legal advice.*
