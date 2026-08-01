-- Migration 009: marcos de kills + conquistas de skill nível 10
-- 8 novos marcos de kills (500 → 800k, objetivo máximo do campeonato) + 35 conquistas individuais de skill nível 10
-- Total: 75 existentes + 43 novas = 118 conquistas
-- Run on Supabase SQL editor

-- ── 1. Renomeia chave JSONB kills_500k → kills_800k em todas as entries ───
-- Copia o valor, remove a chave antiga; entradas sem a chave não são afetadas.
UPDATE entries
SET objectives = (objectives - 'kills_500k')
              || jsonb_build_object('kills_800k', COALESCE(objectives -> 'kills_500k', 'false'::jsonb))
WHERE objectives ? 'kills_500k';

-- ── 2. Conquistas ─────────────────────────────────────────────────────────

INSERT INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES

  -- ── Marcos de Kills ──────────────────────────────────────────
  -- Distribui marcos entre os existentes (100, 1k, 10k) e estende até o objetivo do campeonato (800k)
  ('kill-500',    'Batismo de Sangue',  '500 zumbis mortos',      '🩸', 'bronze',   'kills',    500),
  ('kill-5k',     'Caçador de Elite',   '5.000 zumbis mortos',    '⚔️', 'silver',   'kills',   5000),
  ('kill-25k',    'Implacável',         '25.000 zumbis mortos',   '💀', 'gold',     'kills',  25000),
  ('kill-50k',    'Destruidor',         '50.000 zumbis mortos',   '☠️', 'gold',     'kills',  50000),
  ('kill-100k',   'Genocida',           '100.000 zumbis mortos',  '💣', 'platinum', 'kills', 100000),
  ('kill-250k',   'Flagelo dos Mortos', '250.000 zumbis mortos',  '🔥', 'platinum', 'kills', 250000),
  ('kill-500k',   'Aniquilador',        '500.000 zumbis mortos',  '☠️', 'platinum', 'kills', 500000),
  ('kill-800k',   'Exterminador Lendário', '800.000 zumbis mortos — objetivo máximo do campeonato', '👑', 'legendary', 'kills', 800000),

  -- ── Skills — Física ──────────────────────────────────────────
  ('sk-sprinting',     'Pernas de Aço',        'Corrida nível 10',           '🏃', 'silver', 'skill_sprinting',     10),
  ('sk-lightfoot',     'Passo Silencioso',      'Pés Leves nível 10',         '🌫️', 'silver', 'skill_lightfoot',     10),
  ('sk-nimble',        'Esquivo',               'Agilidade nível 10',         '💨', 'silver', 'skill_nimble',        10),
  ('sk-sneak',         'Sombra',                'Furtividade nível 10',       '🥷', 'silver', 'skill_sneak',         10),
  ('sk-fitness',       'Condicionado',          'Aptidão Física nível 10',    '💪', 'silver', 'skill_fitness',       10),
  ('sk-strength',      'Colosso',               'Força nível 10',             '🏋️', 'silver', 'skill_strength',      10),

  -- ── Skills — Combate ─────────────────────────────────────────
  ('sk-axe',           'Mestre do Machado',     'Machado nível 10',           '🪓', 'silver', 'skill_axe',           10),
  ('sk-blunt',         'Esmagador',             'Contundente Longo nível 10', '🔨', 'silver', 'skill_blunt',         10),
  ('sk-smallblunt',    'Golpe Preciso',         'Contundente Curto nível 10', '🪃', 'silver', 'skill_smallblunt',    10),
  ('sk-longblade',     'Espadachim',            'Lâmina Longa nível 10',      '⚔️', 'silver', 'skill_longblade',     10),
  ('sk-smallblade',    'Lâmina Veloz',          'Lâmina Curta nível 10',      '🗡️', 'silver', 'skill_smallblade',    10),
  ('sk-spear',         'Lanceiro',              'Lança nível 10',             '🏹', 'silver', 'skill_spear',         10),
  ('sk-maintenance',   'Zelador',               'Manutenção nível 10',        '🔧', 'silver', 'skill_maintenance',   10),

  -- ── Skills — Armas de Fogo ───────────────────────────────────
  ('sk-aiming',        'Franco-Atirador',       'Mira nível 10',              '🎯', 'silver', 'skill_aiming',        10),
  ('sk-reloading',     'Armeiro',               'Recarga nível 10',           '🔫', 'silver', 'skill_reloading',     10),

  -- ── Skills — Profissões ──────────────────────────────────────
  ('sk-woodwork',      'Mestre da Madeira',     'Marcenaria nível 10',        '🪵', 'silver', 'skill_woodwork',      10),
  ('sk-electricity',   'Técnico Elétrico',      'Eletricidade nível 10',      '⚡', 'silver', 'skill_electricity',   10),
  ('sk-metalwelding',  'Soldador Mestre',       'Soldagem nível 10',          '🔩', 'silver', 'skill_metalwelding',  10),
  ('sk-mechanics',     'Mecânico',              'Mecânica nível 10',          '⚙️', 'silver', 'skill_mechanics',     10),
  ('sk-tailoring',     'Costureiro',            'Costura nível 10',           '🧵', 'silver', 'skill_tailoring',     10),

  -- ── Skills — Sobrevivência ───────────────────────────────────
  ('sk-cooking',       'Chefe de Cozinha',      'Culinária nível 10',         '🍳', 'silver', 'skill_cooking',       10),
  ('sk-farming',       'Mestre da Lavoura',     'Agricultura nível 10',       '🌾', 'silver', 'skill_farming',       10),
  ('sk-doctor',        'Médico de Campo',       'Primeiros Socorros nível 10','🩺', 'silver', 'skill_doctor',        10),
  ('sk-fishing',       'Grande Pescador',       'Pescaria nível 10',          '🎣', 'silver', 'skill_fishing',       10),
  ('sk-trapping',      'Mestre das Armadilhas', 'Armadilhas nível 10',        '🪤', 'silver', 'skill_trapping',      10),
  ('sk-plantscavenging','Mestre da Coleta',     'Coleta nível 10',            '🌿', 'silver', 'skill_plantscavenging',10),

  -- ── Skills — Build 42 ────────────────────────────────────────
  ('sk-flintknapping', 'Lascador',              'Lascamento nível 10',        '🪨', 'silver', 'skill_flintknapping', 10),
  ('sk-carving',       'Entalhador',            'Entalhamento nível 10',      '🔪', 'silver', 'skill_carving',       10),
  ('sk-masonry',       'Mestre da Alvenaria',   'Alvenaria nível 10',         '🧱', 'silver', 'skill_masonry',       10),
  ('sk-pottery',       'Ceramista',             'Cerâmica nível 10',          '🏺', 'silver', 'skill_pottery',       10),
  ('sk-blacksmith',    'Grande Ferreiro',       'Forja nível 10',             '🔥', 'silver', 'skill_blacksmith',    10),
  ('sk-glassmaking',   'Vidreiro',              'Vidraria nível 10',          '🫙', 'silver', 'skill_glassmaking',   10),
  ('sk-husbandry',     'Mestre da Pecuária',    'Pecuária nível 10',          '🐄', 'silver', 'skill_husbandry',     10),
  ('sk-butchering',    'Mestre do Abate',       'Abate nível 10',             '🥩', 'silver', 'skill_butchering',    10),
  ('sk-tracking',      'Mestre do Rastreio',    'Rastreamento nível 10',      '🐾', 'silver', 'skill_tracking',      10)

ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon        = EXCLUDED.icon,
  tier        = EXCLUDED.tier,
  stat        = EXCLUDED.stat,
  threshold   = EXCLUDED.threshold;
