export type TransportType = 'bus' | 'subway';

export interface GpsCoordinate {
  lat: number;
  lng: number;
}

export interface UserSession {
  deviceId: string;
  roomId: string;
  transportType: TransportType;
  routeId: string;
  destinationStopId: string;
  destinationStopName: string;
  destinationStopIndex: number;
  currentGps: GpsCoordinate;
  isPrivate: boolean;
  lastSeen: string; // ISO8601
}

export interface RankedUser {
  deviceId: string;
  destinationStopName: string;
  remainingStops: number;
  rank: number;
  currentGps: GpsCoordinate;
  isPrivate: boolean;
}

// Server-internal type — never broadcast directly to clients.
// Clients receive only { roomId, rankedUsers: RankedUser[] } via room_update event.
export interface RoomState {
  roomId: string;
  users: UserSession[];
  rankedUsers: RankedUser[];
  currentStopIndex: number;
}
