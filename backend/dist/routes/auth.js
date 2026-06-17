"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateSupabaseError = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../supabase");
const errors_1 = require("../lib/errors");
Object.defineProperty(exports, "translateSupabaseError", { enumerable: true, get: function () { return errors_1.translateSupabaseError; } });
const config_1 = require("../config");
const router = (0, express_1.Router)();
// Login: verifica credenciais na tabela moderators e retorna JWT próprio
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }
    try {
        const { data: mod, error } = await supabase_1.supabase
            .from('moderators')
            .select('id, email, role, password_hash')
            .eq('email', email.trim().toLowerCase())
            .single();
        if (error || !mod) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }
        const modRow = mod;
        const valid = await bcryptjs_1.default.compare(password, modRow.password_hash);
        if (!valid) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ sub: modRow.id, role: modRow.role }, config_1.config.jwtSecret, { expiresIn: '8h' });
        res.json({
            session: { access_token: token },
            user: { email: modRow.email },
            role: modRow.role,
        });
    }
    catch (err) {
        console.error('[POST /auth/login] Erro inesperado:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});
router.post('/logout', (_req, res) => {
    // JWT é stateless — basta o cliente descartar o token
    res.status(204).send();
});
// Mantido para compatibilidade caso necessário no futuro
router.post('/signup', async (_req, res) => {
    res.status(403).json({ error: 'Cadastro direto não permitido. Use o painel de moderadores.' });
});
exports.default = router;
