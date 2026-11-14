import { useMemo, useState } from 'react';
import { checkModList, type ModGroup } from '../lib/modsList';

// "Conferir minha lista" (v4.35.0), na página /mods-lista. Roda só no navegador:
// o texto colado não sai do computador do jogador.
export function ModListChecker({ groups, onSeeInList, onClose }: {
  groups:      ModGroup[];
  onSeeInList: (modId: string) => void;
  onClose:     () => void;
}) {
  const [text, setText]       = useState('');
  const [checked, setChecked] = useState('');
  const result = useMemo(() => (checked ? checkModList(checked, groups) : null), [checked, groups]);
  const problems = result ? result.blocked.length + result.unlisted.length : 0;

  const seeBtn = (id: string) => (
    <button type="button" className="mlc-see" onClick={() => onSeeInList(id)}>
      Ver na lista <i className="ti ti-arrow-right" aria-hidden="true" />
    </button>
  );

  return (
    <section className="mlc" aria-labelledby="mlc-title">
      <div className="mlc-head">
        <h2 id="mlc-title" className="mlc-title"><i className="ti ti-list-check" aria-hidden="true" /> Conferir minha lista</h2>
        <button type="button" className="mlc-close" onClick={onClose} aria-label="Fechar a conferência">
          <i className="ti ti-x" />
        </button>
      </div>
      <p className="mlc-help">
        Cole o conteúdo do <code>mods.txt</code> do seu save ou os IDs dos mods, um por linha. O arquivo fica em{' '}
        <code>Zomboid\Saves\&lt;modo&gt;\&lt;save&gt;\mods.txt</code> (no Windows, dentro da sua pasta de usuário).
        A conferência acontece só no seu navegador: nada é enviado.
      </p>
      <textarea
        className="mlc-input"
        rows={6}
        spellCheck={false}
        placeholder={'mods\n{\n    mod = PZCommunityRank,\n    mod = EURY_CRAFTING,\n}'}
        aria-label="Lista de mods para conferir"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="mlc-actions">
        <button type="button" className="mlc-run" disabled={!text.trim()} onClick={() => setChecked(text)}>
          <i className="ti ti-checks" aria-hidden="true" /> Conferir
        </button>
        {checked && (
          <button type="button" className="mlc-clear" onClick={() => { setText(''); setChecked(''); }}>Limpar</button>
        )}
      </div>

      {result && (
        <div className="mlc-result" aria-live="polite">
          {result.total === 0 ? (
            <p className="mlc-verdict mlc-verdict-warn">
              <i className="ti ti-help-circle" aria-hidden="true" /> Nenhum ID de mod encontrado no texto. Cole as linhas <code>mod = …</code> do mods.txt.
            </p>
          ) : problems === 0 ? (
            <p className="mlc-verdict mlc-verdict-ok">
              <i className="ti ti-circle-check" aria-hidden="true" /> Os {result.total} mods da lista podem ser usados no desafio.
            </p>
          ) : (
            <p className="mlc-verdict mlc-verdict-bad">
              <i className="ti ti-alert-octagon" aria-hidden="true" /> {problems} {problems === 1 ? 'mod desclassifica' : 'mods desclassificam'} a run.
              Desative {problems === 1 ? 'ele' : 'eles'} antes de jogar.
            </p>
          )}

          {result.blocked.length > 0 && (
            <div className="mlc-group mlc-group-bad">
              <h3>Bloqueados ({result.blocked.length})</h3>
              <ul>
                {result.blocked.map(h => (
                  <li key={h.id}>
                    <code>{h.id}</code> <span className="mlc-name">{h.group.primary.name}</span>
                    {seeBtn(h.id)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.unlisted.length > 0 && (
            <div className="mlc-group mlc-group-bad">
              <h3>Fora da lista do campeonato ({result.unlisted.length})</h3>
              <p className="mlc-note">Mod que não está cadastrado também desclassifica. Para pedir a liberação, fale com a moderação no Discord.</p>
              <ul>
                {result.unlisted.map(u => (
                  <li key={u.id}>
                    <code>{u.id}</code>
                    {u.suggestion && (
                      <span className="mlc-name">
                        cadastrado como <code>{u.suggestion}</code>: o ID precisa ser igual, com as mesmas maiúsculas
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.requiredMissing.length > 0 && (
            <div className="mlc-group mlc-group-warn">
              <h3>Obrigatórios que faltam ({result.requiredMissing.length})</h3>
              <p className="mlc-note">Sem todos os mods obrigatórios ativos, a run é desclassificada.</p>
              <ul>
                {result.requiredMissing.map(({ group: g, ids }) => {
                  return (
                    <li key={g.key}>
                      <span className="mlc-name">{g.primary.name}</span>
                      <a href={g.primary.workshop_url} target="_blank" rel="noopener noreferrer" className="mlc-see">
                        Oficina <i className="ti ti-external-link" aria-hidden="true" />
                      </a>
                      <span className="mlc-sub">{ids.length > 1 ? 'ative estes IDs: ' : 'ative o ID: '}{ids.map((id, i) => <span key={id}>{i > 0 && ', '}<code>{id}</code></span>)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {result.workshopNumbers.length > 0 && (
            <p className="mlc-note">
              Ignorados ({result.workshopNumbers.length}): {result.workshopNumbers.join(', ')}. Isso é o número do item na Oficina; a conferência usa o ID do mod (o que aparece no mods.txt).
            </p>
          )}

          {result.allowed.length > 0 && (
            <details className="mlc-group mlc-group-ok">
              <summary>Permitidos ({result.allowed.length})</summary>
              <ul>
                {result.allowed.map(h => (
                  <li key={h.id}><code>{h.id}</code> <span className="mlc-name">{h.group.primary.name}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
