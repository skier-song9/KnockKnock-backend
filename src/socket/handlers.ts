import { Server, Socket } from 'socket.io';
import { RedisService } from '../services/redisService';
import { RoomManager } from './roomManager';
import { RankingService } from '../services/rankingService';
import { UserSession } from '../types';

export function registerHandlers(
  io: Server,
  redis: RedisService,
  roomManager: RoomManager,
  ranking: RankingService
) {
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] connected: ${socket.id}`);

    socket.on('join_room', async (payload: {
      deviceId: string;
      nearbyDeviceIds: string[];
      currentStopIndex: number;
      session: Omit<UserSession, 'deviceId' | 'roomId'>;
    }) => {
      try {
        const roomId = await roomManager.assignRoom(
          payload.deviceId,
          payload.nearbyDeviceIds
        );

        const userSession: UserSession = {
          ...payload.session,
          deviceId: payload.deviceId,
          roomId,
          lastSeen: new Date().toISOString(),
        };

        await redis.setUserSession(userSession);
        socket.join(roomId);
        socket.data.deviceId = payload.deviceId;
        socket.data.roomId = roomId;
        socket.data.currentStopIndex = payload.currentStopIndex;

        await broadcastRoomUpdate(io, redis, ranking, roomId, payload.currentStopIndex);
      } catch (err) {
        console.error('[WS] join_room error:', err);
      }
    });

    socket.on('user_update', async (payload: Partial<UserSession> & { currentStopIndex?: number }) => {
      try {
        const deviceId = socket.data.deviceId as string | undefined;
        if (!deviceId) return;

        const existing = await redis.getUserSession(deviceId);
        if (!existing) return;

        const currentStopIndex = payload.currentStopIndex ?? (socket.data.currentStopIndex as number) ?? 0;
        if (payload.currentStopIndex !== undefined) {
          socket.data.currentStopIndex = payload.currentStopIndex;
        }

        const updated: UserSession = {
          ...existing,
          ...payload,
          deviceId,
          roomId: existing.roomId,
          lastSeen: new Date().toISOString(),
        };

        await redis.setUserSession(updated);
        await broadcastRoomUpdate(io, redis, ranking, existing.roomId, currentStopIndex);
      } catch (err) {
        console.error('[WS] user_update error:', err);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const deviceId = socket.data.deviceId as string | undefined;
        const roomId = socket.data.roomId as string | undefined;
        const currentStopIndex = (socket.data.currentStopIndex as number) ?? 0;
        if (!deviceId || !roomId) return;

        await redis.deleteUserSession(deviceId);
        io.to(roomId).emit('user_left', { deviceId });

        const remaining = await redis.getRoomUsers(roomId);
        if (remaining.length > 0) {
          await broadcastRoomUpdate(io, redis, ranking, roomId, currentStopIndex);
        }
      } catch (err) {
        console.error('[WS] disconnect error:', err);
      }
    });
  });
}

async function broadcastRoomUpdate(
  io: Server,
  redis: RedisService,
  ranking: RankingService,
  roomId: string,
  currentStopIndex: number
) {
  const users = await redis.getRoomUsers(roomId);
  const rankedUsers = ranking.rank(users, currentStopIndex);
  io.to(roomId).emit('room_update', { roomId, rankedUsers });
}
