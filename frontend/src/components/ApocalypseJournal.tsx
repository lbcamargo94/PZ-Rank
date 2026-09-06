import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apiGetJournal, type JournalEvent } from '../lib/api';
import { useSse } from '../hooks/useSse';
import { formatNumber } from '../lib/format';

const MAX_EVENTS = 50;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60)         return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)         return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)         return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function EventIcon({ type }: { type: JournalEvent['type'] }) {
  if (type === 'player_died')    return <i className="ti ti-skull aj-icon aj-icon-death"   aria-hidden="true" />;
  if (type === 'kill_milestone') return <i className="ti ti-sword aj-icon aj-icon-kill"    aria-hidden="true" />;
  return                                <i className="ti ti-star aj-icon aj-icon-skill"   aria-hidden="true" />;
}

function EventText({ ev }: { ev: JournalEvent }) {
  const { t } = useTranslation();
  const nick = ev.player_nick || '?';
  const char = ev.char_name || nick;

  if (ev.type === 'player_died') {
    const causeKey = typeof ev.data.cause === 'string' && ev.data.cause
      ? `journal.cause.${ev.data.cause}`
      : null;
    const causeText = causeKey ? t(causeKey, { defaultValue: ev.data.cause as string }) : null;
    return (
      <span className="aj-text">
        <span className="aj-char">{char}</span>
        {' '}
        <span className="aj-player">({nick})</span>
        {' '}
        <span className="aj-verb">{t('journal.died')}</span>
        {causeText && (
          <> — <span className="aj-cause">{causeText}</span></>
        )}
      </span>
    );
  }

  if (ev.type === 'kill_milestone') {
    const milestone = typeof ev.data.milestone === 'number' ? ev.data.milestone : 0;
    return (
      <span className="aj-text">
        <span className="aj-char">{char}</span>
        {' '}
        <span className="aj-player">({nick})</span>
        {' '}
        <span className="aj-verb">{t('journal.milestone', { count: formatNumber(milestone) })}</span>
      </span>
    );
  }

  // skill_maxed
  const skill = typeof ev.data.skill === 'string' ? ev.data.skill : '?';
  return (
    <span className="aj-text">
      <span className="aj-char">{char}</span>
      {' '}
      <span className="aj-player">({nick})</span>
      {' '}
      <span className="aj-verb">{t('journal.skill_maxed', { skill })}</span>
    </span>
  );
}

export function ApocalypseJournal() {
  const { t } = useTranslation();
  const [events,  setEvents]  = useState<JournalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Relógio para atualizar timestamps a cada 30s sem refetch
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    apiGetJournal(30)
      .then(evs => setEvents(evs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJournalEvent = useCallback((data: unknown) => {
    const ev = data as JournalEvent;
    if (!ev?.id || !ev?.type) return;
    setEvents(prev => [ev, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useSse({ 'journal-event': handleJournalEvent });

  // Ref para scroll-to-top ao chegarem eventos novos via SSE
  const listRef = useRef<HTMLUListElement>(null);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <section className="apocalypse-journal" aria-label={t('journal.aria')}>
      <h2 className="aj-title">
        <i className="ti ti-news" aria-hidden="true" />
        {t('journal.title')}
      </h2>
      <ul className="aj-list" ref={listRef}>
        {events.map(ev => (
          <li key={ev.id} className={`aj-item aj-item-${ev.type}`}>
            <EventIcon type={ev.type} />
            <EventText ev={ev} />
            <span className="aj-time" title={ev.created_at}>
              {timeAgo(ev.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
