-- migration_v36: active_mods + mod_version em entries
-- active_mods: JSON array de mod IDs enviado pelo mod v2.18.0+
-- mod_version: versão do mod PZCommunityRank usada no sync

ALTER TABLE entries ADD COLUMN IF NOT EXISTS active_mods  TEXT    DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS mod_version  TEXT    DEFAULT NULL;
