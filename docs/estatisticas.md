# Estatísticas do Campeonato (`/estatisticas`)

Página pública com estatísticas agregadas do Brasileirão PZ. Este documento registra
o que foi implementado, as decisões de modelagem e **o que ficou de fora e por quê**,
com o caminho para implementar cada item no futuro.

Auditoria feita em 2026-09-24 contra o código dos 3 repos (PZ-Rank, PZCommunityRank,
PZ-Rank-Companion) e contra os dados públicos de produção (`GET /entries`).

---

## Arquitetura

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Agregação | `backend/src/lib/statistics.ts` | Funções puras — **todo** cálculo estatístico mora aqui |
| Profissões | `backend/src/lib/professions.ts` | Normaliza o nome da profissão (idiomas do jogo + nomes antigos) |
| API | `backend/src/routes/stats.ts` | `GET /stats/championship` e `GET /stats/championship/ranking` |
| Testes | `backend/src/__tests__/statistics.test.ts` | Cálculos, filtros, normalização |
| Página | `frontend/src/pages/StatisticsPage.tsx` | Filtros na URL, navegação interna, estados |
| Seções | `frontend/src/components/statistics/*` | Uma seção por arquivo + `StatsUi.tsx` (blocos reutilizáveis) |
| Estilo | `frontend/css/pages/statistics.css` | Gráficos em CSS puro (sem lib de gráficos) |

### Endpoints

```text
GET /stats/championship?season=current&status=all|alive|dead&profession=<nome>&include_dq=0|1
GET /stats/championship/ranking?metric=<métrica>&limit=1..100 (+ mesmos filtros)
```

Métricas de ranking: `kills`, `days`, `score`, `skills10`, `skill_levels`, `bases`, `skill:<Nome PT>`, `action:<chave>`.

### Performance

- Uma leitura de `entries` (só as colunas usadas) + `players` + temporada ativa, em
  cache de memória por **3 min**. O resultado agregado é memoizado por combinação de
  filtros enquanto o cache de linhas não expira.

- Medido com os dados reais (552 runs oficiais, 578 no total): agregação completa
  em **~50 ms** (primeira chamada, com JIT frio). Payload da resposta: ~22 KB (vs ~740 KB de `GET /entries`).

- Não foram criados índices nem `GROUP BY` em SQL: com ~600 linhas o custo é dominado
  pela leitura, e agregar no Node evita manter o mesmo SQL em PostgreSQL e SQLite.
  **Reavaliar quando passar de ~20 mil runs** — aí vale mover contagens para SQL.

### Regras oficiais (iguais ao rank público)

- `entries.deleted_at IS NULL`, jogador não excluído, `players.is_test_mod = false`

- Desclassificados (`sandbox_ok = false`) **fora** por padrão — mesma regra de
  `GET /entries` + `RankPage`, `/stats/global`, `/stats/legends` e do fechamento de
  temporada. O filtro "Incluir desclassificados" mostra um aviso de que os números
  deixam de ser oficiais.

- Status "Mortos (runs encerradas)": no sistema atual a única forma de uma run
  terminar é morrer, então "encerrada" = `is_alive = false`.

- **Partida encerrada com 0 dias E 0 kills não conta** (`isEmptyRun`, decisão de
  2026-09-24): na prática é o jogador recriando o personagem logo no início pra
  sortear spawn/traits (caso real: um personagem "morreu" 29× em 5 dias com 0/0).
  Vale pra runs atuais mortas, pro histórico (o sync não arquiva) e pra recuperação
  (`--skip-empty`). Viva com 0/0 = recém-criada, continua contando. A regra é
  explicada aos jogadores em /estatisticas ("Como as runs são contadas") e no perfil
  (aba "Runs anteriores"). Por isso `/stats/championship` tem menos mortos que
  `/stats/global`, que não aplica essa regra.

### Unidades

- **Run** = uma linha de `entries` (um personagem de um jogador). Profissão, traits,
  skills, sobrevivência e kills são contados **por run**.

