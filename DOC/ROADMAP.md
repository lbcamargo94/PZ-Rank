# Roadmap PZ Community Rank — Próximas Etapas

> Documento de planejamento de desenvolvimento. Cada ideia foi avaliada quanto à
> viabilidade técnica no stack atual (React 18 + Express + Supabase/SQLite + mod Lua).

---

## Stack de referência

| Camada      | Tecnologia                              |
|-------------|------------------------------------------|
| Frontend    | React 18 + TypeScript + Vite (Vercel)   |
| Backend     | Express + TypeScript (Vercel serverless)|
| Banco       | Supabase (Postgres) / SQLite local      |
| Mod Lua     | Project Zomboid — gera código PZR (base64) |
| Email       | Resend API                              |

---

## Avaliação das ideias

### Viável com o stack atual (sem mudar o mod)

| # | Ideia | Esforço | O que precisa |
|---|-------|---------|---------------|
| 1 | Sistema de Divisões | Baixo | Cálculo frontend sobre a lista de entries já existente |
| 2 | Perfil Psicológico | Baixo | Algoritmo sobre stats já decodificadas do código PZR |
| 3 | Estatísticas da Comunidade | Baixo | Agregação SQL (SUM kills, days etc.) em um endpoint `/stats/global` |
| 4 | Lendas do Brasileirão | Baixo-Médio | Queries de recordes sobre `entries` + nova seção no frontend |
| 5 | Hall da Fama | Médio | Nova tabela `seasons` + página `/hall-da-fama` |
| 6 | Sistema de Temporadas | Médio | Tabela `seasons`, painel de admin para abrir/fechar, arquivamento de entries |
| 7 | Jornal do Apocalipse | Médio | Endpoint `/news/daily` com stats do dia + painel para editar manchetes manuais |
| 8 | AdSense + Painel de Transparência | Baixo-Médio | Script AdSense no `index.html` + componente React de transparência financeira |

### Viável mas requer mudança no mod Lua

| # | Ideia | Esforço | Dependência do mod |
|---|-------|---------|-------------------|
| 9 | Conquistas (Achievements) | Alto | Mod precisa incluir no código PZR: zumbis mortos, animais abatidos, peixes, colheitas, construções |
| 10 | Estatísticas Estendidas | Alto | Mod precisa codificar: horas sem dormir, combustível gasto, veículos usados, portas abertas, casas saqueadas |

### Muito complexo / longo prazo

| # | Ideia | Esforço | Bloqueio |
|---|-------|---------|---------|
| 11 | Heatmap de mortes/bases/kills | Muito Alto | PZ não expõe coordenadas por API pública; o mod precisaria capturar e enviar coordenadas via `sync`, o mapa do jogo precisaria ser renderizado como tile map |

---

## Plano de desenvolvimento em etapas

---

### Etapa 1 — Motivação e identidade (sem mudanças no mod)

**Objetivo:** Aumentar engajamento dos jogadores que não estão no topo do rank.  
**Tempo estimado:** 2–3 semanas  
**Itens:** Divisões · Perfil Psicológico · Estatísticas da Comunidade

#### 1.1 — Sistema de Divisões

Divisões calculadas em tempo real com base na posição no rank ativo.

```
🥇 Série A   — posições 1–10
🥈 Série B   — posições 11–30
🥉 Série C   — demais jogadores aprovados
```

- **Backend:** nenhuma mudança necessária.
- **Frontend:** ordenar `entries` pelo critério ativo, atribuir divisão por índice,
  exibir badge colorida ao lado do nick na tabela e no perfil.
- **Banco:** nenhuma migração.

#### 1.2 — Perfil Psicológico

Calcula o arquétipo do jogador com base nos stats já decodificados do código PZR.

| Arquétipo | Critério principal |
|-----------|-------------------|
| 🪓 Berserker | Kills / dias > limiar alto |
| 🏕️ Nômade | Dias altos, base pequena |
| 🏰 Construtor | Horas construindo / dias alta |
| 🚗 Explorador | Mapas visitados / veículos altos |
| 🎣 Pescador | Peixes / dias alta *(após etapa 3)* |
| 🌾 Fazendeiro | Colheitas altas *(após etapa 3)* |

- **Backend:** nenhuma mudança; cálculo pode ficar inteiramente no frontend.
- **Frontend:** função `resolveArchetype(entry)` em `frontend/src/lib/archetype.ts`
  exibida na `PlayerPage`.
