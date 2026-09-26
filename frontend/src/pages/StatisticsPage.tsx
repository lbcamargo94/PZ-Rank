import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGetChampionshipStats, apiGetSeasons, type ChampionshipStats, type StatsQuery, type StatsStatus } from '../lib/api';
import { StatsFiltersBar }    from '../components/statistics/StatsFiltersBar';
import { OverviewSection }    from '../components/statistics/OverviewSection';
import { ProfessionSection }  from '../components/statistics/ProfessionSection';
import { TraitSection }       from '../components/statistics/TraitSection';
import { SurvivalSection }    from '../components/statistics/SurvivalSection';
import { ZombieSection }      from '../components/statistics/ZombieSection';
import { SkillSection }       from '../components/statistics/SkillSection';
import { ActionSection }      from '../components/statistics/ActionSection';
import { DeathSection }       from '../components/statistics/DeathSection';
import { TimelineSection }    from '../components/statistics/TimelineSection';
import { RecordsSection, recordTarget } from '../components/statistics/RecordsSection';
import { CuriositiesSection } from '../components/statistics/CuriositiesSection';
import { ComingSoonSection }  from '../components/statistics/ComingSoonSection';
import { RankingModal, type RankingTarget } from '../components/statistics/StatsUi';

const SECTIONS = [
  { id: 'visao-geral',   label: 'Visão geral' },
  { id: 'evolucao',      label: 'Evolução' },
  { id: 'profissoes',    label: 'Profissões' },
  { id: 'traits',        label: 'Traits' },
  { id: 'sobrevivencia', label: 'Sobrevivência' },
  { id: 'zumbis',        label: 'Zumbis' },
  { id: 'mortes',        label: 'Mortes' },
  { id: 'skills',        label: 'Skills' },
  { id: 'acoes',         label: 'Ações' },
  { id: 'recordes',      label: 'Recordes' },
  { id: 'curiosidades',  label: 'Curiosidades' },
  { id: 'em-breve',      label: 'Em breve' },
];

const STATUSES: StatsStatus[] = ['all', 'alive', 'inactive', 'dead'];

// Filtros vivem na URL (?status=dead&profissao=Lenhador&dq=1) pra permitir compartilhar
function queryFromParams(p: URLSearchParams): StatsQuery {
  const status = p.get('status') as StatsStatus | null;
  return {
    status:     status && STATUSES.includes(status) ? status : 'all',
    profession: p.get('profissao') || null,
    includeDq:  p.get('dq') === '1',
    season:     p.get('temporada') || 'current',
  };
}

export function StatisticsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData]       = useState<ChampionshipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingTarget | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [seasons, setSeasons] = useState<Array<{ id: number; name: string; is_active: boolean | number }>>([]);

  useEffect(() => { apiGetSeasons().then(setSeasons).catch(() => setSeasons([])); }, []);

  const paramsKey = params.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const query = useMemo(() => queryFromParams(params), [paramsKey]);

  useEffect(() => { document.title = 'Estatísticas do Campeonato — PZ Rank'; }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    apiGetChampionshipStats(query)
      .then(d => { if (alive) setData(d); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Erro ao carregar estatísticas.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [query, reloadKey]);

  const updateQuery = useCallback((q: StatsQuery) => {
    const next = new URLSearchParams();
    if (q.status !== 'all') next.set('status', q.status);
    if (q.profession)       next.set('profissao', q.profession);
    if (q.includeDq)        next.set('dq', '1');
    if (q.season && q.season !== 'current') next.set('temporada', q.season);
    setParams(next, { replace: true });
  }, [setParams]);

  const closeRanking = useCallback(() => setRanking(null), []);

  return (
    <div className="stats-page">
      <div className="container">
        <div className="legends-header">
          <button type="button" className="btn-primary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
            <i className="ti ti-arrow-left" /> Voltar
          </button>
          {/* Painel escuro: o fundo padrão do site é claro atrás do título (céu) */}
          <div className="stats-hero">
            <h1 className="legends-title"><i className="ti ti-chart-bar" /> Estatísticas do Brasileirão PZ</h1>
            <p className="legends-sub">O que os sobreviventes do campeonato escolhem, quanto duram e até onde evoluem.</p>
          </div>
        </div>

        <StatsFiltersBar
          query={query}
          seasons={seasons}
          professions={data?.profession_options ?? (query.profession ? [query.profession] : [])}
          onChange={updateQuery}
        />

        <nav className="stats-nav" aria-label="Seções da página">
          {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
        </nav>

        {error && (
          <div className="stats-error-box" role="alert">
            <i className="ti ti-alert-circle" /> {error}
            <button type="button" className="stats-link-btn" onClick={() => setReloadKey(k => k + 1)}>Tentar novamente</button>
          </div>
        )}

        {!data && loading && (
          <p className="stats-loading"><i className="ti ti-loader-2 spin" /> Carregando estatísticas...</p>
        )}

        {data && (
          <div className={`stats-body${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
            {data.overview.runs === 0 ? (
              <p className="stats-empty"><i className="ti ti-database-off" /> Nenhuma run encontrada para os filtros escolhidos.</p>
            ) : (
              <>
                <OverviewSection data={data.overview} />
                <TimelineSection data={data.timeline} />
                <ProfessionSection data={data.professions} />
                <TraitSection traits={data.traits} builds={data.trait_builds} />
                <SurvivalSection data={data.survival} onRanking={() => setRanking(recordTarget('days'))} />
                <ZombieSection data={data.zombies} onRanking={() => setRanking(recordTarget('kills'))} />
                <DeathSection data={data.deaths} />
                <SkillSection
                  data={data.skills}
                  runs={data.overview.runs}
                  onRanking={skill => setRanking({ metric: `skill:${skill}`, title: `Maior nível em ${skill}`, unit: 'Nível' })}
                />
                <ActionSection data={data.actions} onRanking={key => setRanking(recordTarget(`action:${key}`))} />
                <RecordsSection data={data.records} onRanking={m => setRanking(recordTarget(m))} />
                <CuriositiesSection data={data.curiosities} />
              </>
            )}
            <ComingSoonSection />
            <p className="stats-updated">
              Atualizado em {new Date(data.generated_at).toLocaleString('pt-BR')} · os números são recalculados a cada poucos minutos.
            </p>
          </div>
        )}
      </div>

      {ranking && <RankingModal target={ranking} query={query} onClose={closeRanking} />}
    </div>
  );
}
