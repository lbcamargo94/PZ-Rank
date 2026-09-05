import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS_PER_KILL, SCORE_KILLS_MAX,
  SCORE_SKILL_LEVEL, SCORE_SKILL_MAXED, SCORE_SPIFFO_DONE, SCORE_MILITARY,
  SCORE_SPIFFO_HQ, SCORE_SPIFFO_RELIC, MAX_POSSIBLE_SCORE,
} from '../lib/objectives';
import regrasBg from '../../assets/background/tela-de-regras.webp';
import { COMPANION_TAG, STEAM_WORKSHOP_URL } from '../lib/companion';
import { formatNumber } from '../lib/format';
import './regras.css';

type Section = 'participar' | 'objetivos' | 'sandbox' | 'conduta';

const SECTIONS: { id: Section; icon: string }[] = [
  { id: 'participar', icon: 'ti-user-plus'     },
  { id: 'objetivos',  icon: 'ti-target'        },
  { id: 'sandbox',    icon: 'ti-settings'      },
  { id: 'conduta',    icon: 'ti-shield-check'  },
];

interface StepText { title: string; desc: string; action_label: string | null }

const PARTICIPATE_STEPS_META = [
  { n: '01', icon: 'ti-user-circle', action: { to: '/login' } },
  { n: '02', icon: 'ti-puzzle',      action: { to: STEAM_WORKSHOP_URL, external: true } },
  { n: '03', icon: 'ti-download',    action: { to: '/links' } },
  { n: '04', icon: 'ti-settings',    action: { tab: 'sandbox' } },
  { n: '05', icon: 'ti-refresh',     action: null },
  { n: '06', icon: 'ti-trophy',      action: { to: '/rank' } },
] as const;

const FUNDAMENTAL_RULES_META = [
  { n: '01', icon: 'ti-video' },
  { n: '02', icon: 'ti-broadcast' },
  { n: '03', icon: 'ti-settings' },
  { n: '04', icon: 'ti-puzzle' },
  { n: '05', icon: 'ti-ban' },
  { n: '06', icon: 'ti-lock' },
  { n: '07', icon: 'ti-clipboard-check' },
  { n: '08', icon: 'ti-users' },
  { n: '09', icon: 'ti-alert-triangle' },
  { n: '10', icon: 'ti-gavel' },
  { n: '11', icon: 'ti-skull-crossed' },
] as const;

const SANDBOX_GROUPS_META = [
  { id: 'zombies_population', icon: 'ti-users' },
  { id: 'zombies_behavior',   icon: 'ti-brain' },
  { id: 'loot',                icon: 'ti-package-off' },
  { id: 'world',                icon: 'ti-world' },
  { id: 'nature',               icon: 'ti-leaf' },
  { id: 'events',               icon: 'ti-bell' },
  { id: 'character',            icon: 'ti-user' },
  { id: 'firearms',             icon: 'ti-crosshair' },
  { id: 'vehicles',             icon: 'ti-car' },
  { id: 'animals',              icon: 'ti-paw' },
  { id: 'map',                  icon: 'ti-map-2' },
] as const;

interface SandboxRow { label: string; value: string }
interface SandboxGroupText { title: string; rows: SandboxRow[] }

interface RuleText { title: string; desc: string }

