import type { StatsQuery, StatsStatus } from '../../lib/api';

interface Props {
  query:       StatsQuery;
  seasonName:  string | null;
  professions: string[];
  onChange:    (q: StatsQuery) => void;
}

const STATUS_OPTIONS: Array<{ value: StatsStatus; label: string }> = [
  { value: 'all',   label: 'Todas as runs' },
  { value: 'alive',    label: 'Vivos ativos' },
  { value: 'inactive', label: 'Vivos inativos (14+ dias sem jogar)' },
  { value: 'dead',  label: 'Mortos (runs encerradas)' },
];

export function StatsFiltersBar({ query, seasonName, professions, onChange }: Props) {
  return (
    <div className="stats-filters" role="group" aria-label="Filtros das estatísticas">
      {/* Uma opção só: `entries` ainda não tem season_id (ver docs/estatisticas.md) */}
      <label className="stats-filter">
        <span>Temporada</span>
        <select value="current" disabled={true} aria-describedby="stats-season-note">
          <option value="current">{seasonName ? `Atual — ${seasonName}` : 'Temporada atual'}</option>
        </select>
      </label>

      <label className="stats-filter">
        <span>Status da run</span>
        <select value={query.status} onChange={e => onChange({ ...query, status: e.target.value as StatsStatus })}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <label className="stats-filter">
        <span>Profissão</span>
        <select value={query.profession ?? ''} onChange={e => onChange({ ...query, profession: e.target.value || null })}>
          <option value="">Todas</option>
          {professions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label className="stats-filter stats-filter--check">
        <input
          type="checkbox"
          checked={query.includeDq}
          onChange={e => onChange({ ...query, includeDq: e.target.checked })}
        />
        <span>Incluir desclassificados</span>
      </label>

      <p id="stats-season-note" className="stats-filter-note">
        {query.includeDq
          ? 'Mostrando também runs desclassificadas — estes números NÃO são os oficiais.'
          : 'Dados oficiais: runs válidas da temporada atual (sem desclassificados).'}
      </p>
    </div>
  );
}
