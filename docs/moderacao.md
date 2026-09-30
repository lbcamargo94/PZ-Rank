# Moderação: desclassificações, dados manipulados e impacto nas estatísticas

Guia para verificar o que acontece com os números do campeonato quando uma run é
desclassificada, reabilitada ou corrigida à mão, e registro dos casos já tratados.
Complementa [estatisticas.md](estatisticas.md) (como cada estatística é calculada).

Última revisão: 2026-09-30 (v4.28.5).

---

## Regras em vigor

| Regra | Onde | Desde |
| --- | --- | --- |
| **Sandbox, debug e manual desclassificam de vez.** Todo sync com o nome do personagem recebe `disqualified: true`, inclusive partida nova. Variações do nome (maiúsculas, acentos, espaços) contam como o mesmo nome. Só o moderador reabilita. | `routes/sync.ts`, `normalizeCharName` em `lib/runHistory.ts` | v4.28.5 |
| **Mods não desclassificam de vez:** o primeiro sync sem o mod proibido reabilita a run. | `isModsReason` em `routes/sync.ts` | antigo |
| **Abates impossíveis são recusados:** mais de 300 + 50 por hora de jogo no total, ou no salto entre dois syncs. A run fica com os dados anteriores e ganha a anomalia `implausible_kills`. | `lib/plausibility.ts` | v4.28.2 |
| **Habilidades impossíveis são recusadas:** soma de níveis (fora Aptidão Física e Força) acima de 40 + 1 por hora de jogo, ou salto acima de 10 + 1/h entre syncs. Anomalia `implausible_skills`. | `lib/plausibility.ts` | v4.28.3 |
| **Habilidade que diminuiu só gera aviso** (`skills_regression:<habilidade> <antes>><depois>`). O sync é aceito, porque o B42.19 renomeou IDs e um mod com mapeamento errado informa 0. | `lib/plausibility.ts` | v4.28.3 |
| **Anistia de debug:** reabilitar uma run desclassificada por debug exige nota pública e perdoa o debug só até a hora registrada. | `lib/debugAmnesty.ts` | v4.28.0 |

A v4.27.2 permitia recomeçar com o mesmo nome (partida nova com até 1 dia de jogo).
Isso foi **removido na v4.28.5** porque virou brecha (caso Chris Pereira, abaixo).

---

## O que uma desclassificação muda sozinha

Tudo abaixo filtra `sandbox_ok = false` e se ajusta na hora (ou em até 3 min, pelo
cache de `lib/statsData.ts`):

| Onde | Efeito |
| --- | --- |
| Ranking público (`GET /entries`, RankPage) | A run sai; quem estava abaixo sobe uma posição |
| Contador da home (`GET /stats/global`) | Sai de `total_kills`, `total_days` e da contagem de vivos/mortos |
| `/estatisticas` (todas as seções, inclusive evolução semanal, armas, cidades iniciais, onde morrem, ações, profissões e traços) | A run sai de todas as contas |
| Lendas (`GET /stats/legends`) | A run sai (atuais e histórico usam `sandbox_ok is not false`) |
| Conquistas no perfil (`GET /achievements/player/:id`) | As conquistas da run somem do perfil, mas **continuam no banco** e voltam se a run for reabilitada |
| Fechamento de temporada / Hall da Fama | Usa as mesmas regras oficiais |

## O que NÃO se ajusta sozinho

