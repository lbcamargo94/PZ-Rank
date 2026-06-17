"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function required(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
    return value;
}
exports.config = {
    port: parseInt(process.env.PORT ?? '3000', 10),
    supabaseUrl: required('SUPABASE_URL'),
    supabaseServiceKey: required('SUPABASE_SERVICE_KEY'),
    jwtSecret: required('JWT_SECRET'),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    tableName: process.env.TABLE_NAME ?? 'entries',
};
