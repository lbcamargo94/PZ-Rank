"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../supabase");
const decoder_1 = require("../lib/decoder");
const errors_1 = require("../lib/errors");
const moderator_1 = require("../middleware/moderator");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const SORT_COLS = {
    days: 'days',
    kills: 'kills',
    time: 'time_raw',
};
// GET /entries?sort=days|kills|time — público
router.get('/', async (req, res) => {
    const col = SORT_COLS[typeof req.query.sort === 'string' ? req.query.sort : ''] ?? 'days';
    const { data, error } = await supabase_1.supabase
        .from(config_1.config.tableName)
        .select('*')
        .order(col, { ascending: false });
    if (error) {
        const e = (0, errors_1.dbError)(error);
        res.status(e.httpStatus).json({ error: e.message });
        return;
    }
    res.json(data);
});
// POST /entries — moderador: valida código + insere entrada
router.post('/', moderator_1.requireModerator, async (req, res) => {
    const { player_id, code, live_url } = req.body;
    if (!player_id || typeof player_id !== 'number') {
        res.status(400).json({ error: 'player_id é obrigatório.' });
        return;
    }
    if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Código PZRX1 é obrigatório.' });
        return;
    }
    const decoded = (0, decoder_1.parsePzrCode)(code);
    if (!decoded) {
        res.status(400).json({ error: 'Código inválido ou corrompido.' });
        return;
    }
    // Busca o nick do jogador aprovado
    const { data: player, error: playerError } = await supabase_1.supabase
        .from('players')
        .select('id, nick, status')
        .eq('id', player_id)
        .single();
    if (playerError || !player) {
        res.status(404).json({ error: 'Jogador não encontrado.' });
        return;
    }
    if (player.status !== 'approved') {
        res.status(400).json({ error: 'Jogador não está aprovado no ranking.' });
        return;
    }
    const entry = {
        player_id,
        moderator_id: req.userId,
        name: player.nick,
        character_name: decoded.characterName,
        profession: decoded.profession,
        days: decoded.days,
        time_raw: decoded.timeRaw,
        time_str: decoded.timeStr,
        kills: decoded.kills,
        skills: decoded.skills.join(', ') || null,
        live_url: live_url?.trim() || null,
    };
    const { data, error } = await supabase_1.supabase
        .from(config_1.config.tableName)
        .insert([entry])
        .select()
        .single();
    if (error) {
        res.status(500).json({ error: (0, errors_1.dbError)(error).message });
        return;
    }
    res.status(201).json(data);
});
// DELETE /entries/:id — moderador
router.delete('/:id', moderator_1.requireModerator, async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
    }
    const { data: existing, error: fetchError } = await supabase_1.supabase
        .from(config_1.config.tableName)
        .select('id, moderator_id')
        .eq('id', id)
        .single();
    if (fetchError || !existing) {
        res.status(404).json({ error: 'Entrada não encontrada.' });
        return;
    }
    // Somente o moderador que criou ou o master pode deletar
    const row = existing;
    if (req.modRole !== 'master' && row.moderator_id !== req.userId) {
        res.status(403).json({ error: 'Sem permissão para remover esta entrada.' });
        return;
    }
    const { error } = await supabase_1.supabase.from(config_1.config.tableName).delete().eq('id', id);
    if (error) {
        res.status(500).json({ error: (0, errors_1.dbError)(error).message });
        return;
    }
    res.status(204).send();
});
exports.default = router;
