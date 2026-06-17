"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireModerator = requireModerator;
exports.requireMaster = requireMaster;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function authenticate(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token não fornecido.' });
        return false;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(authHeader.slice(7), config_1.config.jwtSecret);
        req.userId = payload.sub;
        req.modRole = payload.role;
        return true;
    }
    catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
        return false;
    }
}
function requireModerator(req, res, next) {
    if (!authenticate(req, res))
        return;
    next();
}
function requireMaster(req, res, next) {
    if (!authenticate(req, res))
        return;
    if (req.modRole !== 'master') {
        res.status(403).json({ error: 'Acesso restrito ao moderador master.' });
        return;
    }
    next();
}
