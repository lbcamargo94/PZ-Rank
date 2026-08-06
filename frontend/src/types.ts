export interface Entry {
  id?:            number;
  player_id?:     number | null;
  moderator_id?:  string | null;
  name:           string;
  character_name: string | null;
  profession:     string | null;
  days:           number;
  time_raw:       number;
  time_str:       string | null;
  kills:          number;
  skills:         string | null;
  live_url:       string | null;
  is_alive:       boolean;
  sandbox_ok?:    boolean;
  traits?:        string | null;
  objectives?:                import('./lib/objectives').Objectives | null;
  score:                      number;
  disqualification_reason?:   string | null;
  disqualified_at?:           string | null;
  flagged_reason?:            string | null;
  flagged_at?:                string | null;
  deleted_at?:                string | null;
  created_at?:                string | null;
  updated_at?:                string | null;
  sandbox_config?:            Record<string, unknown> | null;
  sandbox_config_updated_at?: string | null;
  // PZRX3 extended stats (null = not yet reported)
  animals_killed?:      number | null;
  fish_caught?:         number | null;
  crops_harvested?:     number | null;
  items_crafted?:       number | null;
  houses_looted?:       number | null;
  hours_without_sleep?: number | null;
  trees_cut?:           number | null;
  books_read?:          number | null;
  structures_built?:    number | null;
  crops_planted?:       number | null;
  spiffo_visited?:      number | null;
  // PZRX6 extended stats
  eggs_collected?:      number | null;
  milk_produced?:       number | null;
  stone_structures?:    number | null;
  ceramic_items?:       number | null;
  forged_weapons?:      number | null;
  km_driven?:           number | null;
  cities_visited?:      number | null;
  military_visited?:    number | null;
  meals_cooked?:        number | null;
  water_collected?:     number | null;
  materials_crafted?:   number | null;
  animal_tracks?:       number | null;
}

export type SortKey = 'days' | 'kills' | 'time' | 'score' | 'skills' | 'updated_at';
export type RankTab = 'rank' | 'records' | 'dead' | 'disqualified';

export interface DecodedCode {
  characterName:          string;
  profession:             string;
  kills:                  number;
  timeRaw:                number;
  days:                   number;
  timeStr:                string;
  skills:                 string[];
  isAlive:                boolean;
  sandboxOk:              boolean;
  traits:                 string[];
  disqualificationReason: string | null;
  codeTimestamp:          number | null;
  modVersion:             string | null;
  animalsKilled:          number;
  fishCaught:             number;
  cropsHarvested:         number;
  itemsCrafted:           number;
  housesLooted:           number;
  hoursWithoutSleep:      number;
  // PZRX4
  treesCut:               number;
  booksRead:              number;
  structuresBuilt:        number;
  cropsPlanted:           number;
  // PZRX5
  spiffoVisited:          number;
  skillLevels:            Record<string, number>;
}

export type ModeratorRole  = 'moderator' | 'master';
export type PlayerStatus   = 'pending' | 'approved' | 'rejected';
export type PlayerFilter   = PlayerStatus | 'blocked' | 'deleted' | 'supporter' | 'all';

export interface Player {
  id:                 number;
  nick:               string;
  email?:             string | null;
  email_verified_at?: string | null;
  twitch_url:         string | null;
  youtube_url:        string | null;
  kick_url:           string | null;
  tiktok_url:         string | null;
  gender?:            'm' | 'f' | null;
  status:             PlayerStatus;
  blocked:            boolean;
  blocked_reason?:    string | null;
  blocked_at?:        string | null;
  blocked_by?:        string | null;
  blocked_note?:      string | null;
  is_supporter:       boolean;
  supporter_until:    string | null;
  deleted_at?:        string | null;
  created_at:         string;
}

export interface Moderator {
  id:         string;
  login:      string;
  email:      string;
  role:       ModeratorRole;
  created_at: string;
}

export interface ModSession {
  token:  string;
  role:   ModeratorRole;
  login:  string;
  email:  string;
  modId:  string;
}

export type ModStatus = 'active' | 'blocked';

export interface ModDependency {
  id:   number;
  name: string;
}

export interface Mod {
  id:           number;
  name:         string;
  mod_id:       string | null;
  workshop_url: string;
  status:       ModStatus;
  is_required:  boolean;
  image_url:    string | null;
  created_at:   string;
  updated_at:   string;
  dependencies: ModDependency[];
}

export interface PlayerProfile {
  player: Pick<Player, 'id' | 'nick' | 'twitch_url' | 'youtube_url' | 'kick_url' | 'tiktok_url' | 'gender'>;
  entries: Entry[];
}

export interface Season {
  id:         number;
  name:       string;
  theme_slug: string | null;
  started_at: string;
  ended_at:   string | null;
  is_active:  boolean;
}

export interface HallOfFameEntry {
  id:             number;
  season_id:      number;
  player_id:      number | null;
  entry_name:     string;
  character_name: string | null;
  position:       number;
  days:           number;
  kills:          number;
  score:          number;
}

export interface NewsStats {
  alive_count:  number;
  dead_count:   number;
  total_kills:  number;
  deaths_today: number;
  syncs_today:  number;
  kills_today:  number;
}

export interface DailyNews {
  id:       number;
  date:     string;
  headline: string | null;
  stats:    NewsStats | null;
}

export interface PlayerSession {
  token:        string;
  player_id:    number;
  nick:         string;
  is_supporter: boolean;
}

export type FinanceCategory = 'hosting' | 'prize' | 'domain' | 'adsense' | 'supporters' | 'sponsor' | 'other';

export interface FinanceEntry {
  id:         number;
  season_id:  number;
  category:   FinanceCategory;
  label:      string;
  amount_brl: number;
  goal_brl:   number | null;
  updated_at: string;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface Achievement {
  id:          number;
  slug:        string;
  name:        string;
  description: string;
  icon:        string;
  tier:        AchievementTier;
  stat:        string;
  threshold:   number;
}

export interface PlayerAchievement {
  id:          number;
  slug:        string;
  name:        string;
  description: string;
  icon:        string;
  tier:        AchievementTier;
  stat:        string;
  threshold:   number;
  unlocked_at: string;
  entry_id:    number | null;
}

export interface HeatmapPoint {
  event_type: 'kill' | 'death' | 'base';
  grid_x:     number;
  grid_y:     number;
  count:      number;
}

export interface PlayerAccount {
  id:                 number;
  nick:               string;
  email:              string;
  email_verified_at:  string | null;
  twitch_url:         string | null;
  youtube_url:        string | null;
  kick_url:           string | null;
  tiktok_url:         string | null;
  gender?:            'm' | 'f' | null;
  status:             PlayerStatus;
  created_at:         string;
}