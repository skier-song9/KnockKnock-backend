import { RoomManager } from '../src/socket/roomManager';
import { RedisService } from '../src/services/redisService';
import { UserSession } from '../src/types';

// RedisService mock
const mockRedis = {
  setUserSession: jest.fn(),
  getUserSession: jest.fn(),
  deleteUserSession: jest.fn(),
  getRoomUsers: jest.fn(),
} as unknown as RedisService;

const makeUser = (id: string, roomId = ''): UserSession => ({
  deviceId: id,
  roomId,
  transportType: 'bus',
  routeId: '273',
  destinationStopId: 'stop-15',
  destinationStopName: '강남역',
  destinationStopIndex: 15,
  currentGps: { lat: 37.497, lng: 127.027 },
  isPrivate: false,
  lastSeen: new Date().toISOString(),
});

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new RoomManager(mockRedis);
  });

  it('should create a new room when user has no nearby peers', async () => {
    (mockRedis.getUserSession as jest.Mock).mockResolvedValue(null);
    const roomId = await manager.assignRoom('device-A', []);
    expect(roomId).toMatch(/^room-/);
  });

  it('should join existing room when peer already has one', async () => {
    const existingUser = makeUser('device-B', 'room-existing-123');
    (mockRedis.getUserSession as jest.Mock).mockResolvedValue(existingUser);
    const roomId = await manager.assignRoom('device-A', ['device-B']);
    expect(roomId).toBe('room-existing-123');
  });

  it('should return first found room when multiple peers exist', async () => {
    (mockRedis.getUserSession as jest.Mock)
      .mockResolvedValueOnce(makeUser('device-B', 'room-001'))
      .mockResolvedValueOnce(makeUser('device-C', 'room-002'));
    const roomId = await manager.assignRoom('device-A', ['device-B', 'device-C']);
    expect(roomId).toBe('room-001');
  });
});