- **Banco:** nenhuma migração.

#### 1.3 — Estatísticas da Comunidade

Painel global na página inicial mostrando totais acumulados de todos os jogadores.

```
🌍 Esta temporada
54 milhões de zumbis mortos  |  214 mil dias sobrevividos  |  73 mil animais abatidos
```

- **Backend:** novo endpoint `GET /stats/global` — query SQL com `SUM` sobre `entries`.
- **Frontend:** seção colapsável abaixo do rank na `MainView`.
- **Banco:** nenhuma migração (lê `entries` existentes).

---

### Etapa 2 — Temporadas e memória (sem mudanças no mod)

**Objetivo:** Dar peso e narrativa às temporadas, preservar a história do campeonato.  
**Tempo estimado:** 3–5 semanas  
**Itens:** Sistema de Temporadas · Hall da Fama · Jornal do Apocalipse · Lendas

#### 2.1 — Sistema de Temporadas

```sql
-- Nova tabela (Supabase + sqlite-schema.sql)
CREATE TABLE seasons (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,           -- "Temporada 1 — O Início"
  theme_slug   TEXT,                    -- "sangue", "inverno", "fogo"
  started_at   TIMESTAMP NOT NULL,
  ended_at     TIMESTAMP,               -- NULL = temporada ativa
  is_active    BOOLEAN DEFAULT TRUE
);

-- entries ganha FK opcional
ALTER TABLE entries ADD COLUMN season_id INTEGER REFERENCES seasons(id);
```

- **Backend:** rotas `POST /seasons`, `PATCH /seasons/:id/close`, `GET /seasons`.
  Ao fechar uma temporada, `ended_at` é setado e `is_active` vira `false`.
- **Frontend painel:** nova aba "Temporada" para o moderador criar/fechar temporadas.
- **Frontend público:** seletor de temporada no topo do rank para ver histórico.

#### 2.2 — Hall da Fama

```sql
CREATE TABLE hall_of_fame (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id    INTEGER NOT NULL REFERENCES seasons(id),
  player_id    INTEGER NOT NULL REFERENCES players(id),
  position     INTEGER NOT NULL,        -- 1, 2, 3
  days         INTEGER,
  kills        INTEGER,
  score        INTEGER
);
```

- **Backend:** rota `POST /seasons/:id/close` popula `hall_of_fame` automaticamente com
  o top 3 da temporada encerrada.
- **Frontend:** página `/hall-da-fama` com cards por temporada, estilo "anuário".

#### 2.3 — Jornal do Apocalipse

```sql
CREATE TABLE daily_news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         DATE NOT NULL UNIQUE,
  headline     TEXT,                    -- manchete manual (opcional)
  stats        JSONB                    -- snapshot automático do dia
);
```

`stats` contém: `{ deaths_today, zombies_killed_today, top_city, players_joined_top10 }`.

- **Backend:** endpoint `GET /news/latest` retorna a notícia mais recente.
  Um cron job diário (ou trigger no primeiro acesso do dia) grava o snapshot.
- **Frontend:** card "Jornal do Apocalipse" na lateral da `MainView` (desktop) ou
  accordion acima do rank (mobile).

#### 2.4 — Lendas do Brasileirão

Página estática / semi-estática com recordes históricos acumulados de todas as temporadas.

| Título | Query |
|--------|-------|
| 👑 Primeiro Campeão | `hall_of_fame WHERE position=1 ORDER BY season.started_at ASC LIMIT 1` |
| ⚔️ Mais kills (all-time) | `entries ORDER BY kills DESC LIMIT 1` |
| 💀 Maior sobrevivente | `entries ORDER BY days DESC LIMIT 1` |
| 🏹 Melhor caçador | Após etapa 3 — campo `animals_killed` |
| 🐟 Mestre da pesca | Após etapa 3 — campo `fish_caught` |
| 🏗️ Maior construtor | Após etapa 3 — campo `items_crafted` ou `carpentry_xp` |

- **Backend:** endpoint `GET /stats/legends`.
- **Frontend:** página `/lendas`.

---

### Etapa 3 — Conquistas e estatísticas estendidas (requer mudança no mod Lua)

**Objetivo:** Recompensar jogadores por feitos específicos além de "sobreviver muito".  
**Tempo estimado:** 4–8 semanas (incluindo ciclo de testes do mod)  
**Dependência:** Mod Lua v2.6+ precisa codificar novos campos no PZR ou enviá-los via sync.

