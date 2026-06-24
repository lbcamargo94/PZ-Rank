import { useState, useEffect } from 'react';
import { apiGetPlayerProfile } from '../lib/api';
import type { PlayerProfile, Entry } from '../types';
import {
  IconLoader2,
  IconUserCircle,
  IconBrandTwitch,
  IconBrandYoutube,
  IconBrandKick,
  IconBrandTiktok,
  IconTrophy,
  IconUsers,
  IconHeartbeat,
  IconSkull,
  IconStar,
  IconCalendar,
  IconSword,
  IconClock,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  playerId: number;
  onClose:  () => void;
}

type SocialIconName = 'ti-brand-twitch' | 'ti-brand-youtube' | 'ti-brand-kick' | 'ti-brand-tiktok';

const SOCIAL_ICON_MAP: Record<SocialIconName, React.ReactElement> = {
  'ti-brand-twitch':  <IconBrandTwitch  size={16} />,
  'ti-brand-youtube': <IconBrandYoutube size={16} />,
  'ti-brand-kick':    <IconBrandKick    size={16} />,
  'ti-brand-tiktok':  <IconBrandTiktok  size={16} />,
};

const SOCIALS = [
  { field: 'twitch_url',  icon: 'ti-brand-twitch'  as SocialIconName, label: 'Twitch',  cls: 'social-twitch'  },
  { field: 'youtube_url', icon: 'ti-brand-youtube' as SocialIconName, label: 'YouTube', cls: 'social-youtube' },
  { field: 'kick_url',    icon: 'ti-brand-kick'    as SocialIconName, label: 'Kick',    cls: 'social-kick'    },
  { field: 'tiktok_url',  icon: 'ti-brand-tiktok'  as SocialIconName, label: 'TikTok',  cls: 'social-tiktok'  },
] as const;

export function PlayerCardModal({ playerId, onClose }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGetPlayerProfile(playerId)
      .then(setProfile)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [playerId]);

  const bestEntry = profile?.entries.reduce<Entry | null>(
    (best, e) => (!best || e.score > best.score ? e : best),
    null,
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUserCircle size={20} />
            {profile?.player.nick ?? 'Perfil do Jogador'}
          </DialogTitle>
        </DialogHeader>

        {loading && <p className="painel-loading"><IconLoader2 size={16} className="animate-spin" /> Carregando...</p>}
        {error   && <p className="form-error">{error}</p>}

        {profile && (
          <>
            <div className="pc-socials">
              {SOCIALS.map(s => {
                const url = profile.player[s.field as keyof typeof profile.player] as string | null;
                return url ? (
                  <a key={s.field} href={url} target="_blank" rel="noopener noreferrer"
                    className={`pc-social-link ${s.cls}`} title={s.label}>
                    {SOCIAL_ICON_MAP[s.icon]}
                    <span>{s.label}</span>
                  </a>
                ) : null;
              })}
              {SOCIALS.every(s => !profile.player[s.field as keyof typeof profile.player]) && (
                <span className="pc-no-socials">Sem canais cadastrados</span>
              )}
            </div>

            {bestEntry && (
              <div className="pc-best">
                <span className="pc-best-label"><IconTrophy size={16} /> Melhor pontuação</span>
                <span className="pc-best-score">{bestEntry.score.toLocaleString('pt-BR')} pts</span>
                {bestEntry.character_name && (
                  <span className="pc-best-char">com {bestEntry.character_name}</span>
                )}
              </div>
            )}

            <div className="pc-chars-section">
              <p className="pc-section-title">
                <IconUsers size={16} /> Personagens no rank
                <span className="pc-char-count">{profile.entries.length}</span>
              </p>

              {profile.entries.length === 0 && (
                <p className="painel-empty">Nenhum personagem no rank ainda.</p>
              )}

              <div className="pc-chars-list">
                {profile.entries.map(e => (
                  <div key={e.id} className={`pc-char-card${e === bestEntry ? ' pc-char-best' : ''}`}>
                    <div className="pc-char-top">
                      <div className="pc-char-identity">
                        <span className="pc-char-name">{e.character_name || '—'}</span>
                        {e.profession && <span className="profession-badge">{e.profession}</span>}
                      </div>
                      {e.is_alive
                        ? <span className="alive-badge alive"><IconHeartbeat size={16} /> Vivo</span>
                        : <span className="alive-badge dead"><IconSkull size={16} /> Morto</span>}
                    </div>
                    <div className="pc-char-stats">
                      <span className="pc-stat"><IconStar size={14} />{e.score.toLocaleString('pt-BR')} pts</span>
                      <span className="pc-stat"><IconCalendar size={14} />{e.days}d</span>
                      <span className="pc-stat"><IconSword size={14} />{e.kills.toLocaleString('pt-BR')}</span>
                      {e.time_str && <span className="pc-stat"><IconClock size={14} />{e.time_str}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}