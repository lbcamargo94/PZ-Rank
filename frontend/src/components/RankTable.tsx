import type { Entry, SortKey } from '../types';
import { RankRow } from './RankRow';

interface RankTableProps {
  entries:    Entry[];
  sortKey:    SortKey;
  onSort:     (key: SortKey) => void;
  onRegister: () => void;
}

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'days',  label: 'Dias'   },
  { key: 'kills', label: 'Zumbis' },
  { key: 'time',  label: 'Tempo'  },
];

export function RankTable({ entries, sortKey, onSort, onRegister }: RankTableProps) {
  return (
    <div className="container table-section">
      <div className="sort-bar">
        <span className="sort-label">Ordenar por:</span>
        {SORT_LABELS.map(({ key, label }) => (
          <button key={key}
            className={`sort-btn${sortKey === key ? ' active' : ''}`}
            onClick={() => onSort(key)}
            aria-pressed={sortKey === key}>
            {label}
          </button>
        ))}
        <button className="btn-primary btn-sm sort-register" onClick={onRegister}>
          <i className="ti ti-user-plus" aria-hidden="true" /> Cadastrar-se
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-ghost" aria-hidden="true" />
          <p>Nenhum sobrevivente registrado ainda.<br />Cadastre-se e aguarde aprovação dos moderadores!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="rank-table" aria-label="Ranking de sobrevivência">
            <thead>
              <tr>
                <th>#</th>
                <th>Jogador</th>
                <th>Status</th>
                <th>Dias</th>
                <th>Tempo</th>
                <th>Zumbis</th>
                <th>Habilidades</th>
                <th>Live</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <RankRow key={entry.id} entry={entry} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="site-footer-bottom">
        <p>PZ Community Rank &copy; {new Date().getFullYear()} — Projeto da comunidade</p>
      </footer>
    </div>
  );
}
