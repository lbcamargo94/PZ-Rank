"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabase_1 = require("../supabase");
const errors_1 = require("../lib/errors");
const moderator_1 = require("../middleware/moderator");
const router = (0, express_1.Router)();
// GET /moderators — master
router.get('/', moderator_1.requireMaster, async (_req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('moderators')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: true });
        if (error) {
            const e = (0, errors_1.dbError)(error);
            res.status(e.httpStatus).json({ error: e.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        console.error('[GET /moderators] Erro inesperado:', err);
        res.status(500).json({ error: 'Erro interno ao buscar moderadores.' });
    }
});
// POST /moderators — master: cria novo moderador com senha hasheada
router.post('/', moderator_1.requireMaster, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
    }
    try {
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        const { data, error } = await supabase_1.supabase
            .from('moderators')
            .insert([{ email: email.trim().toLowerCase(), role: 'moderator', password_hash }])
            .select('id, email, role, created_at')
            .single();
        if (error) {
            const msg = error.code === '23505'
                ? 'Este e-mail já está cadastrado como moderador.'
                : (0, errors_1.translateSupabaseError)(error.message);
            res.status(error.code === '23505' ? 400 : 500).json({ error: msg });
            return;
        }
        res.status(201).json(data);
    }
    catch (err) {
        console.error('[POST /moderators] Erro inesperado:', err);
        res.status(500).json({ error: 'Erro interno ao criar moderador.' });
    }
});
// DELETE /moderators/:id — master
router.delete('/:id', moderator_1.requireMaster, async (req, res) => {
    const targetId = String(req.params.id);
    if (targetId === req.userId) {
        res.status(400).json({ error: 'Você não pode remover sua própria conta de moderador.' });
        return;
    }
    try {
        const { data: target } = await supabase_1.supabase
            .from('moderators')
            .select('role')
            .eq('id', targetId)
            .single();
        if (target?.role === 'master') {
            res.status(400).json({ error: 'Não é possível remover outro moderador master.' });
            return;
        }
        const { error } = await supabase_1.supabase.from('moderators').delete().eq('id', targetId);
        if (error) {
            const e = (0, errors_1.dbError)(error);
            res.status(e.httpStatus).json({ error: e.message });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('[DELETE /moderators/:id] Erro inesperado:', err);
        res.status(500).json({ error: 'Erro interno ao remover moderador.' });
    }
});
exports.default = router;
