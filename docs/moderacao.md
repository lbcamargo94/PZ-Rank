# Moderação: desclassificações, dados manipulados e impacto nas estatísticas

Guia para verificar o que acontece com os números do campeonato quando uma run é
desclassificada, reabilitada ou corrigida à mão, e registro dos casos já tratados.
Complementa [estatisticas.md](estatisticas.md) (como cada estatística é calculada).

Última revisão: 2026-10-08 (v4.29.0).

---

## Regras em vigor

| Regra | Onde | Desde |
| --- | --- | --- |
| **Sandbox, debug e manual desclassificam de vez.** Todo sync com o nome do personagem recebe `disqualified: true`, inclusive partida nova. Variações do nome (maiúsculas, acentos, espaços) contam como o mesmo nome. Só o moderador reabilita. | `routes/sync.ts`, `normalizeCharName` em `lib/runHistory.ts` | v4.28.5 |
| **Mods não desclassificam de vez:** o primeiro sync sem o mod proibido reabilita a run. | `isModsReason` em `routes/sync.ts` | antigo |
| **Moderador não modera a própria conta ou run:** qualquer ação (objetivos, anomalia, status, desclassificar, reabilitar, excluir…) cujo alvo é o jogador com o mesmo nome do login do moderador é recusada com 403; outro moderador faz a ação. Vale para o master. | `lib/selfModeration.ts` | v4.30.6 |
| **Abates impossíveis são recusados:** mais de 300 + 50 por hora de jogo no total (anomalia `implausible_kills`), ou mais de 1.000 + 50 por hora de jogo no salto entre dois syncs (anomalia `implausible_kills_jump`; a folga do salto era 300 até a v4.30.5, ver caso Bone). A run fica com os dados anteriores. | `lib/plausibility.ts` | v4.28.2 / v4.30.5 |
| **Habilidades impossíveis são recusadas:** soma de níveis (fora Aptidão Física e Força) acima de 40 + 1 por hora de jogo, ou salto acima de 10 + 1/h entre syncs. Anomalia `implausible_skills`. | `lib/plausibility.ts` | v4.28.3 |
| **Habilidade que diminuiu só gera aviso** (`skills_regression:<habilidade> <antes>><depois>`). O sync é aceito, porque o B42.19 renomeou IDs e um mod com mapeamento errado informa 0. | `lib/plausibility.ts` | v4.28.3 |
| **Anistia de debug:** reabilitar uma run desclassificada por debug exige nota pública e perdoa o debug só até a hora registrada. | `lib/debugAmnesty.ts` | v4.28.0 |
| **Personagem morto não volta:** run morta + código do mesmo personagem vivo só vira partida nova se tiver até 1 dia de jogo (a morte vai pro histórico). Vivo com mais de 1 dia = save restaurado de antes da morte: sync recusado, run continua morta, anomalia `resurrection_attempt`. Se for mesmo um personagem novo que só sincronizou depois, o moderador remove a run antiga para liberar o nome. | `aliveAfterDeath` em `lib/runHistory.ts` | v4.29.4 |
| **Trava de habilidades só compara runs estabelecidas:** salto e queda entre syncs só com 12 h+ de jogo e run anterior viva. O total vale sempre. | `canCompareSkills` em `lib/plausibility.ts` | v4.29.3 |
| **Registro das ações da moderação:** toda ação de moderador que dá certo em runs e jogadores (desclassificar, reabilitar, marcar viva/morta, limpar anomalia, bloquear, excluir etc.) vira uma linha em `moderation_log`: quem, quando, o quê e em qual run/jogador. E-mail e links entram só como "alterado". No painel: seção **Ações da moderação** no modal **Syncs** da run. | `lib/moderationLog.ts` | v4.29.5 |
| **Histórico de syncs:** todo sync decodificado vira uma linha em `sync_history` com o resultado (aceito, recusado, desclassificado, mod desatualizado), inclusive os que não mudam a run. Retenção de 90 dias (cron `/cron/prune-sync-history`). No painel: botão **Syncs** em cada run. | `lib/syncHistory.ts` | v4.29.0 |

A v4.27.2 permitia recomeçar com o mesmo nome (partida nova com até 1 dia de jogo).
Isso foi **removido na v4.28.5** porque virou brecha (caso Chris Pereira, abaixo).

### Mudanças no preset do desafio

| Data | Configuração | Antes → depois | Motivo |
| --- | --- | --- | --- |
| 10/10/2026 (mod 2.32.0) | Reanimação de Zumbis que Parecem Mortos (`ZombieLore.DisableFakeDead`) | 2 (mundo **e** abatidos pelo jogador) → 1 (só zumbis do mundo) | Desempenho: hordas abatidas deixavam zumbis "fingindo de mortos" ativos perto do jogador (proposta dos jogadores) |

