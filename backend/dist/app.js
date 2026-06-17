"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const auth_1 = __importDefault(require("./routes/auth"));
const entries_1 = __importDefault(require("./routes/entries"));
const players_1 = __importDefault(require("./routes/players"));
const moderators_1 = __importDefault(require("./routes/moderators"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    const allowedOrigins = config_1.config.corsOrigin.split(',').map(o => o.trim());
    app.use((0, cors_1.default)({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
                cb(null, true);
            }
            else {
                cb(new Error(`CORS bloqueado para a origem: ${origin}`));
            }
        },
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
    app.use('/auth', auth_1.default);
    app.use('/entries', entries_1.default);
    app.use('/players', players_1.default);
    app.use('/moderators', moderators_1.default);
    return app;
}
