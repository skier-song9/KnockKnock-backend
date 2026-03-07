import { RedisService } from '../src/services/redisService';
import { UserSession } from '../src/types';

const mockUser: UserSession = {
  deviceId: 'device-001',
  roomId: 'room-001',
  transportType: 'bus',
  routeId: '273',
  destinationStopId: 'stop-500',
  destinationStopName: '강남역',
  destinationStopIndex: 15,
  currentGps: { lat: 37.497, lng: 127.027 },
  isPrivate: false,
  lastSeen: new Date().toISOString(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeAll(() => {
    service = new RedisService(process.env.REDIS_URL || 'redis://localhost:6379');
  });

  afterEach(async () => {
    await service.deleteUserSession('device-001');
  });

  afterAll(async () => {
    await service.disconnect();
  });

  it('should save and retrieve a user session', async () => {
    await service.setUserSession(mockUser);
    const retrieved = await service.getUserSession('device-001');
    expect(retrieved).toMatchObject(mockUser);
  });

  it('should return null for non-existent user', async () => {
    const result = await service.getUserSession('non-existent');
    expect(result).toBeNull();
  });

  it('should delete a user session', async () => {
    await service.setUserSession(mockUser);
    await service.deleteUserSession('device-001');
    const result = await service.getUserSession('device-001');
    expect(result).toBeNull();
  });

  it('should get all users in a room', async () => {
    await service.setUserSession(mockUser);
    const roomUsers = await service.getRoomUsers('room-001');
    expect(roomUsers).toHaveLength(1);
    expect(roomUsers.find(u => u.deviceId === 'device-001')).toBeDefined();
  });
});
