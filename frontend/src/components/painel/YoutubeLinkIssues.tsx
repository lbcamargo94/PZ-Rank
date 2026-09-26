import { useCallback, useEffect, useState } from 'react';
import { apiGetYtUnresolved, apiRetryYtResolve, type YtUnresolvedPlayer } from '../../lib/api';

// Links do YouTube que o servidor desistiu de resolver (o canal não existe). Sem o
// canal, a live do jogador nunca é detectada. Some sozinho quando o jogador corrige
// o link no perfil. Só aparece quando há algum.

interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

export function YoutubeLinkIssues({ token, showToast }: Props) {
  const [list, setList] = useState<YtUnresolvedPlayer[]>([]);

  const load = useCallback(async () => {
    try { setList((await apiGetYtUnresolved(token)).players); }
    catch { /* seção auxiliar: falha não atrapalha o painel */ }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function retry(p: YtUnresolvedPlayer) {
    try {
      await apiRetryYtResolve(token, p.id);
      showToast(`O link de ${p.nick} volta para a fila e é testado de novo na próxima madrugada.`, 'success');
      await load();
    } catch (e) { showToast((e as Error).message, 'error'); }
  }

  if (list.length === 0) return null;

  return (
    <div className="banlist">
      <h2 className="banlist-title"><i className="ti ti-brand-youtube" /> Links do YouTube sem canal ({list.length})</h2>
      <p className="banlist-help">
        O canal destes links não foi encontrado em várias tentativas, então as lives desses jogadores
        <strong> não são detectadas</strong>. Peça para o jogador corrigir o link no perfil (ex.:
        https://www.youtube.com/@canal) — depois disso a lista se atualiza sozinha. Use "Tentar de novo"
        se o link já estiver certo.
      </p>
      <ul className="banlist-list">
        {list.map(p => (
          <li key={p.id} className="banlist-item">
            <strong className="banlist-value">{p.nick}</strong>
            <span className="banlist-reason">{p.youtube_url}</span>
            <span className="banlist-meta">
              {p.yt_resolve_attempts} tentativas
              {p.yt_resolve_failed_at ? ` · última em ${new Date(p.yt_resolve_failed_at).toLocaleDateString('pt-BR')}` : ''}
            </span>
            <button type="button" className="btn-secondary btn-sm" onClick={() => retry(p)}>
              <i className="ti ti-refresh" /> Tentar de novo
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
