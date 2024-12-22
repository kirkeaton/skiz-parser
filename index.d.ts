export interface SkizBatteryUsage {
  level: number;
  status: string;
  timestamp: Date;
}

export interface SkizRelativeAltitude {
  pressure: number;
  relativeAltitude: number;
  timestamp: Date;
}

export interface SkizTrackEvent {
  end: Date;
  start: Date;
  type: string;
}

export interface SkizTrackNode {
  altitude: number;
  hAccuracy: number;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  vAccuracy: number;
  velocity: number;
}

export interface SkizTrackSegmentMetrics {
  distance: number;
  finishAltitude: number;
  maxAltitude: number;
  maxSlope: number;
  maxSpeed: number;
  minAltitude: number;
  slope: number;
  speed: number;
  startAltitude: number;
  time: number;
  vertical: number;
}

export interface SkizTrackSegment {
  category: string;
  comment: string;
  endTime: Date;
  link: string;
  metrics: SkizTrackSegmentMetrics;
  name: string;
  number: number;
  startTime: Date;
  type: string;
  uuid: string;
}

export interface SkizTrackMetrics {
  ascentDistance: number;
  ascents: number;
  averageAscentSpeed: number;
  averageDescentSpeed: number;
  averageSpeed: number;
  descentDistance: number;
  descents: number;
  distance: number;
  duration: number;
  finishAltitude: number;
  laps: number;
  maxAltitude: number;
  maxAscentSpeed: number;
  maxAscentSteepness: number;
  maxDescentSpeed: number;
  maxDescentSteepness: number;
  maxSpeed: number;
  maxVerticalAscentSpeed: number;
  maxVerticalDescentSpeed: number;
  minAltitude: number;
  movingAverageAscentSpeed: number;
  movingAverageDescentSpeed: number;
  movingAverageSpeed: number;
  profileDistance: number;
  startAltitude: number;
  totalAscent: number;
  totalDescent: number;
}

export interface SkizTrack {
  activity: string;
  batteryUsage: SkizBatteryUsage[];
  conditions: string;
  description: string;
  duration: number;
  finish: Date;
  hidden: boolean;
  includeInSeason: boolean;
  name: string;
  parseObjectId: string;
  platform: string;
  rating: number;
  relativeAltitude: SkizRelativeAltitude[];
  start: Date;
  syncIdentifier: string;
  syncVersion: number;
  trackEvents: SkizTrackEvent[];
  trackMetrics: SkizTrackMetrics;
  trackNodes: SkizTrackNode[];
  trackSegments: SkizTrackSegment[];
  tz: string;
  version: string;
  weather: string;
}

export function parseSkizFile(
  contents: ArrayBuffer | Buffer
): Promise<SkizTrack>;
