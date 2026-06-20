import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Entry } from '../types';

interface RankRowProps {
  entry:          Entry;
  rank:           number;
  onPlayerClick?: (playerId: number) => void;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Mapeia qualquer forma não-canônica → nome PT-BR canônico.
// Cobre: IDs em inglês (mod v1.7+, safety-net caso o decoder não traduza),
// abreviações do mod ≤v1.6.0, e eras de corrupção de encoding (U+FFFD e ý).
const U = '�';
const SKILL_FIX: Record<string, string> = {
  // ── IDs em inglês (mod v1.7+ exporta IDs; decoder traduz, mas safety-net aqui) ──
  Sprinting:    'Corrida',
  Lightfooted:  'Pés Leves',
  Nimble:       'Agilidade',
  Sneaking:     'Furtividade',
  Fitness:      'Condicionamento',
  Strength:     'Força',
  Axe:          'Machado',
  LongBlunt:    'Contundente Longo',
  ShortBlunt:   'Contundente Curto',
  LongBlade:    'Lâmina Longa',
  ShortBlade:   'Lâmina Curta',
  Spear:        'Lança',
  Maintenance:  'Manutenção',
  Aiming:       'Mira',
  Reloading:    'Recarga',
  Cooking:      'Culinária',
  Fishing:      'Pesca',
  Trapping:     'Armadilhas',
  Foraging:     'Coleta',
  FirstAid:     'Primeiros Socorros',
  Carpentry:    'Carpintaria',
  Agriculture:  'Agricultura',
  Electrical:   'Eletricidade',
  Mechanics:    'Mecânica',
  MetalWelding: 'Soldagem',
  Tailoring:    'Costura',
  Knapping:     'Lascamento',
  Carving:      'Entalhamento',
  Masonry:      'Alvenaria',
  Pottery:      'Cerâmica',
  Blacksmith:   'Ferraria',
  Glassmaking:  'Vidraria',
  AnimalCare:   'Cuidado Animal',
  Butchering:   'Abate',
  Tracking:     'Rastreamento',
  // ── Abreviações do mod ≤v1.6.0 ───────────────────────────
  'Cont. Longo': 'Contundente Longo',
  'Cont. Curto': 'Contundente Curto',
  // ── U+FFFD era (antes do fix Latin-1) ────────────────────
  [`Cer${U}mica`]:          'Cerâmica',
  [`Culin${U}ria`]:         'Culinária',
  [`For${U}a`]:             'Força',
  [`Lan${U}a`]:             'Lança',
  [`L${U}mina Longa`]:      'Lâmina Longa',
  [`L${U}mina Curta`]:      'Lâmina Curta',
  [`Manuten${U}${U}o`]:     'Manutenção',
  [`Mec${U}nica`]:          'Mecânica',
  [`P${U}s Leves`]:         'Pés Leves',
  // ── ý-corruption era ─────────────────────────────────────
  'Cesýmica':               'Cerâmica',
  'Culiiýria':              'Culinária',
  'Fouýa':                  'Força',
  'Lanýa':                  'Lança',
  'Lýmina Longa':           'Lâmina Longa',
  'Lýmina Curta':           'Lâmina Curta',
  'Manutenâýo':             'Manutenção',
  'Mebýnica':               'Mecânica',
};

// Categorias e ordem canônica das 35 habilidades (nomes PT-BR após tradução).
const SKILL_CATEGORIES = [
  {
    label:  'Física',
    skills: ['Agilidade', 'Condicionamento', 'Corrida', 'Força', 'Furtividade', 'Pés Leves'],
  },
  {
    label:  'Combate - Corpo a Corpo',
    skills: ['Contundente Curto', 'Contundente Longo', 'Lança', 'Lâmina Curta', 'Lâmina Longa', 'Machado', 'Manutenção'],
  },
  {
    label:  'Combate - Armas de Fogo',
    skills: ['Mira', 'Recarga'],
  },
  {
    label:  'Sobrevivência',
    skills: ['Armadilhas', 'Coleta', 'Pesca', 'Primeiros Socorros', 'Rastreamento'],
  },
  {
    label:  'Criação',
    skills: ['Alvenaria', 'Carpintaria', 'Cerâmica', 'Costura', 'Culinária', 'Eletricidade', 'Entalhamento', 'Ferraria', 'Lascamento', 'Mecânica', 'Soldagem', 'Vidraria'],
  },
  {
    label:  'Agricultura',
    skills: ['Abate', 'Agricultura', 'Cuidado Animal'],
  },
];

const TOTAL_SKILLS = 35;
const MAX_LEVEL    = 10;

function parseSkillMap(skillsStr: string | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!skillsStr) return map;
  for (const s of skillsStr.split(',')) {
    const t = s.trim();
    if (!t) continue;
    const lastSpace = t.lastIndexOf(' ');
    if (lastSpace === -1) continue;
    const rawName = t.slice(0, lastSpace);
    const name    = SKILL_FIX[rawName] ?? rawName;
    const level   = parseInt(t.slice(lastSpace + 1), 10);
    if (!isNaN(level)) map.set(name, level);
  }
  return map;
}

