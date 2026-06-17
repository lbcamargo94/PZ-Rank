"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateSupabaseError = translateSupabaseError;
exports.dbError = dbError;
const MESSAGES = {
    // Auth
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'E-mail ainda não confirmado.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
    'Signup requires a valid password': 'Informe uma senha válida.',
    'Token has expired or is invalid': 'Sessão expirada. Faça login novamente.',
    // RLS / permissão
    'new row violates row-level security policy': 'Sem permissão para gravar. Verifique a service role key do servidor.',
    'violates row-level security policy': 'Acesso negado pelo banco de dados.',
    // Constraints
    'violates unique constraint': 'Já existe um registro com esse valor.',
    'violates check constraint': 'Valor inválido para o campo.',
    'violates foreign key constraint': 'Referência inválida — registro relacionado não encontrado.',
    'not-null constraint': 'Campo obrigatório não pode ser vazio.',
    // Conexão / genérico
    'connection refused': 'Não foi possível conectar ao banco de dados.',
    'timeout': 'Tempo de resposta do banco de dados esgotado. Tente novamente.',
    'JSON object requested, multiple (or no) rows returned': 'Registro não encontrado.',
};
function translateSupabaseError(message) {
    for (const [en, pt] of Object.entries(MESSAGES)) {
        if (message.includes(en))
            return pt;
    }
    return message;
}
function dbError(error, status = 500) {
    // Erros de constraint (origem do cliente) → 400; erros de servidor → 500
    const clientCodes = new Set(['23505', '23502', '23503', '23514', '42P01']);
    const httpStatus = clientCodes.has(error.code ?? '') ? 400 : status;
    return { httpStatus, message: translateSupabaseError(error.message) };
}