export function RegrasPage() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Section>('participar');

  const sectionLabels: Record<Section, string> = {
    participar: t('regras.sections.participar'),
    objetivos:  t('regras.sections.objetivos'),
    sandbox:    t('regras.sections.sandbox'),
    conduta:    t('regras.sections.conduta'),
  };

  const stepTexts = t('regras.participar.steps', { returnObjects: true }) as StepText[];
  const ruleTexts = t('regras.conduta.rules', { returnObjects: true }) as RuleText[];

  return (
    <div className="rg-page" style={{ '--rg-bg-img': `url(${regrasBg})` } as React.CSSProperties}>
      <header className="rg-header">
        <div className="rg-header-inner">
          <Link to="/" className="rg-back-link">
            <i className="ti ti-arrow-left" />
            <span>{t('regras.back')}</span>
          </Link>
          <div className="rg-header-title-block">
            <p className="rg-eyebrow">{t('regras.eyebrow')}</p>
            <h1 className="rg-title">{t('regras.title')}</h1>
            <p className="rg-subtitle">{t('regras.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="rg-layout">

        {/* ── Sidebar ── */}
        <nav className="rg-sidebar" aria-label={t('regras.nav_aria')}>
          <ul className="rg-nav-list">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <button
                  className={`rg-nav-item${active === s.id ? ' is-active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <i className={`ti ${s.icon} rg-nav-icon`} />
                  <span className="rg-nav-label">{sectionLabels[s.id]}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Main ── */}
        <main className="rg-main">

          {/* ── Como Participar ── */}
          {active === 'participar' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-user-plus rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">{t('regras.participar.section_title')}</h2>
                  <p className="rg-section-sub">{t('regras.participar.section_sub')}</p>
                </div>
              </div>

              <div className="rg-steps">
                {PARTICIPATE_STEPS_META.map((step, i) => {
                  const text = stepTexts[i];
                  const actionLabel = text.action_label
                    ? text.action_label.replace('{{tag}}', COMPANION_TAG)
                    : null;
                  return (
                    <div key={step.n} className="rg-step-card">
                      <div className="rg-step-n">{step.n}</div>
                      <div className="rg-step-body">
                        <div className="rg-step-head">
                          <i className={`ti ${step.icon} rg-step-icon`} />
                          <h3 className="rg-step-title">{text.title}</h3>
                        </div>
                        <p className="rg-step-desc">{text.desc}</p>
                        {step.action && actionLabel && (
                          'tab' in step.action ? (
                            <button className="rg-step-action" onClick={() => setActive((step.action as { tab: Section }).tab)}>
                              {actionLabel} <i className="ti ti-arrow-right" />
                            </button>
                          ) : 'external' in step.action && step.action.external ? (
                            <a href={step.action.to} className="rg-step-action" target="_blank" rel="noopener noreferrer">
                              {actionLabel} <i className="ti ti-external-link" />
                            </a>
                          ) : (
                            <Link to={step.action.to} className="rg-step-action">
                              {actionLabel} <i className="ti ti-arrow-right" />
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rg-callout rg-callout--info">
                <i className="ti ti-info-circle" />
                <span>{t('regras.participar.callout_min_version_pre')} <strong>v2.13.0</strong>. {t('regras.participar.callout_min_version_post')}</span>
              </div>

              <div className="rg-callout rg-callout--warn">
                <i className="ti ti-skull-crossed" />
                <span><strong>{t('regras.participar.callout_death_lead')}</strong> {t('regras.participar.callout_death_body')}</span>
              </div>
            </div>
          )}

          {/* ── Objetivos & Pontuação ── */}
          {active === 'objetivos' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-target rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">{t('regras.objetivos.section_title')}</h2>
                  <p className="rg-section-sub">{t('regras.objetivos.section_sub')}</p>
                </div>
              </div>

              {/* Objetivos Principais */}
              <h3 className="rg-sub-title">{t('regras.objetivos.main_title')}</h3>
              <div className="rg-obj-list">
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-skull" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_extermination.title')}</span>
                    <span className="rg-obj-desc">
                      {t('regras.objetivos.card_extermination.desc_pre')} <strong>+{SCORE_KILLS_PER_KILL} pt</strong>. {t('regras.objetivos.card_extermination.desc_post', { max: formatNumber(SCORE_KILLS_MAX) })}
                    </span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_extermination.badge', { total: formatNumber(Math.round(SCORE_KILLS_MAX * SCORE_KILLS_PER_KILL)) })}</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-star" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_survival_master.title')}</span>
                    <span className="rg-obj-desc">
                      {t('regras.objetivos.card_survival_master.desc_pre')} <strong>+{formatNumber(SCORE_SKILL_LEVEL)} pts</strong>. {t('regras.objetivos.card_survival_master.desc_post', { max: formatNumber(SCORE_SKILL_MAXED) })}
                    </span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_survival_master.badge', { total: formatNumber(35 * SCORE_SKILL_MAXED) })}</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-home" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_kentucky.title')}</span>
                    <span className="rg-obj-desc">
                      {t('regras.objetivos.card_kentucky.desc_pre', { count: SPIFFOS_RESTAURANTS.length })} <strong>+{formatNumber(SCORE_SPIFFO_DONE)} pts</strong>.
                    </span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_kentucky.badge', { total: formatNumber(SPIFFOS_RESTAURANTS.length * SCORE_SPIFFO_DONE) })}</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-building-store" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_spiffo_hq.title')}</span>
                    <span className="rg-obj-desc">{t('regras.objetivos.card_spiffo_hq.desc')}</span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_spiffo_hq.badge', { val: formatNumber(SCORE_SPIFFO_HQ) })}</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-trophy" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_spiffo_relic.title')}</span>
                    <span className="rg-obj-desc">{t('regras.objetivos.card_spiffo_relic.desc')}</span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_spiffo_relic.badge', { val: formatNumber(SCORE_SPIFFO_RELIC) })}</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-sword" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">{t('regras.objetivos.card_military.title')}</span>
                    <span className="rg-obj-desc">{t('regras.objetivos.card_military.desc')}</span>
                    <span className="rg-pts-badge">{t('regras.objetivos.card_military.badge', { val: formatNumber(SCORE_MILITARY) })}</span>
                  </div>
                </div>
              </div>

              {/* Pontuação resumo */}
              <div className="rg-max-score">
                <span className="rg-max-label">{t('regras.objetivos.max_score_label')}</span>
                <span className="rg-max-value">{formatNumber(MAX_POSSIBLE_SCORE)} pts</span>
              </div>

              {/* Spiffo's Bases */}
              <h3 className="rg-sub-title">{t('regras.objetivos.locations_title')}</h3>
              <div className="rg-restaurants-grid">
                {SPIFFOS_RESTAURANTS.map(r => (
                  <div key={r.id} className="rg-restaurant-chip">
                    <i className="ti ti-map-pin" /> {r.name}
                  </div>
                ))}
              </div>

              <h3 className="rg-sub-title" style={{ marginTop: '1.25rem' }}>{t('regras.objetivos.requirements_title')}</h3>
              <p className="rg-spiffos-intro">
                {t('regras.objetivos.requirements_intro_pre')} <strong>{t('regras.objetivos.requirements_intro_bold')}</strong> {t('regras.objetivos.requirements_intro_post')}
              </p>
              <div className="rg-base-items">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rg-base-item-row">
                    <i className="ti ti-check" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Configurações do Sandbox ── */}
          {active === 'sandbox' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-settings rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">{t('regras.sandbox.section_title')}</h2>
                  <p className="rg-section-sub">{t('regras.sandbox.section_sub')}</p>
                </div>
              </div>

              <div className="rg-callout rg-callout--warn">
                <i className="ti ti-alert-triangle" />
                <span>{t('regras.sandbox.callout_pre')} <strong>{t('regras.sandbox.callout_bold')}</strong>. {t('regras.sandbox.callout_post')}</span>
              </div>

              <div className="rg-sandbox-groups">
                {SANDBOX_GROUPS_META.map(meta => {
                  const group = t(`regras.sandbox.groups.${meta.id}`, { returnObjects: true }) as SandboxGroupText;
                  return (
                    <section key={meta.id} className="rg-sandbox-group">
                      <h3 className="rg-sandbox-group-title">
                        <i className={`ti ${meta.icon}`} /> {group.title}
                      </h3>
                      <div className="rg-sandbox-rows">
                        {group.rows.map(row => (
                          <div key={row.label} className="rg-sandbox-row">
                            <span className="rg-sandbox-label">{row.label}</span>
                            <span className="rg-sandbox-value">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Regras de Conduta ── */}
          {active === 'conduta' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-shield-check rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">{t('regras.conduta.section_title')}</h2>
                  <p className="rg-section-sub">{t('regras.conduta.section_sub')}</p>
                </div>
              </div>

              <div className="rg-steps">
                {FUNDAMENTAL_RULES_META.map((rule, i) => {
                  const text = ruleTexts[i];
                  return (
                    <div key={rule.n} className="rg-step-card">
                      <div className="rg-step-n">{rule.n}</div>
                      <div className="rg-step-body">
                        <div className="rg-step-head">
                          <i className={`ti ${rule.icon} rg-step-icon`} />
                          <h3 className="rg-step-title">{text.title}</h3>
                        </div>
                        <p className="rg-step-desc">{text.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rg-callout rg-callout--info">
                <i className="ti ti-info-circle" />
                <span>{t('regras.conduta.footer')}</span>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
