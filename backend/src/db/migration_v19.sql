-- migration v19: conquistas — 5 raridades (platinum/legendary) + 75 achievements

-- 1. Expandir o constraint de tier
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_tier_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_tier_check
  CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary'));

-- 2. Corrigir tiers/thresholds de conquistas existentes
UPDATE achievements SET tier = 'bronze', icon = '🍖'
  WHERE slug = 'hunter'     AND tier = 'bronze'; -- icon update only (sem mudança de tier)
UPDATE achievements SET tier = 'bronze'
  WHERE slug = 'insomniac'  AND tier = 'silver';
UPDATE achievements SET tier = 'silver'
  WHERE slug = 'big-game'   AND tier = 'gold';
UPDATE achievements SET tier = 'silver'
  WHERE slug = 'engineer'   AND tier = 'gold';
UPDATE achievements SET threshold = 500, description = '500 colheitas'
  WHERE slug = 'agronomist' AND threshold = 200;

-- 3. Inserir as 56 novas conquistas (INSERT … ON CONFLICT DO NOTHING é idempotente)
INSERT INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES
  -- BRONZE novos
  ('big-harvest',    'Colheita Farta',     'Colha 200 vegetais',                '🥔', 'bronze', 'crops_harvested',     200),
  ('egg-collector',  'Primeiros Ovos',     'Colete 30 ovos',                    '🥚', 'bronze', 'eggs_collected',       30),
  ('milkman',        'Ordenhador',         'Produza leite pela 1ª vez',         '🥛', 'bronze', 'milk_produced',         1),
  ('gardener',       'Mãos à Terra',       'Plante 100 culturas',               '🌱', 'bronze', 'crops_planted',       100),
  ('carpenter',      'Carpinteiro',        'Construa 100 estruturas',           '🪓', 'bronze', 'structures_built',    100),
  ('mason',          'Pedreiro',           'Construa 50 estruturas de pedra',   '🧱', 'bronze', 'stone_structures',     50),
  ('potter',         'Oleiro',             'Produza 20 itens de cerâmica',      '🏺', 'bronze', 'ceramic_items',        20),
  ('smith-novice',   'Ferreiro Iniciante', 'Produza sua 1ª arma forjada',       '🔥', 'bronze', 'forged_weapons',        1),
  ('driver',         'Motorista',          'Percorra 500 km',                   '🚗', 'bronze', 'km_driven',           500),
  ('explorer',       'Explorador',         'Visite 5 cidades',                  '🗺️', 'bronze', 'cities_visited',        5),
  ('spiffo-customer','Cliente do Spiffo',  'Visite um restaurante Spiffo',      '🦝', 'bronze', 'spiffo_visited',        1),
  ('recruit',        'Recruta',            'Entre na Base Militar',             '🪖', 'bronze', 'military_visited',      1),
  ('cook',           'Cozinheiro',         'Prepare 100 refeições',             '🍳', 'bronze', 'meals_cooked',        100),
  ('water-collector','Sobrevivente',       'Colete 500 litros de água',         '💧', 'bronze', 'water_collected',     500),
  ('lumberjack',     'Lenhador',           'Corte 500 árvores',                 '🪵', 'bronze', 'trees_cut',           500),
  ('craftsman',      'Artesão',            'Produza 500 materiais',             '⚒️', 'bronze', 'materials_crafted',   500),
  ('tracker',        'Rastreador',         'Siga 50 rastros de animais',        '🐾', 'bronze', 'animal_tracks',        50),
  -- PRATA novos
  ('colonizer',        'Colonizador',          'Construa 5 bases',              '🏠', 'silver', 'bases_built',           5),
  ('trucker',          'Caminhoneiro',         'Percorra 2.000 km',             '🚛', 'silver', 'km_driven',          2000),
  ('master-lumberjack','Lenhador Mestre',      'Corte 5.000 árvores',           '🌲', 'silver', 'trees_cut',          5000),
  ('cheesemaker',      'Fazendeiro Rural',     'Produza queijo',                '🧀', 'silver', 'cheese_produced',       1),
  ('butcher',          'Açougueiro',           '200 animais abatidos p/ carne', '🥩', 'silver', 'meat_butchered',      200),
  ('breeder',          'Criador',              '4 espécies de animais',         '🐑', 'silver', 'animal_species',        4),
  ('nomad',            'Nômade',               'Durma em 30 locais diferentes', '🏕️', 'silver', 'sleep_locations',      30),
  ('kentucky-explorer','Explorador de Kentucky','Visite todas as cidades',      '🧭', 'silver', 'all_cities_visited',    1),
  ('scholar',          'Estudioso',            'Leia 100 livros',               '📚', 'silver', 'books_read',          100),
  ('master-craftsman', 'Mestre Artesão',       '5.000 itens fabricados',        '🛠️', 'silver', 'items_crafted',      5000),
  ('door-breaker',     'Arrombador',           'Abra 500 portas',               '🚪', 'silver', 'doors_opened',        500),
  ('industrialist',    'Industrial',           'Utilize todas as estações',     '🏭', 'silver', 'all_stations_used',     1),
  ('scout',            'Escoteiro',            'Explore 100 porões',            '🔦', 'silver', 'basements_explored',  100),
  -- OURO novos
  ('fortress',         'Fortaleza',            'Construa uma mega base',        '🏰', 'gold', 'mega_base',              1),
  ('spiffo-base',      'Dono do Spiffo',       'Base em um restaurante Spiffo', '🍔', 'gold', 'spiffo_base_any',        1),
  ('spiffo-franchise', 'Franqueado',           'Bases em 5 restaurantes Spiffo','🦝', 'gold', 'spiffo_base_five',       5),
  ('conqueror',        'Conquistador',         'Limpe Louisville',              '🏙️', 'gold', 'louisville_cleared',     1),
  ('military-op',      'Operação Militar',     'Limpe a Base Militar',          '🪖', 'gold', 'military_cleared',       1),
  ('calorie-hoarder',  'Acumulador',           'Armazene 100.000 calorias',     '📦', 'gold', 'calories_stored',   100000),
  ('master-smith',     'Mestre Ferreiro',      '500 armas produzidas',          '⚙️', 'gold', 'weapons_crafted',      500),
  ('master-tailor',    'Alfaiate Mestre',      '500 roupas produzidas',         '🧵', 'gold', 'clothes_crafted',      500),
  ('master-woodworker','Marceneiro Mestre',    '500 móveis produzidos',         '🪑', 'gold', 'furniture_crafted',    500),
  ('livestock-king',   'Pecuarista',           '50 animais vivos',              '🐄', 'gold', 'animals_alive',         50),
  ('self-sufficient',  'Autossuficiente',      '180 dias sem enlatados',        '🌾', 'gold', 'days_no_canned',       180),
  ('traveler',         'Viajante',             'Visite todas as regiões do mapa','🚂', 'gold', 'all_regions_visited',   1),
  ('spiffo-collector', 'Colecionador',         'Colete todas as estátuas Spiffo','🏛️', 'gold', 'spiffo_statues',       1),
  ('scientist',        'Cientista',            'Use todas as bancadas',         '🔬', 'gold', 'all_benches_used',      1),
  ('arsenal',          'Arsenal',              '100 armas de cada categoria',   '🛡️', 'gold', 'arsenal_complete',      1),
  ('electrician',      'Eletricista',          'Energize 10 bases',             '⚡', 'gold', 'powered_bases',        10),
  -- PLATINA
  ('season-01',        'O Início do Fim',      'Complete a Temporada 01',                      '☣️', 'platinum', 'season_01_complete',    1),
  ('spiffo-guardian',  'Guardião do Spiffo',   'Domine todos os restaurantes Spiffo',          '🏅', 'platinum', 'all_spiffo_bases',       1),
  ('full-map',         'Kentucky Inteiro',     'Revele todo o mapa',                           '🗺️', 'platinum', 'full_map_revealed',      1),
  ('master-skills',    'Mestre das Habilidades','Nível máximo em todas as habilidades',        '🧬', 'platinum', 'all_skills_10',          1),
  ('supreme-hunter',   'Caçador Supremo',      'Abata todas as espécies de animais',           '🏹', 'platinum', 'all_animal_species',     1),
  ('magnate',          'Magnata',              'Tenha todas as bases totalmente equipadas',    '🏆', 'platinum', 'all_bases_equipped',     1),
  ('rebuilder',        'Reconstrutor',         'Reconstrua todas as cidades com bases',        '🧱', 'platinum', 'cities_rebuilt',         1),
  ('supreme-survivor', 'Sobrevivente Supremo', 'Complete todos os objetivos do campeonato',   '👑', 'platinum', 'all_objectives_complete',1),
  ('master-industry',  'Mestre da Indústria',  '50.000 itens produzidos',                     '⚒️', 'platinum', 'items_crafted',      50000),
  ('completionist',    'Completionista',       'Obtenha todas as conquistas Ouro',             '💯', 'platinum', 'all_gold_achievements',  1)
ON CONFLICT (slug) DO NOTHING;
