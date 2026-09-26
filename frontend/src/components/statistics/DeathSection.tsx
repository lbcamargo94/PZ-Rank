import { useTranslation } from 'react-i18next';
import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { BarList, EmptyState, SectionHeader, StatCard } from './StatsUi';

// Ícone por causa (rótulos vêm do i18n journal.cause.*, mesmo texto do Jornal)
const CAUSE_ICON: Record<string, string> = {
  zombie: '🧟', zombie_horde: '🧟‍♂️', zombie_virus: '🦠', vehicle: '🚗', pvp: '🔫',
  burned: '🔥', bled: '🩸', infection: '🤕', bleach: '🧴', poison: '☠️', fall: '🪂',
  cold: '🥶', sick: '🤢', hunger: '🍽️', thirst: '💧',
};

function DeathPlaces({ data, label }: { data: ChampionshipStats['deaths']['places']; label: (c: string) => string }) {
  const since = data.since.split('-').reverse().join('/');
  return (
    <>
      <h3 className="stats-subtitle">📍 Onde os sobreviventes mais morrem</h3>
      {data.tracked === 0 ? (
        <EmptyState text={`O local das mortes é registrado desde ${since}. Assim que houver mortes com local registrado, elas aparecem aqui.`} />
      ) : (
        <BarList items={data.regions.map(r => ({
          key:     r.id,
          value:   r.deaths,
          display: fmtPct(r.pct),
          tip:     `${r.name} — ${fmtInt(r.deaths)} mortes (${fmtPct(r.pct)}) · sobreviveram em média ${fmtDays(r.avg_days)} · ${fmtInt(r.avg_kills)} kills em média${r.top_cause ? ` · causa mais comum: ${label(r.top_cause)}` : ''}`,
          label: (
            <>
              <span>{r.name}</span>
              <span className="stats-bar-meta">{fmtInt(r.deaths)} mortes · média {fmtDays(r.avg_days)}</span>
            </>
          ),
        }))} />
      )}
      <p className="stats-section-sub stats-note">
        Registrado desde {since}: {fmtInt(data.tracked)} mortes com local conhecido. Guardamos apenas
        o nome da região onde o personagem morreu (cidade ou "Zona rural"), nunca a posição exata.
      </p>
    </>
  );
}

export function DeathSection({ data }: { data: ChampionshipStats['deaths'] }) {
  const { t } = useTranslation();
  const label = (c: string) => t(`journal.cause.${c}`, { defaultValue: c });

  return (
    <section className="stats-section">
      <SectionHeader
        id="mortes" icon="☠️" title="Principais causas de morte"
        sub={data.deaths > 0
          ? `Causa registrada em ${fmtInt(data.known)} de ${fmtInt(data.deaths)} mortes (${fmtPct(data.coverage)}). Percentuais calculados sobre as mortes com causa conhecida.`
          : undefined}
      />
      {data.known === 0 ? (
        <EmptyState text="Nenhuma morte com causa registrada para os filtros escolhidos." />
      ) : (
        <>
          <div className="stats-cards stats-cards--compact">
            <StatCard icon="💀" label="Mortes com causa conhecida" value={fmtInt(data.known)} />
            <StatCard icon="🧟" label="Mortes causadas por zumbis" value={fmtPct(data.zombie_pct)}
              hint="Soma de zumbi, horda de zumbis e vírus zumbi" />
            {data.causes[0] && (
              <StatCard icon={CAUSE_ICON[data.causes[0].cause] ?? '☠️'} label="Causa mais comum"
                value={label(data.causes[0].cause)} />
            )}
          </div>
          <h3 className="stats-subtitle">Mortes por causa</h3>
          <BarList items={data.causes.map(c => ({
            key:     c.cause,
            value:   c.deaths,
            display: fmtPct(c.pct),
            tip:     `${label(c.cause)} — ${fmtInt(c.deaths)} mortes (${fmtPct(c.pct)}) · sobreviveram em média ${fmtDays(c.avg_days)} · ${fmtInt(c.avg_kills)} kills em média`,
            label: (
              <>
                <span className="stats-bar-img stats-bar-emoji" aria-hidden="true">{CAUSE_ICON[c.cause] ?? '☠️'}</span>
                <span>{label(c.cause)}</span>
                <span className="stats-bar-meta">{fmtInt(c.deaths)} mortes · média {fmtDays(c.avg_days)}</span>
              </>
            ),
          }))} />
          <p className="stats-section-sub stats-note">
            "Horda de zumbis" = morrer cercado por 2 ou mais zumbis ou sendo derrubado por eles.
            A causa é detectada pelo mod no momento da morte; mortes de versões antigas do mod
            ficam como desconhecidas.
          </p>
        </>
      )}
      <DeathPlaces data={data.places} label={label} />
    </section>
  );
}
