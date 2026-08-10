-- Migration 013: PZRX8 — 9 new stats + remove untrackable Group D achievements

-- New columns for PZRX8 stats
ALTER TABLE entries ADD COLUMN furniture_crafted   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN clothes_crafted     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN cheese_produced     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN doors_opened        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN sleep_locations     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN basements_explored  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN stations_used       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN animal_species      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN days_no_canned      INTEGER NOT NULL DEFAULT 0;

-- Remove Group D achievements (untrackable by mod):
-- 62=fortress(mega_base), 65=conqueror(louisville_cleared), 67=calorie-hoarder(calories_stored),
-- 73=traveler(all_regions_visited), 75=scientist(all_benches_used),
-- 76=arsenal(arsenal_complete), 77=electrician(powered_bases)
DELETE FROM player_achievements WHERE achievement_id IN (62, 65, 67, 73, 75, 76, 77);
DELETE FROM achievements WHERE id IN (62, 65, 67, 73, 75, 76, 77);

-- all_stations_used threshold = 8 (one per station category defined in mod)
UPDATE achievements SET threshold = 8 WHERE stat = 'all_stations_used';
