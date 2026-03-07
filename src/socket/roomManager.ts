import { randomUUID } from 'crypto';
import { RedisService } from '../services/redisService';

export class RoomManager {
  constructor(private redis: RedisService) {}

  async assignRoom(deviceId: string, nearbyDeviceIds: string[]): Promise<string> {
    // 주변 기기 중 이미 방이 있는 첫 번째 기기를 찾아 합류
    for (const peerId of nearbyDeviceIds) {
      const peer = await this.redis.getUserSession(peerId);
      if (peer?.roomId) {
        return peer.roomId;
      }
    }
    // 아무도 방이 없으면 새 방 생성
    return `room-${randomUUID()}`;
  }
}
