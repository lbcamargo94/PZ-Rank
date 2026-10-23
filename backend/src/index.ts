import { createApp } from './app';
import { config } from './config';

const app = createApp();

// HOST=127.0.0.1 em produção: a API só aceita conexões locais (Nginx e cron), mesmo se o
// firewall falhar. Sem HOST (dev) escuta em todas as interfaces, como antes.
const host = process.env.HOST?.trim() || undefined;
const onListen = () => console.log(`[PZRank] Backend rodando em http://${host ?? 'localhost'}:${config.port}`);
if (host) app.listen(config.port, host, onListen);
else      app.listen(config.port, onListen);
