import Redis from 'ioredis';
import { UserSession } from '../types';

const SESSION_TTL = 60 * 60 * 2; // 2시간

export class RedisService {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, { lazyConnect: true });
  }

  async setUserSession(user: UserSession): Promise<void> {
    const key = `user:${user.deviceId}`;
    await this.client.setex(key, SESSION_TTL, JSON.stringify(user));
    // 룸 인덱스: room:{roomId} → Set of deviceIds
    await this.client.sadd(`room:${user.roomId}`, user.deviceId);
    await this.client.expire(`room:${user.roomId}`, SESSION_TTL);
  }

  async getUserSession(deviceId: string): Promise<UserSession | null> {
    const data = await this.client.get(`user:${deviceId}`);
    return data ? (JSON.parse(data) as UserSession) : null;
  }

  async deleteUserSession(deviceId: string): Promise<void> {
    const session = await this.getUserSession(deviceId);
    if (session) {
      await this.client.srem(`room:${session.roomId}`, deviceId);
    }
    await this.client.del(`user:${deviceId}`);
  }

  async getRoomUsers(roomId: string): Promise<UserSession[]> {
    const deviceIds = await this.client.smembers(`room:${roomId}`);
    const sessions = await Promise.all(
      deviceIds.map(id => this.getUserSession(id))
    );
    return sessions.filter((s): s is UserSession => s !== null);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
