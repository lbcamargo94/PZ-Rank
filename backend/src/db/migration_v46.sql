-- migration_v46 (dados): data da desclassificação para sandbox/debug.
-- Até a v4.27.2 o sync não gravava disqualified_at nesses casos (só nos de mods).
-- A melhor aproximação é o último sync gravado da run (o sync desclassificado não
-- grava mais nada depois). Idempotente: só preenche onde está nulo.
UPDATE entries
   SET disqualified_at = updated_at::timestamptz
 WHERE sandbox_ok = false
   AND disqualified_at IS NULL
   AND updated_at IS NOT NULL
   AND split_part(coalesce(disqualification_reason, 'sandbox'), ':', 1) IN ('sandbox', 'debug');