- **Jogador** = `player_id` distinto. Aparece como informação complementar
  ("226 runs · 176 jogadores").

- **Traits**: cada trait conta 1× por run; o percentual é "% das runs que escolheram"
  (a soma passa de 100% porque cada run tem ~20 traits).

- **Skills**: toda run conta; skill ausente = nível 0. O mod exporta todas as 35
  skills (inclusive nível 0) — confirmado nos dados: 552/552 runs têm as 35.
  "Nunca evoluiu" = nível 0; bônus de profissão/trait já começam acima de 0.

### Normalização de profissões

O mod exporta `getUIName()` — o nome **no idioma do jogo do jogador**. Em produção
isso gerava 46 "profissões" diferentes para 22 reais (ex: Lenhador / Lumberjack /
Bûcheron). `lib/professions.ts` mapeia os nomes das traduções oficiais do B42
(`Translate/{PTBR,EN,FR,ES}/UI.json`, chaves `UI_prof_*`) + nomes PTBR antigos
para o nome PTBR atual. Profissões desconhecidas (mods) passam inalteradas.
**Ao sair um novo idioma ou profissão no jogo, atualizar esse mapa.**

---

## Status de cada seção pedida

🟢 implementado · 🟡 parcial / dado incompleto · 🔴 dado não existe

| Seção | Status | Observação |
| --- | --- | --- |
| Cards gerais | 🟢 | Jogadores, runs, vivos, mortos, zumbis, dias, bases Spiffo, skills no 10 + itens fabricados, refeições e casas saqueadas (quando já há runs com dados de ações) |
| Profissões | 🟢 | Todas, com "ver todos" |
| Traits (positivos/negativos, mais/menos) | 🟢 | Traits de mods ficam em "Outros (mods)" — sem polaridade conhecida |
| Combinações de traits | 🟢 | Conjuntos completos idênticos em 2+ runs (top 10). Pares foram descartados: com ~20 traits por run, os pares mais comuns só repetem os traits mais populares |
| Sobrevivência | 🟢 | Média, mediana, extremos, média vivos/mortos, distribuição |
| Zumbis | 🟢 | Faixas adaptadas aos dados reais (mediana = 44 kills; as faixas sugeridas de 0–10.000 colocariam 90% das runs numa barra só) |
| Skills + detalhe por skill + comparação nível 10 | 🟢 | "Tempo médio até o nível 10" 🔴 — ver abaixo |
| Recordes | 🟢 | Kills, dias, score, skills no 10, soma de níveis, bases + 10 recordes de ações |
| Ranking por estatística | 🟢 | Todas as métricas acima + qualquer skill |
| Curiosidades | 🟢 | Grupos com < 5 runs são ignorados (média de 1–2 runs é ruído). Texto sempre descritivo |
| Filtros na URL | 🟢 | `?status=`, `?profissao=`, `?dq=1` |
| Temporada | 🟡 | Só "temporada atual" — `season_id` passa a ser gravado desde v4.23.0; ver abaixo |
| Causas de morte | 🟡 | Ver abaixo |
| Onde os jogadores morrem | 🟡 | Ver abaixo |
| Evolução histórica | 🟡 | Ver abaixo |
| Ações dos sobreviventes / ranking de ações | 🟢 | Desde v4.22.0 — cobertura cresce conforme o Companion v2.5.0 é adotado. Ver abaixo |
| Locais de início | 🔴 | Ver abaixo |
| Tempo até nível 10 | 🔴 | Ver abaixo |

---

## 🟢 Ações dos sobreviventes (v4.22.0 + Companion v2.5.0)

**Problema encontrado na auditoria:** desde o mod **v2.16** o código de sync é o
**PZRX9 slim** (13 campos). Os 33 contadores de ações (`houses_looted`,
`items_crafted`, `meals_cooked`, …) saíram do código e passaram a ser gravados só
em `pz_rank_stats_<char>.log`, que o Companion lia apenas localmente. Resultado: as
colunas de `entries` ficaram congeladas (ou zeradas em runs novas) e **as conquistas
de ações nunca desbloqueavam no servidor**.

