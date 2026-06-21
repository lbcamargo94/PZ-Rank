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
  objectives?:    import('./lib/objectives').Objectives | null;
  score:          number;
}

export type SortKey = 'days' | 'kills' | 'time' | 'score';

export interface DecodedCode {
  characterName: string;
  profession:    string;
  kills:         number;
  timeRaw:       number;
  days:          number;
  timeStr:       string;
  skills:        string[];
  isAlive:       boolean;
  sandboxOk:     boolean;
  traits:        string[];
}

export type ModeratorRole  = 'moderator' | 'master';
export type PlayerStatus   = 'pending' | 'approved' | 'rejected';
export type PlayerFilter   = PlayerStatus | 'blocked' | 'all';

export interface Player {
  id:          number;
  nick:        string;
  twitch_url:  string | null;
  youtube_url: string | null;
  kick_url:    string | null;
  tiktok_url:  string | null;
  status:      PlayerStatus;
  blocked:     boolean;
  created_at:  string;
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

export interface PlayerProfile {
  player: Pick<Player, 'id' | 'nick' | 'twitch_url' | 'youtube_url' | 'kick_url' | 'tiktok_url'>;
  entries: Entry[];
}
