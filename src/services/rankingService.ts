import { UserSession, RankedUser } from '../types';

export class RankingService {
  rank(users: UserSession[], currentStopIndex: number): RankedUser[] {
    return users
      .filter(u => !u.isPrivate)
      .filter(u => u.destinationStopIndex > currentStopIndex)
      .map(u => ({
        deviceId: u.deviceId,
        destinationStopName: u.destinationStopName,
        remainingStops: u.destinationStopIndex - currentStopIndex,
        rank: 0, // 임시, 아래서 할당
        currentGps: u.currentGps,
        isPrivate: false,
      }))
      .sort((a, b) => a.remainingStops - b.remainingStops)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));
  }
}