#### 3.1 — Novos campos no código PZR / sync

O mod precisa incluir no payload (novo bloco no código PZR ou campos no `POST /sync`):

```
animals_killed    — animais abatidos
fish_caught       — peixes capturados
crops_harvested   — vegetais colhidos
items_crafted     — itens construídos/craftados
doors_opened      — portas abertas
houses_looted     — casas saqueadas
fuel_used         — combustível gasto (litros)
vehicles_used     — veículos diferentes pilotados
hours_without_sleep — horas sem dormir (recorde)
max_fall_survived — maior queda sobrevivida (m)
max_horde_killed  — maior horda eliminada em sequência
```

#### 3.2 — Sistema de Conquistas

```sql
CREATE TABLE achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,     -- "first-blood", "hunter", "farmer"
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,                     -- emoji ou path de imagem
  tier        TEXT DEFAULT 'bronze'     -- bronze | silver | gold
);

CREATE TABLE player_achievements (
  player_id     INTEGER NOT NULL REFERENCES players(id),
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (player_id, achievement_id)
);
```

Conquistas iniciais propostas:

| Slug | Ícone | Nome | Critério |
|------|-------|------|---------|
| `first-blood` | 🥉 | Primeiro Sangue | 100 zumbis mortos |
| `zombie-slayer` | ⚔️ | Exterminador | 1.000 zumbis mortos |
| `hunter` | 🏹 | Caçador | 200 animais abatidos |
| `farmer` | 🚜 | Fazendeiro | 100 vegetais colhidos |
| `fisherman` | 🐟 | Mestre da Pesca | 100 peixes capturados |
| `builder` | 🏠 | Construtor | 50 itens craftados/construídos |
| `marathon` | 🏃 | Maratonista | 30 dias de sobrevivência |
| `legend` | 👑 | Lenda | 100 dias de sobrevivência |
| `insomniac` | 😴 | Insone | 72 horas sem dormir |
| `looter` | 🏚️ | Saqueador | 50 casas saqueadas |

- **Backend:** ao processar um sync ou entry, checar quais conquistas foram desbloqueadas
  e inserir em `player_achievements`.
- **Frontend:** exibir na `PlayerPage` como ícones com tooltip. Conquistas ficam para sempre
  no perfil, mesmo em temporadas futuras.

---

### Etapa 4 — Monetização com transparência

**Objetivo:** Sustentar os custos do campeonato e criar fundo de premiação.  
**Tempo estimado:** 2–3 semanas  
**Itens:** AdSense · Painel de transparência · Modo sem anúncios

#### 4.1 — Google AdSense

Posicionamentos não intrusivos aprovados:

| Local | Tipo |
|-------|------|
| Entre o Jornal e o Rank (`MainView`) | Banner 728×90 (leaderboard) |
| Barra lateral desktop (`PlayerPage`) | Retangulo 300×250 |
| Fim do perfil do jogador | Retangulo 300×250 |
| Página `/estatisticas` (etapa futura) | Leaderboard |

Nunca usar: pop-ups, vídeos autoplay, intersticiais, banners sobre o conteúdo.

```html
<!-- index.html — AdSense script (adicionar antes de </head>) -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"></script>
```

Componente React:
```tsx
// frontend/src/components/AdBanner.tsx
// Renderiza um slot AdSense ou null se o usuário for supporter (modo sem anúncios)
```

#### 4.2 — Painel de Transparência Financeira

Componente na página `/temporada` (ou seção da `MainView`) mostrando:

```
💰 Fundo da Temporada X
──────────────────────────────────────────
Hospedagem      ████████████ R$ 89/mês
Premiação atual ██████░░░░░░ R$ 630 / meta R$ 1.000

Receitas
  ✅ Apoiadores       R$ 420
  ✅ Google AdSense   R$ 187
  ✅ Patrocínios      R$ 300
  Total              R$ 907
──────────────────────────────────────────
🎯 Todo anúncio ajuda a manter o Brasileirão PZ e aumenta a premiação.
```

Os valores financeiros são cadastrados manualmente pelo moderador master (sem integração
automática com bancos — apenas transparência declaratória).

