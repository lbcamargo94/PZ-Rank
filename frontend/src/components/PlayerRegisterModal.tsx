import { useState } from 'react';
import { toast } from 'sonner';
import { apiRegisterPlayer } from '../lib/api';
import {
  IconCircleCheck,
  IconArrowLeft,
  IconTrophy,
  IconUser,
  IconBrandTwitch,
  IconBrandYoutube,
  IconBrandKick,
  IconBrandTiktok,
  IconInfoCircle,
  IconLoader2,
  IconSend,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  onClose: () => void;
}

type SocialIconName = 'ti-brand-twitch' | 'ti-brand-youtube' | 'ti-brand-kick' | 'ti-brand-tiktok';

const SOCIAL_ICON_MAP: Record<SocialIconName, React.ReactElement> = {
  'ti-brand-twitch':  <IconBrandTwitch  size={16} />,
  'ti-brand-youtube': <IconBrandYoutube size={16} />,
  'ti-brand-kick':    <IconBrandKick    size={16} />,
  'ti-brand-tiktok':  <IconBrandTiktok  size={16} />,
};

const SOCIALS = [
  { id: 'twitch',  label: 'Twitch',  icon: 'ti-brand-twitch'  as SocialIconName, placeholder: 'twitch.tv/seunick',    color: '#9146ff' },
  { id: 'youtube', label: 'YouTube', icon: 'ti-brand-youtube' as SocialIconName, placeholder: 'youtube.com/@seunick', color: '#ff0000' },
  { id: 'kick',    label: 'Kick',    icon: 'ti-brand-kick'    as SocialIconName, placeholder: 'kick.com/seunick',      color: '#53fc18' },
  { id: 'tiktok',  label: 'TikTok',  icon: 'ti-brand-tiktok'  as SocialIconName, placeholder: 'tiktok.com/@seunick',  color: '#ee1d52' },
] as const;

type SocialId = typeof SOCIALS[number]['id'];

export function PlayerRegisterModal({ onClose }: Props) {
  const [nick,    setNick]    = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [socials, setSocials] = useState<Record<SocialId, string>>({
    twitch: '', youtube: '', kick: '', tiktok: '',
  });

  function setSocial(id: SocialId, value: string) {
    setSocials(prev => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) return;
    setLoading(true);
    try {
      await apiRegisterPlayer({
        nick:        nick.trim(),
        twitch_url:  socials.twitch.trim()  || undefined,
        youtube_url: socials.youtube.trim() || undefined,
        kick_url:    socials.kick.trim()    || undefined,
        tiktok_url:  socials.tiktok.trim()  || undefined,
      });
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[480px]">
        {done ? (
          /* ── Estado de sucesso ── */
          <div className="reg-success">
            <div className="reg-success-icon"><IconCircleCheck size={20} /></div>
            <h2 className="reg-success-title">Cadastro enviado!</h2>
            <p className="reg-success-msg">
              Seu pedido foi recebido. Um moderador vai revisar e aprovar sua inscrição em breve.
            </p>
            <Button className="w-full" onClick={onClose}>
              <IconArrowLeft size={16} /> Voltar ao ranking
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconTrophy size={20} /> Entrar no Ranking
              </DialogTitle>
            </DialogHeader>
            <p className="reg-subtitle">
              Preencha seus dados. Um moderador vai revisar e aprovar seu cadastro.
            </p>

            <form className="modal-form" onSubmit={handleSubmit} noValidate>

              {/* ── Nick ── */}
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-nick">
                  Nick do jogador <span className="required">*</span>
                </label>
                <div className="reg-nick-input-wrap">
                  <IconUser size={16} className="reg-nick-icon" />
                  <input
                    id="reg-nick"
                    className="form-input reg-nick-input"
                    type="text"
                    placeholder="SeuNickAqui"
                    value={nick}
                    onChange={e => setNick(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {/* ── Canais de streaming ── */}
              <div className="reg-socials-section">
                <div className="reg-socials-header">
                  <span className="form-label">Canais de streaming</span>
                  <span className="optional-chip">opcional</span>
                </div>
                <p className="reg-socials-hint">
                  Adicione seus canais para aparecer como criador de conteúdo no ranking.
                </p>

                <div className="reg-socials-grid">
                  {SOCIALS.map(s => (
                    <div key={s.id} className="reg-social-item" style={{ '--social-color': s.color } as React.CSSProperties}>
                      <label className="reg-social-label" htmlFor={`reg-${s.id}`}>
                        {SOCIAL_ICON_MAP[s.icon]}
                        {s.label}
                      </label>
                      <input
                        id={`reg-${s.id}`}
                        className="form-input reg-social-input"
                        type="url"
                        placeholder={s.placeholder}
                        value={socials[s.id]}
                        onChange={e => setSocial(s.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Info box ── */}
              <div className="reg-info-box">
                <IconInfoCircle size={16} />
                <span>
                  Após o cadastro, um moderador precisa aprovar sua conta antes que você apareça no ranking.
                </span>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !nick.trim()}
              >
                {loading
                  ? <><IconLoader2 size={16} className="animate-spin" /> Enviando...</>
                  : <><IconSend size={16} /> Enviar cadastro</>}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}