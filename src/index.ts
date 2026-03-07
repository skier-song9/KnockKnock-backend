import { createApp } from './server';

const PORT = Number(process.env.PORT) || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const { httpServer } = createApp(REDIS_URL);

httpServer.listen(PORT, () => {
  console.log(`[Server] running on port ${PORT}`);
});