**Fora da verificação (mod 2.32.1, 10/10/2026):** por decisão da organização, essa opção
deixou de ser conferida. O valor 1 do preset continua sendo aplicado quando o save carrega,
mas divergência não corrige nem desclassifica. Fica em `UNVERIFIED_KEYS` no
`RankSandbox.lua` e com `unverified: true` em `frontend/src/lib/sandboxRules.ts` (o painel
não acusa). Substituiu a carência com prazo da 2.32.0. Para voltar a verificar, tirar a
chave das duas listas e publicar uma versão nova do mod.

**Versão mínima (agendada):** o script `/usr/local/bin/pzrank-bump-min-mod.sh` na VPS roda
todo dia às 12:00 UTC (09:00 de Brasília) a partir de 15/10/2026. Ele sobe `MIN_MOD_VERSION`
para 2.32.1 quando pelo menos 95% das runs que sincronizaram nos últimos 3 dias (mínimo de 20)
já estiverem na 2.32.1. Faz backup do `.env`, reinicia a API, confere o `/health` e remove a
própria linha do crontab. Cada execução fica registrada em `/var/log/pzrank-cron.log`
(`grep bump-min-mod`). Teste sem alterar nada: `DRY_RUN=1 /usr/local/bin/pzrank-bump-min-mod.sh`.

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
| Jornal (`GET /journal`, página /jornal) | Os eventos da run (do início dela em diante) somem, mas **continuam no banco** e voltam se a run for reabilitada. Runs anteriores legítimas com o mesmo nome continuam aparecendo (`lib/journalFilter.ts`, desde v4.29.4) |
| Fechamento de temporada / Hall da Fama | Usa as mesmas regras oficiais |

## O que NÃO se ajusta sozinho

| Onde | Por quê | O que fazer |
| --- | --- | --- |
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

0. **Linha do tempo dos syncs** (a partir de 08/10/2026; antes disso não existe). No painel, botão **Syncs** na run, ou:
   ```sql
   select at, result, detail, time_raw, kills, score, sandbox_ok, code_reason, mod_version, flagged
     from sync_history where entry_id = <ID> order by at;
   ```
   Mostra cada envio, inclusive os recusados pelas travas e os que chegaram com desclassificação.
   Teria resolvido direto os casos abaixo: os 4 códigos editados da Anastacia, a sequência
   desclassificação → personagem novo → save antigo do Chris e a última hora limpa do cocranmac.
0b. **Quem mexeu na run pelo painel** (a partir de 10/10/2026):
   ```sql
   select at, moderator_login, action, details from moderation_log where entry_id = <ID> order by at;
   select at, moderator_login, action, target, details from moderation_log where player_id = <PLAYER_ID> order by at;
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
  - o aviso "#1 no rank" no Discord — apagado pela organização em 10/10/2026;
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
- **Gaerhiel (Basile Rapay), 29/09 — encerrado sem punição em 10/10/2026.** Suspeita de debug não detectado em 28-29/09. O servidor nunca recebeu sync marcado com debug, e não chegaram o `PZRank_log.txt` nem os horários da live. De 08/10 a 10/10 o histórico de syncs registrou 99 envios, todos aceitos e limpos, com o mod 2.31.1 (que checa o debug ao carregar o save). Sem prova, não há base para desclassificar. Se surgir prova nova (gravação da live com o debug na tela), o caso pode ser reaberto. Levou à checagem do debug no carregamento do save (mod 2.31.1).

### Bone (Lenore Bostic) — falso positivo da trava de salto de abates, 18 e 20/10/2026

Syncs recusados como "abates impossíveis": +550 abates em 4,3 h de jogo (limite 514) e, hoje, picos parecidos. O total da run (≈10 abates/h) estava normal; o próximo sync com mais tempo de jogo passava com todos os abates — nenhum dado perdido. Ritmo de horda real: o Bone chega a ~500 abates por sync de 10 min, e Guto, Fricke e uDantt a 425–475 no mesmo intervalo. Correção (v4.30.5): folga fixa do salto entre syncs 300 → 1.000 e anomalia própria (`implausible_kills_jump`) que mostra o salto e o limite em vez do total. Anomalia da run limpa; sem punição.

Na mesma verificação: o próprio Bone (moderador `bone`) tinha limpado a anomalia da sua run 4 vezes (21–22/10) e editado os objetivos dela em 18/10 21:55 — a pontuação foi de 42.579 para 47.579 (+5.000) no sync seguinte. Correção (v4.30.6): bloqueio de moderação em causa própria. Os +5.000 foram conferidos pelo master nas VODs em 22/10/2026: as bases existem e os pontos ficam. Caso encerrado.
