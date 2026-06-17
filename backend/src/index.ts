import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[PZRank] Backend rodando em http://localhost:${config.port}`);
});
