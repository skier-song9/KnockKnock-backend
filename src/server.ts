import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RedisService } from './services/redisService';
import { RoomManager } from './socket/roomManager';
import { RankingService } from './services/rankingService';
import { registerHandlers } from './socket/handlers';

export function createApp(redisUrl: string) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  const redis = new RedisService(redisUrl);
  const roomManager = new RoomManager(redis);
  const ranking = new RankingService();

  registerHandlers(io, redis, roomManager, ranking);

  return { app, httpServer, io };
}