**Solução (sem mudar o mod, sem telemetria nova):**

- Companion v2.5.0+ lê `pz_rank_stats_<char>.log` no momento do sync e envia
  `stats` + `stats_character` no `POST /sync/update`, assinado em `X-Stats-Sig`
  (HMAC de `token:code:personagem:k=v&…` com chaves ordenadas).
- Backend (`lib/companionStats.ts`): valida assinatura, personagem (tolerante a
  diferença de encoding latin1/UTF-8 em nomes com acento) e valores (inteiros,
  ≥ 0, teto de 10 milhões). Válidas → gravadas nas colunas **e** repassadas às
  conquistas. Inválidas → ignoradas com log `[sync] stats do Companion ignoradas`;
  o sync do rank **nunca** é rejeitado por causa das stats.
- `entries.stats_synced_at` (migration_v37) marca runs com contadores confiáveis.
  A página só usa ações dessas runs — os valores antigos congelados ficam de fora.
  Por isso a cobertura começa em 0 e cresce conforme os jogadores atualizam o
  Companion ("Baseado em X de Y runs").
- A fila de reenvio do Companion **não** manda stats (o arquivo em disco pode ser
  mais novo que o código enfileirado); o próximo sync normal atualiza.

**Na página:** seção "O que os sobreviventes fazem" em 5 grupos (craft,
alimentação, caça/natureza, exploração, sobrevivência), detalhe por ação (total,
média, mediana, maior, % das runs, distribuição, recordista, ranking), 3 cards na
visão geral e 10 recordes de ações. Ações do tipo "pico" (cidades visitadas,
espécies, maior tempo sem dormir…) não mostram total — somar entre runs não
significa nada.

**Adicionar uma ação nova:** o mod grava a chave no `saveStats` → incluir em
`COMPANION_STAT_KEYS` (companionStats.ts), coluna em `entries` (migration + schema
SQLite + ALLOWED_COLS dos 2 adapters) → `ACTION_GROUPS` (statistics.ts) → rótulo
em `frontend/src/lib/actionLabels.ts`.

## 🔴 Locais de início

A cidade/ponto de spawn **não é coletada** pelo mod. Exigiria um campo novo no
protocolo (uma leitura única no início da run, não rastreamento) — **mudança de
protocolo do mod**, fora do escopo desta fase.

## 🔴 Tempo médio até o nível 10

`journal_events` registra `skill_maxed` com a **data real** do sync, não o tempo de
jogo. "Dias de jogo até o nível 10" precisaria do `time_raw` no momento do evento.
Caminho barato: gravar `time_raw`/`days` no `data` do evento `skill_maxed` em
`sync.ts` a partir de agora (sem mudar o mod). Só vale para eventos futuros.

## 🟡 Temporada

`entries` não tem vínculo real com temporada. Existe uma coluna `entries.season_id`
(migração do SQLite local e na allowlist do `pg-adapter`), mas **nenhuma rota a
preenche** — o sync nunca grava `season_id`. Encerrar temporada só arquiva o top 3
em `hall_of_fame`. Hoje há 1 temporada ("Um Novo Começo", id 2).

Por isso o filtro mostra só "Atual — `<nome>`". Para habilitar temporadas passadas:
gravar `season_id` da temporada ativa no INSERT de `entries` (sync + criação manual),
fazer backfill das runs existentes para a temporada atual, e trocar o filtro de
temporada no backend por `.eq('season_id', …)`.

## 🟡 Causas de morte

O mod (v2.15+) envia `death_cause` (15 chaves: `zombie`, `zombie_horde`,
`zombie_virus`, `vehicle`, `pvp`, `burned`, `bled`, `infection`, `poison`, `bleach`,
`fall`, `cold`, `sick`, `hunger`, `thirst`; vazio = desconhecida). Mas o servidor só
guarda isso em `journal_events.data.cause` quando o sync vê a transição vivo→morto:

- mortes confirmadas por moderador (`/entries/:id/confirm-death`) ficam sem causa;

- runs mortas antes do mod v2.15 não têm causa;

- não há coluna em `entries`.

Caminho: coluna `entries.death_cause` gravada no sync de morte + backfill a partir do
journal (`player_id` + `char_name`). Exibir com o percentual de cobertura
("causa conhecida em X% das mortes").

## 🟡 Onde os jogadores morrem

`heatmap_events` já tem mortes agregadas por célula de 100×100 tiles, por temporada,
**sem vínculo com jogador** (bom para privacidade). Limitações:

- não existe tabela de limites das cidades para transformar célula → nome de cidade
  (criar a partir do mapa do B42; validar Louisville, que ocupa várias áreas);

- como não liga com a run, não dá para filtrar por profissão/status nem calcular
  "tempo médio até a morte" por local.

A página `/mapa` já mostra esse heatmap. Não foi e **não deve ser** adicionado
rastreamento contínuo de posição para melhorar isso.

## 🟡 Evolução histórica

O banco guarda só o valor atual de cada run — não há série histórica de kills/dias.
Dá para montar agora, com ressalvas:

- inscrições por mês: `players.created_at`;

- runs iniciadas por semana: `entries.created_at` (mas nova run com o mesmo nome de
  personagem sobrescreve a linha — a run antiga some);

- mortes por semana: `journal_events` tipo `player_died` (mesma cobertura parcial das
  causas de morte).

**Não** é possível: zumbis mortos por semana, evolução de skills ao longo do tempo.

## 🟢 Runs com o mesmo nome — histórico de runs (v4.23.0)

`entries` tem `UNIQUE(player_id, character_name)`: uma partida nova com o mesmo nome
de personagem reaproveita a linha. Até a v4.22.0 a run anterior era **apagada** (caso
Kdevil: 563 dias; pelo jornal, 138 personagens já tinham perdido runs assim).

Desde a v4.23.0 (`migration_v38`, `lib/runHistory.ts`):

- Antes de sobrescrever (sync ou cadastro manual do moderador), a run anterior é
  copiada para `run_history` — com profissão, skills, traits, bases, contadores de
  ações, causa da morte, temporada e datas de início/fim.
- `entries` passa a gravar `season_id` (temporada ativa), `run_started_at` e
  `death_cause` (antes só existia no jornal).
- `/estatisticas` soma as runs atuais + `run_history` (runs anteriores sempre contam
  como encerradas). Lendas considera o histórico em "mais kills" e "maior
  sobrevivência". O perfil do jogador ganhou a aba "Runs anteriores".
- Runs perdidas antes disso foram recuperadas por `scripts/backfill-run-history.ts`
  (lógica em `lib/runHistoryBackfill.ts`), com 3 fontes: snapshot de `GET /entries`,
  dump de 2026-09-03 e mortes do jornal. As que vieram **só do jornal** ficam
  `is_partial = true` (dias/kills/pontuação/causa) e não entram em
  profissões/traits/skills.
- Conquistas continuam por (jogador, nome de personagem) — compartilhadas entre as
  runs do mesmo nome, como antes.
- Uma run abandonada viva (partida nova sem a morte ter sido registrada) é arquivada
  com `is_alive = true` e aparece como "Abandonada" no perfil.

---

## Validação com produção (2026-09-24)

Agregação rodada sobre `GET /entries` público e comparada com `GET /stats/global`:

| Métrica | `/stats/global` | `/stats/championship` |
| --- | ---: | ---: |
| Runs (oficiais) | 552 | 552 |
| Vivos | 278 | 278 |
| Mortos | 274 | 274 |
| Zumbis | 1.881.419 | 1.881.419 |
| Dias | 22.486 | 22.486 |

Profissões: 46 grafias → 22 profissões após normalização (Pedreiro 226, Profissão
Personalizada 81, Lenhador 80, …).