function SkillsPopup({ skillMap, top, left }: { skillMap: Map<string, number>; top: number; left: number }) {
  return createPortal(
    <div className="skills-popup" style={{ top, left }}>
      {SKILL_CATEGORIES.map(cat => (
        <div key={cat.label} className="scat">
          <div className="scat-label">{cat.label}</div>
          {cat.skills.map(name => {
            const level  = skillMap.get(name) ?? 0;
            const isMax  = level >= MAX_LEVEL;
            return (
              <div key={name} className={isMax ? 'srow srow-max' : 'srow'}>
                <span className="srow-name">{name}</span>
                <span className="srow-pips">
                  {Array.from({ length: MAX_LEVEL }, (_, i) => (
                    <span key={i} className={i < level ? 'pip pip-on' : 'pip pip-off'} />
                  ))}
                </span>
                <span className="srow-lvl">{level}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>,
    document.body,
  );
}

function SkillsCell({ skills }: { skills: string | null }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const ref             = useRef<HTMLSpanElement>(null);
  const closeTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skillMap = parseSkillMap(skills);
  const maxed    = Array.from(skillMap.values()).filter(l => l >= MAX_LEVEL).length;

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!skills || !ref.current) return;
    const r    = ref.current.getBoundingClientRect();
    const popH = 460;
    const top  = window.innerHeight - r.bottom > popH + 8
      ? r.bottom + 6
      : Math.max(4, r.top - popH - 6);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 298 - 8));
    setPos({ top, left });
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span
      ref={ref}
      className={`skills-counter${maxed > 0 ? ' has-maxed' : ''}${!skills ? ' skills-no-data' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {skills
        ? <>{String(maxed).padStart(2, '0')}<span className="skills-sep">/</span>{TOTAL_SKILLS}</>
        : '—'
      }
      {open && skills && <SkillsPopup skillMap={skillMap} top={pos.top} left={pos.left} />}
    </span>
  );
}

export function RankRow({ entry, rank, onPlayerClick }: RankRowProps) {
  return (
    <tr className={rank <= 3 ? `rank-top rank-${rank}` : ''}>
      <td className="rank-pos">{MEDALS[rank] ?? rank}</td>
      <td className="rank-name">
        <span className="char-name">{entry.character_name || entry.name}</span>
        {entry.profession && <span className="profession-badge">{entry.profession}</span>}
        {entry.player_id
          ? (
            <button
              className="player-alias player-alias-btn"
              onClick={() => onPlayerClick?.(entry.player_id!)}
              title="Ver perfil do jogador"
            >
              {entry.name}
            </button>
          )
          : <span className="player-alias">{entry.name}</span>
        }
      </td>
      <td className="rank-alive">
        {entry.is_alive
          ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
          : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>
        }
      </td>
      <td className="rank-score">{(entry.score ?? 0).toLocaleString('pt-BR')}</td>
      <td className="rank-days">{entry.days}d</td>
      <td className="rank-time">{entry.time_str ?? '—'}</td>
      <td className="rank-kills">{entry.kills.toLocaleString('pt-BR')}</td>
      <td className="rank-skills">
        <SkillsCell skills={entry.skills} />
      </td>
      <td className="rank-proof">
        {entry.live_url && (
          <a href={entry.live_url} target="_blank" rel="noopener noreferrer"
            className="proof-link" aria-label="Link da live">
            <i className="ti ti-brand-twitch" aria-hidden="true" />
          </a>
        )}
      </td>
    </tr>
  );
}