| Onde | Por quê | O que fazer |
| --- | --- | --- |
| **Jornal** (`journal_events`, página /jornal) | `routes/journal.ts` não filtra desclassificados. Os eventos continuam públicos. | Apagar à mão os eventos falsos (ver consultas) |
| **Mapa de calor** (`heatmap_events`) | É uma contagem por célula do mapa, sem vínculo com a run. | Não dá para reverter. Uma run só pesa poucas células; aceitar. |
| **Jornal diário** (`daily_news`, "abates de hoje") | `kills_today = max(0, total de hoje − total de ontem)`. Tirar uma run do total **reduz os abates do dia** em que isso acontece. | Registrar o motivo; o dia seguinte volta ao normal |
| **Mensagens no Discord** (morte, "#1 no rank", desclassificação) | Já foram enviadas. | Apagar no Discord, se preciso |
| **Cópia no histórico** (`run_history`) | Uma liberação por partida nova (antes da v4.28.5) arquivava a run. | Se a mesma run voltar à tabela `entries`, apagar a cópia duplicada |
| **Conquistas no banco** (`player_achievements`) | Ficam guardadas para o caso de reabilitação. | Apagar à mão só as geradas por código editado |

---

## Checklist de verificação

Rodar na VPS, com o banco de produção:

```bash
ssh -i ~/.ssh/id_ed25519 root@179.199.141.241
cd /var/www/pzrank/backend && DBURL=$(grep -E "^DATABASE_URL=" .env | cut -d= -f2-)
```

1. **Estado da run e histórico:**
   ```sql
   select id, sandbox_ok, disqualification_reason, disqualified_at, days, time_raw, kills, score, record_score, flagged_reason, mod_version
     from entries where id = <ID>;
   select id, sandbox_ok, disqualification_reason, days, kills, source, run_ended_at
     from run_history where entry_id = <ID> or character_name = '<NOME>';
   ```
2. **O total oficial bate com o banco?** Deve ser igual ao `total_kills` de `curl -s localhost:3000/stats/global`, com diferença de poucas centenas (jogadores de teste ficam de fora):
   ```sql
   select (select sum(kills) from entries where deleted_at is null and sandbox_ok is not false)
        + (select sum(kills) from run_history where sandbox_ok is not false);
   ```
3. **Linha do tempo no Jornal** (anúncios repetidos ou impossíveis):
   ```sql
   select id, type, data, created_at from journal_events where char_name = '<NOME>' order by created_at;
   ```
4. **Conquistas da run** (horários concentrados em poucos minutos = suspeito):
   ```sql
   select pa.id, a.name, pa.unlocked_at from player_achievements pa
     join achievements a on a.id = pa.achievement_id where pa.entry_id = <ID> order by pa.unlocked_at;
   ```
5. **Jornal diário dos últimos dias** (queda ou salto fora do normal):
   ```sql
   select date, stats::jsonb->>'total_kills', stats::jsonb->>'kills_today' from daily_news order by date desc limit 7;
   ```
6. **Log do servidor** (recusas, liberações e desclassificações):
   ```bash
   grep -h -E "<NOME>|player=<NICK>" /root/.pm2/logs/pzrank-api-out.log | tail -30
   ```
7. **Comparação de taxa** (abates por hora de jogo, runs com 1+ dia). Mediana ~0,9/h; o 1% mais rápido fica em ~10/h:
   ```sql
   select character_name, kills, round(kills::numeric/(time_raw/60.0),1) from entries
    where time_raw >= 1440 order by kills::numeric/time_raw desc limit 10;
   ```

Antes de apagar dados de produção, salve as linhas em `/var/backups/pzrank/pontuais/`
(`\copy (select ...) to '<arquivo>.csv' csv header`).

---

## Casos registrados

### Anastacia Glubby (jogador *allonso*) — código de rank editado, 29/09/2026

- **O que aconteceu:** entre 00:43 e 00:53 (Brasília) chegaram 4 códigos editados. Um maxava as habilidades de combate; outro, as de construção e mira; um trazia 400.000 abates; o último, uma "morte" com 400.000 abates, 41.700 pontos e 1º lugar no ranking, em 56 h de jogo (7.126 abates/h).
- **Evidências:**
  - o código dizia "mod 2.27.0" (a versão mínima aceita), mas 7 minutos depois o mesmo jogador sincronizou outra run com a 2.31.0;
  - as habilidades caíram de 7-10 para 0 entre os envios;
  - não veio causa da morte nem arquivo de estatísticas.
