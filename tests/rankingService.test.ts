import { RankingService } from '../src/services/rankingService';
import { UserSession } from '../src/types';

const makeUser = (id: string, stopIndex: number, isPrivate = false): UserSession => ({
  deviceId: id,
  roomId: 'room-001',
  transportType: 'bus',
  routeId: '273',
  destinationStopId: `stop-${stopIndex}`,
  destinationStopName: `정류장${stopIndex}`,
  destinationStopIndex: stopIndex,
  currentGps: { lat: 37.497, lng: 127.027 },
  isPrivate,
  lastSeen: new Date().toISOString(),
});

describe('RankingService', () => {
  const service = new RankingService();

  it('should rank users by remaining stops ascending', () => {
    const users = [
      makeUser('A', 15), // 남은 정류장: 15 - 10 = 5
      makeUser('B', 12), // 남은 정류장: 12 - 10 = 2 ← rank 1
      makeUser('C', 14), // 남은 정류장: 14 - 10 = 4
    ];
    const result = service.rank(users, 10);
    expect(result[0].deviceId).toBe('B');
    expect(result[0].rank).toBe(1);
    expect(result[0].remainingStops).toBe(2);
    expect(result[1].deviceId).toBe('C');
    expect(result[2].deviceId).toBe('A');
  });

  it('should exclude private users from ranking', () => {
    const users = [
      makeUser('A', 12),
      makeUser('B', 11, true), // private
      makeUser('C', 15),
    ];
    const result = service.rank(users, 10);
    expect(result.length).toBe(2);
    expect(result.find(u => u.deviceId === 'B')).toBeUndefined();
  });

  it('should exclude users whose destination has already passed', () => {
    const users = [
      makeUser('A', 8),  // 이미 지남 (8 < currentStop 10)
      makeUser('B', 12),
    ];
    const result = service.rank(users, 10);
    expect(result.length).toBe(1);
    expect(result[0].deviceId).toBe('B');
  });

  it('should return empty array when no visible users', () => {
    const users = [makeUser('A', 12, true)];
    const result = service.rank(users, 10);
    expect(result).toHaveLength(0);
  });
});
