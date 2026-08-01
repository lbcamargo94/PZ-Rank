-- Migration 009: marcos de kills + conquistas de skill por nível
-- 8 marcos de kills (500 → 800k, objetivo do campeonato)
-- 35 skills × 4 níveis (3=bronze, 5=silver, 7=gold, 10=platinum) = 140 conquistas
-- Total: 75 existentes + 148 novas = 223 conquistas
-- Run on Supabase SQL editor

-- ── 1. Renomeia chave JSONB kills_500k → kills_800k em todas as entries ───
UPDATE entries
SET objectives = (objectives - 'kills_500k')
              || jsonb_build_object('kills_800k', COALESCE(objectives -> 'kills_500k', 'false'::jsonb))
WHERE objectives ? 'kills_500k';

-- ── 2. Conquistas ─────────────────────────────────────────────────────────
INSERT INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES

  -- ── Marcos de Kills ──────────────────────────────────────────────────────
  ('kill-500',    'Batismo de Sangue',     '500 zumbis mortos',     '🩸', 'bronze',   'kills',    500),
  ('kill-5k',     'Caçador de Elite',      '5.000 zumbis mortos',   '⚔️', 'silver',   'kills',   5000),
  ('kill-25k',    'Implacável',            '25.000 zumbis mortos',  '💀', 'gold',     'kills',  25000),
  ('kill-50k',    'Destruidor',            '50.000 zumbis mortos',  '☠️', 'gold',     'kills',  50000),
  ('kill-100k',   'Genocida',              '100.000 zumbis mortos', '💣', 'platinum', 'kills', 100000),
  ('kill-250k',   'Flagelo dos Mortos',    '250.000 zumbis mortos', '🔥', 'platinum', 'kills', 250000),
  ('kill-500k',   'Aniquilador',           '500.000 zumbis mortos', '☠️', 'platinum', 'kills', 500000),
  ('kill-800k',   'Exterminador Lendário', '800.000 zumbis mortos — objetivo máximo do campeonato', '👑', 'legendary', 'kills', 800000),

  -- ── Skills — Física ──────────────────────────────────────────────────────
  -- Corrida (Sprinting)
  ('sk-sprinting-3',  'Corrida Nível 3',       'Corrida nível 3',           '🏃', 'bronze',   'skill_sprinting', 3),
  ('sk-sprinting-5',  'Corrida Nível 5',       'Corrida nível 5',           '🏃', 'silver',   'skill_sprinting', 5),
  ('sk-sprinting-7',  'Corrida Nível 7',       'Corrida nível 7',           '🏃', 'gold',     'skill_sprinting', 7),
  ('sk-sprinting-10', 'Pernas de Aço',         'Corrida nível 10',          '🏃', 'platinum', 'skill_sprinting', 10),
  -- Pés Leves (Lightfoot)
  ('sk-lightfoot-3',  'Pés Leves Nível 3',     'Pés Leves nível 3',         '🌫️', 'bronze',   'skill_lightfoot', 3),
  ('sk-lightfoot-5',  'Pés Leves Nível 5',     'Pés Leves nível 5',         '🌫️', 'silver',   'skill_lightfoot', 5),
  ('sk-lightfoot-7',  'Pés Leves Nível 7',     'Pés Leves nível 7',         '🌫️', 'gold',     'skill_lightfoot', 7),
  ('sk-lightfoot-10', 'Passo Silencioso',       'Pés Leves nível 10',        '🌫️', 'platinum', 'skill_lightfoot', 10),
  -- Agilidade (Nimble)
  ('sk-nimble-3',     'Agilidade Nível 3',     'Agilidade nível 3',         '💨', 'bronze',   'skill_nimble', 3),
  ('sk-nimble-5',     'Agilidade Nível 5',     'Agilidade nível 5',         '💨', 'silver',   'skill_nimble', 5),
  ('sk-nimble-7',     'Agilidade Nível 7',     'Agilidade nível 7',         '💨', 'gold',     'skill_nimble', 7),
  ('sk-nimble-10',    'Esquivo',               'Agilidade nível 10',        '💨', 'platinum', 'skill_nimble', 10),
  -- Furtividade (Sneak)
  ('sk-sneak-3',      'Furtividade Nível 3',   'Furtividade nível 3',       '🥷', 'bronze',   'skill_sneak', 3),
  ('sk-sneak-5',      'Furtividade Nível 5',   'Furtividade nível 5',       '🥷', 'silver',   'skill_sneak', 5),
  ('sk-sneak-7',      'Furtividade Nível 7',   'Furtividade nível 7',       '🥷', 'gold',     'skill_sneak', 7),
  ('sk-sneak-10',     'Sombra',                'Furtividade nível 10',      '🥷', 'platinum', 'skill_sneak', 10),
  -- Aptidão Física (Fitness)
  ('sk-fitness-3',    'Aptidão Física Nível 3','Aptidão Física nível 3',    '💪', 'bronze',   'skill_fitness', 3),
  ('sk-fitness-5',    'Aptidão Física Nível 5','Aptidão Física nível 5',    '💪', 'silver',   'skill_fitness', 5),
  ('sk-fitness-7',    'Aptidão Física Nível 7','Aptidão Física nível 7',    '💪', 'gold',     'skill_fitness', 7),
  ('sk-fitness-10',   'Condicionado',          'Aptidão Física nível 10',   '💪', 'platinum', 'skill_fitness', 10),
  -- Força (Strength)
  ('sk-strength-3',   'Força Nível 3',         'Força nível 3',             '🏋️', 'bronze',   'skill_strength', 3),
  ('sk-strength-5',   'Força Nível 5',         'Força nível 5',             '🏋️', 'silver',   'skill_strength', 5),
  ('sk-strength-7',   'Força Nível 7',         'Força nível 7',             '🏋️', 'gold',     'skill_strength', 7),
  ('sk-strength-10',  'Colosso',               'Força nível 10',            '🏋️', 'platinum', 'skill_strength', 10),

  -- ── Skills — Combate ─────────────────────────────────────────────────────
  -- Machado (Axe)
  ('sk-axe-3',        'Machado Nível 3',            'Machado nível 3',            '🪓', 'bronze',   'skill_axe', 3),
  ('sk-axe-5',        'Machado Nível 5',            'Machado nível 5',            '🪓', 'silver',   'skill_axe', 5),
  ('sk-axe-7',        'Machado Nível 7',            'Machado nível 7',            '🪓', 'gold',     'skill_axe', 7),
  ('sk-axe-10',       'Mestre do Machado',          'Machado nível 10',           '🪓', 'platinum', 'skill_axe', 10),
  -- Contundente Longo (Blunt)
  ('sk-blunt-3',      'Contundente Nível 3',        'Contundente Longo nível 3',  '🔨', 'bronze',   'skill_blunt', 3),
  ('sk-blunt-5',      'Contundente Nível 5',        'Contundente Longo nível 5',  '🔨', 'silver',   'skill_blunt', 5),
  ('sk-blunt-7',      'Contundente Nível 7',        'Contundente Longo nível 7',  '🔨', 'gold',     'skill_blunt', 7),
  ('sk-blunt-10',     'Esmagador',                  'Contundente Longo nível 10', '🔨', 'platinum', 'skill_blunt', 10),
  -- Contundente Curto (SmallBlunt)
  ('sk-smallblunt-3', 'Cont. Curto Nível 3',        'Contundente Curto nível 3',  '🪃', 'bronze',   'skill_smallblunt', 3),
  ('sk-smallblunt-5', 'Cont. Curto Nível 5',        'Contundente Curto nível 5',  '🪃', 'silver',   'skill_smallblunt', 5),
  ('sk-smallblunt-7', 'Cont. Curto Nível 7',        'Contundente Curto nível 7',  '🪃', 'gold',     'skill_smallblunt', 7),
  ('sk-smallblunt-10','Golpe Preciso',               'Contundente Curto nível 10', '🪃', 'platinum', 'skill_smallblunt', 10),
  -- Lâmina Longa (LongBlade)
  ('sk-longblade-3',  'Lâmina Longa Nível 3',       'Lâmina Longa nível 3',       '⚔️', 'bronze',   'skill_longblade', 3),
  ('sk-longblade-5',  'Lâmina Longa Nível 5',       'Lâmina Longa nível 5',       '⚔️', 'silver',   'skill_longblade', 5),
  ('sk-longblade-7',  'Lâmina Longa Nível 7',       'Lâmina Longa nível 7',       '⚔️', 'gold',     'skill_longblade', 7),
  ('sk-longblade-10', 'Espadachim',                 'Lâmina Longa nível 10',      '⚔️', 'platinum', 'skill_longblade', 10),
  -- Lâmina Curta (SmallBlade)
  ('sk-smallblade-3', 'Lâmina Curta Nível 3',       'Lâmina Curta nível 3',       '🗡️', 'bronze',   'skill_smallblade', 3),
  ('sk-smallblade-5', 'Lâmina Curta Nível 5',       'Lâmina Curta nível 5',       '🗡️', 'silver',   'skill_smallblade', 5),
  ('sk-smallblade-7', 'Lâmina Curta Nível 7',       'Lâmina Curta nível 7',       '🗡️', 'gold',     'skill_smallblade', 7),
  ('sk-smallblade-10','Lâmina Veloz',                'Lâmina Curta nível 10',      '🗡️', 'platinum', 'skill_smallblade', 10),
  -- Lança (Spear)
  ('sk-spear-3',      'Lança Nível 3',              'Lança nível 3',              '🏹', 'bronze',   'skill_spear', 3),
  ('sk-spear-5',      'Lança Nível 5',              'Lança nível 5',              '🏹', 'silver',   'skill_spear', 5),
  ('sk-spear-7',      'Lança Nível 7',              'Lança nível 7',              '🏹', 'gold',     'skill_spear', 7),
  ('sk-spear-10',     'Lanceiro',                   'Lança nível 10',             '🏹', 'platinum', 'skill_spear', 10),
  -- Manutenção (Maintenance)
  ('sk-maintenance-3', 'Manutenção Nível 3',        'Manutenção nível 3',         '🔧', 'bronze',   'skill_maintenance', 3),
  ('sk-maintenance-5', 'Manutenção Nível 5',        'Manutenção nível 5',         '🔧', 'silver',   'skill_maintenance', 5),
  ('sk-maintenance-7', 'Manutenção Nível 7',        'Manutenção nível 7',         '🔧', 'gold',     'skill_maintenance', 7),
  ('sk-maintenance-10','Zelador',                   'Manutenção nível 10',        '🔧', 'platinum', 'skill_maintenance', 10),

  -- ── Skills — Armas de Fogo ────────────────────────────────────────────────
  -- Mira (Aiming)
  ('sk-aiming-3',     'Mira Nível 3',              'Mira nível 3',               '🎯', 'bronze',   'skill_aiming', 3),
  ('sk-aiming-5',     'Mira Nível 5',              'Mira nível 5',               '🎯', 'silver',   'skill_aiming', 5),
  ('sk-aiming-7',     'Mira Nível 7',              'Mira nível 7',               '🎯', 'gold',     'skill_aiming', 7),
  ('sk-aiming-10',    'Franco-Atirador',            'Mira nível 10',              '🎯', 'platinum', 'skill_aiming', 10),
  -- Recarga (Reloading)
  ('sk-reloading-3',  'Recarga Nível 3',            'Recarga nível 3',            '🔫', 'bronze',   'skill_reloading', 3),
  ('sk-reloading-5',  'Recarga Nível 5',            'Recarga nível 5',            '🔫', 'silver',   'skill_reloading', 5),
  ('sk-reloading-7',  'Recarga Nível 7',            'Recarga nível 7',            '🔫', 'gold',     'skill_reloading', 7),
  ('sk-reloading-10', 'Armeiro',                    'Recarga nível 10',           '🔫', 'platinum', 'skill_reloading', 10),

  -- ── Skills — Profissões ───────────────────────────────────────────────────
  -- Marcenaria (Woodwork)
  ('sk-woodwork-3',   'Marcenaria Nível 3',         'Marcenaria nível 3',         '🪵', 'bronze',   'skill_woodwork', 3),
  ('sk-woodwork-5',   'Marcenaria Nível 5',         'Marcenaria nível 5',         '🪵', 'silver',   'skill_woodwork', 5),
  ('sk-woodwork-7',   'Marcenaria Nível 7',         'Marcenaria nível 7',         '🪵', 'gold',     'skill_woodwork', 7),
  ('sk-woodwork-10',  'Mestre da Madeira',          'Marcenaria nível 10',        '🪵', 'platinum', 'skill_woodwork', 10),
  -- Eletricidade (Electricity)
  ('sk-electricity-3', 'Eletricidade Nível 3',      'Eletricidade nível 3',       '⚡', 'bronze',   'skill_electricity', 3),
  ('sk-electricity-5', 'Eletricidade Nível 5',      'Eletricidade nível 5',       '⚡', 'silver',   'skill_electricity', 5),
  ('sk-electricity-7', 'Eletricidade Nível 7',      'Eletricidade nível 7',       '⚡', 'gold',     'skill_electricity', 7),
  ('sk-electricity-10','Técnico Elétrico',           'Eletricidade nível 10',      '⚡', 'platinum', 'skill_electricity', 10),
  -- Soldagem (MetalWelding)
  ('sk-metalwelding-3', 'Soldagem Nível 3',         'Soldagem nível 3',           '🔩', 'bronze',   'skill_metalwelding', 3),
  ('sk-metalwelding-5', 'Soldagem Nível 5',         'Soldagem nível 5',           '🔩', 'silver',   'skill_metalwelding', 5),
  ('sk-metalwelding-7', 'Soldagem Nível 7',         'Soldagem nível 7',           '🔩', 'gold',     'skill_metalwelding', 7),
  ('sk-metalwelding-10','Soldador Mestre',           'Soldagem nível 10',          '🔩', 'platinum', 'skill_metalwelding', 10),
  -- Mecânica (Mechanics)
  ('sk-mechanics-3',  'Mecânica Nível 3',           'Mecânica nível 3',           '⚙️', 'bronze',   'skill_mechanics', 3),
  ('sk-mechanics-5',  'Mecânica Nível 5',           'Mecânica nível 5',           '⚙️', 'silver',   'skill_mechanics', 5),
  ('sk-mechanics-7',  'Mecânica Nível 7',           'Mecânica nível 7',           '⚙️', 'gold',     'skill_mechanics', 7),
  ('sk-mechanics-10', 'Mecânico',                   'Mecânica nível 10',          '⚙️', 'platinum', 'skill_mechanics', 10),
  -- Costura (Tailoring)
  ('sk-tailoring-3',  'Costura Nível 3',            'Costura nível 3',            '🧵', 'bronze',   'skill_tailoring', 3),
  ('sk-tailoring-5',  'Costura Nível 5',            'Costura nível 5',            '🧵', 'silver',   'skill_tailoring', 5),
  ('sk-tailoring-7',  'Costura Nível 7',            'Costura nível 7',            '🧵', 'gold',     'skill_tailoring', 7),
  ('sk-tailoring-10', 'Costureiro',                 'Costura nível 10',           '🧵', 'platinum', 'skill_tailoring', 10),

  -- ── Skills — Sobrevivência ────────────────────────────────────────────────
  -- Culinária (Cooking)
  ('sk-cooking-3',    'Culinária Nível 3',          'Culinária nível 3',          '🍳', 'bronze',   'skill_cooking', 3),
  ('sk-cooking-5',    'Culinária Nível 5',          'Culinária nível 5',          '🍳', 'silver',   'skill_cooking', 5),
  ('sk-cooking-7',    'Culinária Nível 7',          'Culinária nível 7',          '🍳', 'gold',     'skill_cooking', 7),
  ('sk-cooking-10',   'Chefe de Cozinha',           'Culinária nível 10',         '🍳', 'platinum', 'skill_cooking', 10),
  -- Agricultura (Farming)
  ('sk-farming-3',    'Agricultura Nível 3',        'Agricultura nível 3',        '🌾', 'bronze',   'skill_farming', 3),
  ('sk-farming-5',    'Agricultura Nível 5',        'Agricultura nível 5',        '🌾', 'silver',   'skill_farming', 5),
  ('sk-farming-7',    'Agricultura Nível 7',        'Agricultura nível 7',        '🌾', 'gold',     'skill_farming', 7),
  ('sk-farming-10',   'Mestre da Lavoura',          'Agricultura nível 10',       '🌾', 'platinum', 'skill_farming', 10),
  -- Primeiros Socorros (Doctor)
  ('sk-doctor-3',     'Primeiros Socorros Nível 3', 'Primeiros Socorros nível 3', '🩺', 'bronze',   'skill_doctor', 3),
  ('sk-doctor-5',     'Primeiros Socorros Nível 5', 'Primeiros Socorros nível 5', '🩺', 'silver',   'skill_doctor', 5),
  ('sk-doctor-7',     'Primeiros Socorros Nível 7', 'Primeiros Socorros nível 7', '🩺', 'gold',     'skill_doctor', 7),
  ('sk-doctor-10',    'Médico de Campo',            'Primeiros Socorros nível 10','🩺', 'platinum', 'skill_doctor', 10),
  -- Pescaria (Fishing)
  ('sk-fishing-3',    'Pescaria Nível 3',           'Pescaria nível 3',           '🎣', 'bronze',   'skill_fishing', 3),
  ('sk-fishing-5',    'Pescaria Nível 5',           'Pescaria nível 5',           '🎣', 'silver',   'skill_fishing', 5),
  ('sk-fishing-7',    'Pescaria Nível 7',           'Pescaria nível 7',           '🎣', 'gold',     'skill_fishing', 7),
  ('sk-fishing-10',   'Grande Pescador',            'Pescaria nível 10',          '🎣', 'platinum', 'skill_fishing', 10),
  -- Armadilhas (Trapping)
  ('sk-trapping-3',   'Armadilhas Nível 3',         'Armadilhas nível 3',         '🪤', 'bronze',   'skill_trapping', 3),
  ('sk-trapping-5',   'Armadilhas Nível 5',         'Armadilhas nível 5',         '🪤', 'silver',   'skill_trapping', 5),
  ('sk-trapping-7',   'Armadilhas Nível 7',         'Armadilhas nível 7',         '🪤', 'gold',     'skill_trapping', 7),
  ('sk-trapping-10',  'Mestre das Armadilhas',      'Armadilhas nível 10',        '🪤', 'platinum', 'skill_trapping', 10),
  -- Coleta (PlantScavenging)
  ('sk-plantscavenging-3', 'Coleta Nível 3',        'Coleta nível 3',             '🌿', 'bronze',   'skill_plantscavenging', 3),
  ('sk-plantscavenging-5', 'Coleta Nível 5',        'Coleta nível 5',             '🌿', 'silver',   'skill_plantscavenging', 5),
  ('sk-plantscavenging-7', 'Coleta Nível 7',        'Coleta nível 7',             '🌿', 'gold',     'skill_plantscavenging', 7),
  ('sk-plantscavenging-10','Mestre da Coleta',       'Coleta nível 10',            '🌿', 'platinum', 'skill_plantscavenging', 10),

  -- ── Skills — Build 42 ─────────────────────────────────────────────────────
  -- Lascamento (FlintKnapping)
  ('sk-flintknapping-3',  'Lascamento Nível 3',     'Lascamento nível 3',         '🪨', 'bronze',   'skill_flintknapping', 3),
  ('sk-flintknapping-5',  'Lascamento Nível 5',     'Lascamento nível 5',         '🪨', 'silver',   'skill_flintknapping', 5),
  ('sk-flintknapping-7',  'Lascamento Nível 7',     'Lascamento nível 7',         '🪨', 'gold',     'skill_flintknapping', 7),
  ('sk-flintknapping-10', 'Lascador',               'Lascamento nível 10',        '🪨', 'platinum', 'skill_flintknapping', 10),
  -- Entalhamento (Carving)
  ('sk-carving-3',    'Entalhamento Nível 3',       'Entalhamento nível 3',       '🔪', 'bronze',   'skill_carving', 3),
  ('sk-carving-5',    'Entalhamento Nível 5',       'Entalhamento nível 5',       '🔪', 'silver',   'skill_carving', 5),
  ('sk-carving-7',    'Entalhamento Nível 7',       'Entalhamento nível 7',       '🔪', 'gold',     'skill_carving', 7),
  ('sk-carving-10',   'Entalhador',                 'Entalhamento nível 10',      '🔪', 'platinum', 'skill_carving', 10),
  -- Alvenaria (Masonry)
  ('sk-masonry-3',    'Alvenaria Nível 3',          'Alvenaria nível 3',          '🧱', 'bronze',   'skill_masonry', 3),
  ('sk-masonry-5',    'Alvenaria Nível 5',          'Alvenaria nível 5',          '🧱', 'silver',   'skill_masonry', 5),
  ('sk-masonry-7',    'Alvenaria Nível 7',          'Alvenaria nível 7',          '🧱', 'gold',     'skill_masonry', 7),
  ('sk-masonry-10',   'Mestre da Alvenaria',        'Alvenaria nível 10',         '🧱', 'platinum', 'skill_masonry', 10),
  -- Cerâmica (Pottery)
  ('sk-pottery-3',    'Cerâmica Nível 3',           'Cerâmica nível 3',           '🏺', 'bronze',   'skill_pottery', 3),
  ('sk-pottery-5',    'Cerâmica Nível 5',           'Cerâmica nível 5',           '🏺', 'silver',   'skill_pottery', 5),
  ('sk-pottery-7',    'Cerâmica Nível 7',           'Cerâmica nível 7',           '🏺', 'gold',     'skill_pottery', 7),
  ('sk-pottery-10',   'Ceramista',                  'Cerâmica nível 10',          '🏺', 'platinum', 'skill_pottery', 10),
  -- Forja (Blacksmith)
  ('sk-blacksmith-3', 'Forja Nível 3',              'Forja nível 3',              '🔥', 'bronze',   'skill_blacksmith', 3),
  ('sk-blacksmith-5', 'Forja Nível 5',              'Forja nível 5',              '🔥', 'silver',   'skill_blacksmith', 5),
  ('sk-blacksmith-7', 'Forja Nível 7',              'Forja nível 7',              '🔥', 'gold',     'skill_blacksmith', 7),
  ('sk-blacksmith-10','Grande Ferreiro',             'Forja nível 10',             '🔥', 'platinum', 'skill_blacksmith', 10),
  -- Vidraria (Glassmaking)
  ('sk-glassmaking-3', 'Vidraria Nível 3',          'Vidraria nível 3',           '🫙', 'bronze',   'skill_glassmaking', 3),
  ('sk-glassmaking-5', 'Vidraria Nível 5',          'Vidraria nível 5',           '🫙', 'silver',   'skill_glassmaking', 5),
  ('sk-glassmaking-7', 'Vidraria Nível 7',          'Vidraria nível 7',           '🫙', 'gold',     'skill_glassmaking', 7),
  ('sk-glassmaking-10','Vidreiro',                  'Vidraria nível 10',          '🫙', 'platinum', 'skill_glassmaking', 10),
  -- Pecuária (Husbandry)
  ('sk-husbandry-3',  'Pecuária Nível 3',           'Pecuária nível 3',           '🐄', 'bronze',   'skill_husbandry', 3),
  ('sk-husbandry-5',  'Pecuária Nível 5',           'Pecuária nível 5',           '🐄', 'silver',   'skill_husbandry', 5),
  ('sk-husbandry-7',  'Pecuária Nível 7',           'Pecuária nível 7',           '🐄', 'gold',     'skill_husbandry', 7),
  ('sk-husbandry-10', 'Mestre da Pecuária',         'Pecuária nível 10',          '🐄', 'platinum', 'skill_husbandry', 10),
  -- Abate (Butchering)
  ('sk-butchering-3', 'Abate Nível 3',              'Abate nível 3',              '🥩', 'bronze',   'skill_butchering', 3),
  ('sk-butchering-5', 'Abate Nível 5',              'Abate nível 5',              '🥩', 'silver',   'skill_butchering', 5),
  ('sk-butchering-7', 'Abate Nível 7',              'Abate nível 7',              '🥩', 'gold',     'skill_butchering', 7),
  ('sk-butchering-10','Mestre do Abate',             'Abate nível 10',             '🥩', 'platinum', 'skill_butchering', 10),
  -- Rastreamento (Tracking)
  ('sk-tracking-3',   'Rastreamento Nível 3',       'Rastreamento nível 3',       '🐾', 'bronze',   'skill_tracking', 3),
  ('sk-tracking-5',   'Rastreamento Nível 5',       'Rastreamento nível 5',       '🐾', 'silver',   'skill_tracking', 5),
  ('sk-tracking-7',   'Rastreamento Nível 7',       'Rastreamento nível 7',       '🐾', 'gold',     'skill_tracking', 7),
  ('sk-tracking-10',  'Mestre do Rastreio',         'Rastreamento nível 10',      '🐾', 'platinum', 'skill_tracking', 10)

ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon        = EXCLUDED.icon,
  tier        = EXCLUDED.tier,
  stat        = EXCLUDED.stat,
  threshold   = EXCLUDED.threshold;
