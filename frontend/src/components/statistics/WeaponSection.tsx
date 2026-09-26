import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { OTHER_HINT, categoryIcon, categoryLabel, weaponName } from '../../lib/weapons';
import { BarList, EmptyState, SectionHeader, StatCard } from './StatsUi';

export function WeaponSection({ data }: { data: ChampionshipStats['weapons'] }) {
  const since = `Registrado a partir do mod ${data.min_mod_version}`;
  const topCat = data.categories.find(c => c.cat !== 'other');
  const topWeapon = data.top_weapons[0];

  return (
    <section className="stats-section">
      <SectionHeader
        id="armas" icon="🪓" title="Armas que mais matam zumbis"
        sub={data.runs_with_data > 0
          ? `${since}: ${fmtInt(data.runs_with_data)} de ${fmtInt(data.runs_total)} runs já têm armas registradas. A arma do golpe final leva o abate.`
          : undefined}
      />
      {data.runs_with_data === 0 ? (
        <EmptyState text={`${since}. Assim que os jogadores atualizarem o mod, as armas aparecem aqui.`} />
      ) : (
        <>
          <div className="stats-cards stats-cards--compact">
            <StatCard icon="💀" label="Abates com arma registrada" value={fmtInt(data.total_kills)} />
            {topCat && <StatCard icon={categoryIcon(topCat.cat)} label="Tipo de arma mais usado" value={categoryLabel(topCat.cat)} />}
            {topWeapon && <StatCard icon="🏆" label="Arma que mais matou" value={weaponName(topWeapon.id)} />}
          </div>

          <h3 className="stats-subtitle">Abates por tipo de arma</h3>
          <BarList items={data.categories.map(c => ({
            key:     c.cat,
            value:   c.kills,
            display: fmtPct(c.pct),
            tip:     `${categoryLabel(c.cat)} — ${fmtInt(c.kills)} abates (${fmtPct(c.pct)})${c.cat === 'other' ? `. ${OTHER_HINT}` : ''}`,
            label: (
              <>
                <span className="stats-bar-img stats-bar-emoji" aria-hidden="true">{categoryIcon(c.cat)}</span>
                <span>{categoryLabel(c.cat)}</span>
                <span className="stats-bar-meta">{fmtInt(c.kills)} abates</span>
              </>
            ),
          }))} />

          <h3 className="stats-subtitle">As armas que mais mataram</h3>
          <BarList initial={5} items={data.top_weapons.map(w => ({
            key:     w.id,
            value:   w.kills,
            display: fmtInt(w.kills),
            tip:     `${weaponName(w.id)} — ${fmtInt(w.kills)} abates em ${fmtInt(w.runs)} ${w.runs === 1 ? 'run' : 'runs'}`,
            label: (
              <>
                <span>{weaponName(w.id)}</span>
                <span className="stats-bar-meta">{fmtInt(w.runs)} {w.runs === 1 ? 'run' : 'runs'}</span>
              </>
            ),
          }))} />

          {data.favorites.length > 0 && (
            <>
              <h3 className="stats-subtitle">Tipo de arma preferido × sobrevivência</h3>
              <BarList items={data.favorites.map(f => ({
                key:     f.cat,
                value:   f.avg_days,
                display: fmtDays(f.avg_days),
                tip:     `${fmtInt(f.runs)} runs preferem ${categoryLabel(f.cat).toLowerCase()} (${fmtPct(f.pct)}) · sobrevivem em média ${fmtDays(f.avg_days)} · ${fmtInt(f.avg_kills)} kills em média`,
                label: (
                  <>
                    <span className="stats-bar-img stats-bar-emoji" aria-hidden="true">{categoryIcon(f.cat)}</span>
                    <span>{categoryLabel(f.cat)}</span>
                    <span className="stats-bar-meta">{fmtInt(f.runs)} {f.runs === 1 ? 'run' : 'runs'}</span>
                  </>
                ),
              }))} />
            </>
          )}
          <p className="stats-section-sub stats-note">
            Tipo preferido = o tipo de arma com mais abates na run (sem contar "Outros").
            {' '}{OTHER_HINT} Abates anteriores ao mod {data.min_mod_version} não têm arma registrada.
          </p>
        </>
      )}
    </section>
  );
}
