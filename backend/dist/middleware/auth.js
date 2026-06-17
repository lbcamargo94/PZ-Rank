"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_1 = require("../supabase");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token não fornecido.' });
        return;
    }
    const token = authHeader.slice(7);
    const { data, error } = await supabase_1.supabase.auth.getUser(token);
    if (error || !data.user) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
        return;
    }
    req.userId = data.user.id;
    next();
}