```sql
CREATE TABLE season_finances (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id    INTEGER NOT NULL REFERENCES seasons(id),
  category     TEXT NOT NULL,   -- "hosting", "prize", "adsense", "supporters", "sponsor"
  label        TEXT NOT NULL,
  amount_brl   DECIMAL(10,2),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

#### 4.3 — Modo sem anúncios (Apoiadores)

```sql
ALTER TABLE players ADD COLUMN is_supporter BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN supporter_until DATE;
```

- **Backend:** rota `PATCH /players/:id/supporter` (apenas master) para marcar/desmarcar.
- **Frontend:** o componente `AdBanner` verifica se o player logado tem `is_supporter = true`.
  Se sim, não renderiza o slot AdSense.
- **Nota:** verificação de pagamento é manual inicialmente. Integração automática com
  Stripe/Pix é escopo de etapa futura.

---

### Etapa 5 — Heatmap (longo prazo)

**Objetivo:** Visualizar no mapa do PZ onde os jogadores morrem, constroem e matam.  
**Tempo estimado:** 8–16 semanas  
**Bloqueios a resolver antes de começar:**

1. **O mod Lua precisa capturar e enviar coordenadas.** PZ usa sistema de coordenadas
   `(x, y, z)` via `getPlayer():getX()`. O mod deve registrar: ponto de morte, localização
   da base principal, kills por região (grid aproximado).
2. **Tile map do PZ.** Existem projetos de mapa interativo (ex: `map.projectzomboid.com`)
   que expõem tiles. É preciso avaliar licença e viabilidade de embutir no site.
3. **Volume de dados.** Coordenadas de kills por sessão podem gerar muitos registros.
   Usar grid de células (ex: 100×100 blocos) para agregar no backend antes de salvar.

**Arquitetura proposta (futuro):**

```sql
CREATE TABLE heatmap_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id  INTEGER REFERENCES seasons(id),
  event_type TEXT NOT NULL,  -- 'death' | 'kill_zone' | 'base' | 'stuck'
  grid_x     INTEGER,        -- coordenada PZ / 100 (célula de grid)
  grid_y     INTEGER,
  count      INTEGER DEFAULT 1,
  UNIQUE(season_id, event_type, grid_x, grid_y)
);
```

O mod enviaria um payload compacto ao `POST /sync` com eventos agrupados por célula.
O frontend usaria Canvas 2D sobreposto ao tile map.

---

## Ordem recomendada de implementação

```
┌─────────────────────────────────────────────────────────┐
│  Etapa 1 (2-3 sem.)  — Divisões, Perfil, Stats globais  │  ← Nenhuma mudança no mod
├─────────────────────────────────────────────────────────┤
│  Etapa 2 (3-5 sem.)  — Temporadas, Hall da Fama,        │  ← Apenas DB + backend/frontend
│                         Jornal, Lendas                  │
├─────────────────────────────────────────────────────────┤
│  Etapa 3 (4-8 sem.)  — Conquistas + stats estendidas    │  ← Requer mod v2.6+
├─────────────────────────────────────────────────────────┤
│  Etapa 4 (2-3 sem.)  — AdSense + transparência          │  ← Pode rodar em paralelo
├─────────────────────────────────────────────────────────┤
│  Etapa 5 (8-16 sem.) — Heatmap                          │  ← Requer mod + tile map
└─────────────────────────────────────────────────────────┘
```

> **Regra geral:** etapas 1 e 4 podem ser desenvolvidas em paralelo.
> Etapa 3 bloqueia enquanto o mod não for atualizado.
> Etapa 5 é a mais incerta — avaliar viabilidade do tile map antes de começar.

---

## Migrações de banco necessárias por etapa

| Tabela | Etapa | Tipo |
|--------|-------|------|
| `seasons` | 2 | Nova |
| `hall_of_fame` | 2 | Nova |
| `daily_news` | 2 | Nova |
| `entries.season_id` | 2 | ALTER (coluna opcional) |
| `achievements` | 3 | Nova |
| `player_achievements` | 3 | Nova |
| `entries.(animals_killed, fish_caught, ...)` | 3 | ALTER |
| `season_finances` | 4 | Nova |
| `players.(is_supporter, supporter_until)` | 4 | ALTER |
| `heatmap_events` | 5 | Nova |

Todas as migrações devem ser aplicadas tanto no `backend/src/db/sqlite-schema.sql`
(ambiente local) quanto executadas via SQL Editor no Supabase (produção).

---

*Última atualização: 2026-07-28*