- **Decisão:** desclassificação manual por *camarada pz* (02:24). Depois a run foi reabilitada como personagem de teste e **zerada**.
- **Limpeza feita:** 65 conquistas apagadas (backup em `/var/backups/pzrank/pontuais/conquistas-anastacia-glubby-2026-09-29.csv`); 17 eventos falsos apagados do Jornal; todos os números da run zerados.
- **Impacto que ficou:**
  - o aviso "#1 no rank" no Discord;
  - as células do mapa de calor, se houver: a run não enviou pontos;
  - o Jornal diário de 30/09 não registrou os 400 mil, porque a foto do dia foi tirada fora da janela em que a run valia.
- **Resultado:** as travas de abates (v4.28.2) e de habilidades (v4.28.3) foram criadas por causa deste caso.

### Chris Pereira (jogador *Pé de Pano*) — desclassificação desfeita pela brecha de partida nova, 30/09/2026

- **O que aconteceu:**
  - ~10:30 (Brasília): desclassificado por sandbox alterado (217 dias, 19.308 abates).
  - 10:30:51: chegou um sync de personagem novo com o mesmo nome (até 1 dia), que liberou a vaga pela regra da v4.27.2.
  - 10:40:51: o save antigo voltou sem a marca de violação (só 11 min de jogo depois) e foi aceito como continuação. A run voltou ao ranking sem decisão de moderador.
- **Sintoma que chamou atenção:** o Jornal anunciou de novo, ao mesmo tempo, 6 habilidades que já estavam no nível 10 desde 12/09 a 27/09. As habilidades em si subiram de forma normal.
- **Não confirmado:** se o sandbox foi mesmo alterado. O sandbox exportado às 16:16 bate com o preset em 268 configurações, mas o mod reaplica o preset a cada carregamento. Para confirmar, é preciso o `PZRank_log.txt` do jogador (linhas "esperado=... atual=..." perto das 10:30).
- **Decisão:** desclassificação restaurada (motivo "sandbox", desde 30/09 10:30, com nota). Brecha fechada na v4.28.5.
- **Limpeza feita:** cópia duplicada da run no histórico apagada (`run_history` 1989); 7 anúncios repetidos apagados do Jornal.
- **Impacto nas estatísticas oficiais** (a run saiu de todas as contas):

  | Número | Efeito |
  | --- | --- |
  | Total de abates | −19.308 |
  | Total de dias sobrevividos | −217 |
  | Vivos | −1 |
  | Ranking | saiu da 30ª posição (15.431 pontos); quem estava abaixo subiu uma |
  | /estatisticas | −1 em profissão (Segurança), cidade inicial (Rosewood), armas, ações e traços |
  | Conquistas no perfil | 62 conquistas da run deixaram de aparecer (continuam no banco) |
  | Jornal diário de 01/10 | os "abates de hoje" vão aparecer ~19.308 menores, porque a foto de 30/09 ainda incluía a run |
  | Jornal | os anúncios originais (12/09 a 27/09) continuam públicos |
  | Mapa de calor | as contribuições da run continuam (não é reversível) |

- **Outros que usaram a liberação por partida nova** (26/09 a 30/09), todos com partida nova de verdade, mantidos: lSinistro (Rastelli), Flokizerah (Floki Rocha), Giovani (Giovani CVS).

### Outros casos da mesma semana

- **cocranmac (Carrie Woody), 26/09:** debug por engano. O log mostrou ~1 min de sessão em debug, sem ganho. Levou à criação da anistia de debug (v4.28.0).
- **n4ndo (n4ndo xd), 28-29/09:** anistiado; depois desclassificado de novo por falso positivo (marca antiga sem hora, carimbada ao atualizar o mod). Anistia refeita por moderador. Levou à hora estimada (`debug_est`, mod 2.31.1 + v4.28.2).
- **Gaerhiel (Basile Rapay), 29/09:** suspeita de debug não detectado. **Pendente:** `PZRank_log.txt` e horários da live. O mod 2.31.1 passou a checar o debug no carregamento do save.
