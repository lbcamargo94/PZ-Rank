import { useCallback, useEffect, useState } from 'react';
import {
  apiAddBannedIdentity, apiDeleteBannedIdentity, apiGetBannedIdentities,
  type BanKind, type BannedIdentity,
} from '../../lib/api';

// Lista de identidades banidas: nick e canais de quem foi banido ANTES de ter
// cadastro (ex: ofensas no chat de live de um participante). Um cadastro ou troca
// de links que bata com a lista fica pendente e marcado pra revisão — nunca é
// recusado automaticamente (backend/src/lib/bannedIdentities.ts).

interface Props {
  token:     string;
  isMaster:  boolean;
  showToast: (msg: string, type?: string) => void;
}

const KIND_LABEL: Record<BanKind, string> = {
  nick: 'Nick', twitch: 'Twitch', youtube: 'YouTube', kick: 'Kick', tiktok: 'TikTok',
};
const PLACEHOLDER: Record<BanKind, string> = {
  nick:    'FabzGOD',
  twitch:  'https://www.twitch.tv/fabzgod',
  youtube: 'https://www.youtube.com/@canal',
  kick:    'https://kick.com/usuario',
  tiktok:  'https://www.tiktok.com/@usuario',
};

export function BannedIdentitiesManager({ token, isMaster, showToast }: Props) {
  const [list, setList]       = useState<BannedIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind]       = useState<BanKind>('nick');
  const [value, setValue]     = useState('');
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [matches, setMatches] = useState<Array<{ id: number; nick: string; status: string; blocked: boolean }> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await apiGetBannedIdentities(token)); }
    catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { void load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await apiAddBannedIdentity(token, kind, value, reason);
      setMatches(r.existing_matches);
      setValue('');
      showToast(`${KIND_LABEL[kind]} adicionado à lista de banidos.`, 'success');
      await load();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  async function remove(item: BannedIdentity) {
    if (!window.confirm(`Remover ${KIND_LABEL[item.kind]} "${item.value}" da lista de banidos?`)) return;
    try {
      await apiDeleteBannedIdentity(token, item.id);
      showToast('Removido da lista.', 'success');
      await load();
    } catch (err) { showToast((err as Error).message, 'error'); }
  }

  return (
    <div className="banlist">
      <h2 className="banlist-title"><i className="ti ti-ban" /> Lista de banidos</h2>
      <p className="banlist-help">
        Para quem foi banido <strong>antes de ter cadastro</strong> (por exemplo, ofensas no chat de live de um
        participante). Se alguém se cadastrar ou vincular um canal que bata com esta lista, o cadastro fica
        <strong> pendente e marcado</strong> na aba Jogadores para um moderador decidir. Nick é comparado sem
        diferenciar maiúsculas, acentos e símbolos; canais pelo usuário do link.
      </p>

      <form className="banlist-form" onSubmit={add}>
        <label className="mod-field">
          <span className="mod-field-label">Tipo</span>
          <select className="mod-input" value={kind} onChange={e => setKind(e.target.value as BanKind)}>
            {(Object.keys(KIND_LABEL) as BanKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <label className="mod-field banlist-grow">
          <span className="mod-field-label">{kind === 'nick' ? 'Nick' : 'Link do canal (ou usuário)'}</span>
          <input className="mod-input" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[kind]} required />
        </label>
        <label className="mod-field banlist-full">
          <span className="mod-field-label">Motivo (fica registrado)</span>
          <input className="mod-input" value={reason} onChange={e => setReason(e.target.value)} minLength={5} maxLength={500}
            placeholder="Ex.: ofensas étnicas a jogadores no chat de live" required />
        </label>
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          <i className="ti ti-plus" /> {saving ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      {matches && (
        <div className="player-ban-info player-ban-match banlist-matches">
          <i className="ti ti-info-circle" />
          {matches.length === 0
            ? <span>Nenhuma conta cadastrada bate com essa entrada.</span>
            : <span>
                Contas já cadastradas que batem (marcadas na aba Jogadores, <strong>nada foi bloqueado</strong>):{' '}
                {matches.map(m => `${m.nick} (${m.blocked ? 'banido' : m.status})`).join(', ')}.
                Use "Banir" na aba Jogadores se for a mesma pessoa.
              </span>}
        </div>
      )}

      {loading ? <p className="banlist-help"><i className="ti ti-loader-2 spin" /> Carregando...</p>
        : list.length === 0 ? <p className="banlist-help">A lista está vazia.</p>
        : (
          <ul className="banlist-list">
            {list.map(item => (
              <li key={item.id} className="banlist-item">
                <span className="banlist-kind">{KIND_LABEL[item.kind]}</span>
                <strong className="banlist-value">{item.value}</strong>
                <span className="banlist-reason">{item.reason}</span>
                <span className="banlist-meta">
                  {item.created_by ?? 'moderador'} · {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </span>
                {isMaster && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => remove(item)} title="Remover da lista (só master)">
                    <i className="ti ti-trash" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
