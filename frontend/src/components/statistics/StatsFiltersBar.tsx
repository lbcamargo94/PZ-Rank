import type { StatsQuery, StatsStatus } from '../../lib/api';

interface Props {
  query:       StatsQuery;
  seasons:     Array<{ id: number; name: string; is_active: boolean | number }>;
  professions: string[];
  onChange:    (q: StatsQuery) => void;
}

const STATUS_OPTIONS: Array<{ value: StatsStatus; label: string }> = [
  { value: 'all',   label: 'Todas as runs' },
  { value: 'alive',    label: 'Vivos ativos' },
  { value: 'inactive', label: 'Vivos inativos (14+ dias sem jogar)' },
  { value: 'dead',  label: 'Mortos (runs encerradas)' },
];

export function StatsFiltersBar({ query, seasons, professions, onChange }: Props) {
  // Temporada ativa = 'current' (padrão). Passadas pelo id. "Todas" só aparece quando
  // existe mais de uma — nunca misturar temporadas sem o jogador escolher isso.
  const past = seasons.filter(s => !(s.is_active === true || s.is_active === 1));
  const active = seasons.find(s => s.is_active === true || s.is_active === 1);
  return (
    <div className="stats-filters" role="group" aria-label="Filtros das estatísticas">
      <label className="stats-filter">
        <span>Temporada</span>
        <select
          value={query.season}
          disabled={seasons.length <= 1}
          onChange={e => onChange({ ...query, season: e.target.value })}
        >
          <option value="current">{active ? `Atual — ${active.name}` : 'Temporada atual'}</option>
          {past.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          {seasons.length > 1 && <option value="all">Todas as temporadas</option>}
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

      <p className="stats-filter-note">
        {query.includeDq
          ? 'Mostrando também runs desclassificadas — estes números NÃO são os oficiais.'
          : query.season === 'all'
            ? 'Somando todas as temporadas (sem desclassificados).'
            : 'Dados oficiais: runs válidas da temporada escolhida (sem desclassificados).'}
      </p>
    </div>
  );
}
