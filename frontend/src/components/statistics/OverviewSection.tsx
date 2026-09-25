import type { ChampionshipStats } from '../../lib/api';
import { fmtInt } from '../../lib/statsFormat';
import { SectionHeader, StatCard } from './StatsUi';

export function OverviewSection({ data }: { data: ChampionshipStats['overview'] }) {
  return (
    <section className="stats-section">
      <SectionHeader id="visao-geral" icon="📊" title="Visão geral" />
      <div className="stats-cards">
        <StatCard icon="👥" label="Jogadores participantes" value={fmtInt(data.players)} hint="Contas distintas com ao menos uma run" />
        <StatCard icon="🎮" label="Runs registradas"       value={fmtInt(data.runs)}
          hint={data.previous_runs > 0
            ? `Inclui ${fmtInt(data.previous_runs)} runs anteriores de personagens que recomeçaram com o mesmo nome`
            : 'Personagens enviados ao rank'} />
        <StatCard icon="❤️" label="Vivos ativos"           value={fmtInt(data.alive)} hint="Personagens vivos que sincronizaram nos últimos 14 dias" />
        {data.alive_inactive > 0 && (
          <StatCard icon="💤" label="Vivos inativos" value={fmtInt(data.alive_inactive)}
            hint="Vivos sem jogar há mais de 14 dias — continuam no rank e voltam a ser ativos no próximo sync" />
        )}
        <StatCard icon="💀" label="Personagens mortos"     value={fmtInt(data.dead)} />
        <StatCard icon="🧟" label="Zumbis eliminados"      value={fmtInt(data.total_kills)} />
        <StatCard icon="⏱️" label="Dias sobrevividos"      value={fmtInt(data.total_days)}  hint="Soma dos dias de todas as runs" />
        <StatCard icon="🏠" label="Bases Spiffo concluídas" value={fmtInt(data.bases_built)} hint="Bases oficiais validadas pela moderação" />
        <StatCard icon="🧠" label="Habilidades no nível 10" value={fmtInt(data.skills_maxed)} hint="Soma de skills no nível máximo em todas as runs" />
        {/* Ações: só aparecem quando já há runs com dados enviados pelo Companion atualizado */}
        {data.action_runs > 0 && (
          <>
            {/* só com dado: itens/refeições só passaram a ser contados no mod 2.26.0 */}
            {data.items_crafted > 0 && <StatCard icon="🛠️" label="Itens fabricados" value={fmtInt(data.items_crafted)} hint="Desde o mod 2.26.0" />}
            {data.meals_cooked  > 0 && <StatCard icon="🍳" label="Refeições preparadas" value={fmtInt(data.meals_cooked)} hint="Desde o mod 2.26.0" />}
            {data.houses_looted > 0 && <StatCard icon="🏚️" label="Casas saqueadas" value={fmtInt(data.houses_looted)} hint={`Em ${fmtInt(data.action_runs)} runs com dados de ações`} />}
          </>
        )}
      </div>
      <details className="stats-howto">
        <summary><i className="ti ti-info-circle" aria-hidden="true" /> Como as runs são contadas</summary>
        <ul>
          <li>Cada <strong>run</strong> é uma partida de um personagem. A mesma conta pode ter várias.</li>
          <li>Se você começa uma nova partida com o <strong>mesmo nome de personagem</strong>, a anterior continua contando aqui como run encerrada — e fica visível no seu perfil, na aba "Runs anteriores".</li>
          <li>Partidas encerradas com <strong>0 dias e 0 zumbis mortos</strong> (por exemplo, recriar o personagem para escolher outro ponto de partida ou outros traits) <strong>não contam</strong>.</li>
          <li>Um personagem vivo que <strong>não joga há mais de 14 dias</strong> aparece como <strong>vivo inativo</strong>, separado dos vivos ativos. Ele continua no rank e volta a ser ativo assim que você sincronizar de novo.</li>
          <li>Runs desclassificadas ficam de fora dos números oficiais.</li>
        </ul>
      </details>
    </section>
  );
}
