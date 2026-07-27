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
  disqualification_reason?:   'sandbox' | 'debug' | 'mods' | 'manual' | 'mod_removed' | null;
  disqualified_at?:           string | null;
  flagged_reason?:            string | null;
  flagged_at?:                string | null;
  deleted_at?:                string | null;
  created_at?:                string | null;
  updated_at?:                string | null;
  sandbox_config?:            Record<string, unknown> | null;
  sandbox_config_updated_at?: string | null;
}

export type SortKey = 'days' | 'kills' | 'time' | 'score';
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
}

export type ModeratorRole  = 'moderator' | 'master';
export type PlayerStatus   = 'pending' | 'approved' | 'rejected';
export type PlayerFilter   = PlayerStatus | 'blocked' | 'deleted' | 'all';

export interface Player {
  id:                 number;
  nick:               string;
  email?:             string | null;
  email_verified_at?: string | null;
  twitch_url:         string | null;
  youtube_url:        string | null;
  kick_url:           string | null;
  tiktok_url:         string | null;
  status:             PlayerStatus;
  blocked:            boolean;
  deleted_at?:        string | null;
  created_at:         string;
}

export interface Moderator {
  id:         string;
  login:      string;
  role:       ModeratorRole;
  created_at: string;
}

export interface ModSession {
  token: string;
  role:  ModeratorRole;
  login: string;
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
  player: Pick<Player, 'id' | 'nick' | 'twitch_url' | 'youtube_url' | 'kick_url' | 'tiktok_url'>;
  entries: Entry[];
}

export interface PlayerSession {
  token:     string;
  player_id: number;
  nick:      string;
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
  status:             PlayerStatus;
  created_at:         string;
}