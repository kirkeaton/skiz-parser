import { parse as CSVParser } from 'csv-parse';
import { XMLParser } from 'fast-xml-parser';
import type { Readable } from 'node:stream';
import { Entry, ZipFile, fromBuffer } from 'yauzl';

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

type SkizTrackXML = Omit<
  SkizTrack,
  | 'batteryUsage'
  | 'relativeAltitude'
  | 'trackEvents'
  | 'trackNodes'
  | 'trackSegments'
>;

interface SkizTrackEventXML {
  start: string;
  end: string;
  type: string;
}

const xmlParserOptions = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
};

const convertReadStreamToBuffer = (readStream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    readStream
      .on('error', reject)
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .once('end', () => {
        resolve(Buffer.concat(chunks));
      });
  });
};

const openReadStream = (zipFile: ZipFile, entry: Entry): Promise<Readable> => {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err, readStream) => {
      err ? reject(err) : resolve(readStream);
    });
  });
};

const parseBatteryCsvFile = (
  readStream: Readable
): Promise<SkizBatteryUsage[]> => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const batteryUsage: SkizBatteryUsage[] = [];

    parser
      .on('error', reject)
      .on('readable', () => {
        let record;

        while ((record = parser.read()) !== null) {
          batteryUsage.push({
            timestamp: new Date(record[0]),
            status: record[1],
            level: parseFloat(record[2]),
          });
        }
      })
      .once('end', () => {
        resolve(batteryUsage);
      });

    readStream.pipe(parser);
  });
};

const parseNodeCsvFile = (readStream: Readable): Promise<SkizTrackNode[]> => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const trackNodes: SkizTrackNode[] = [];

    parser
      .on('error', reject)
      .on('readable', () => {
        let record;

        while ((record = parser.read()) !== null) {
          trackNodes.push({
            timestamp: new Date(parseFloat(record[0]) * 1000.0),
            latitude: parseFloat(record[1]),
            longitude: parseFloat(record[2]),
            altitude: parseFloat(record[3]),
            heading: parseFloat(record[4]),
            velocity: parseFloat(record[5]),
            hAccuracy: parseFloat(record[6]),
            vAccuracy: parseFloat(record[7]),
          });
        }
      })
      .once('end', () => {
        resolve(trackNodes);
      });

    readStream.pipe(parser);
  });
};

const parseRelativeAltitudeSensorCsvFile = (
  readStream: Readable
): Promise<SkizRelativeAltitude[]> => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const relativeAltitude: SkizRelativeAltitude[] = [];

    readStream.pipe(parser);

    parser
      .on('error', reject)
      .on('readable', () => {
        let record;

        while ((record = parser.read()) !== null) {
          relativeAltitude.push({
            timestamp: new Date(record[0]),
            pressure: parseFloat(record[1]),
            relativeAltitude: parseFloat(record[2]),
          });
        }
      })
      .once('end', () => {
        resolve(relativeAltitude);
      });
  });
};

const parseSegmentCsvFile = (
  readStream: Readable
): Promise<SkizTrackSegment[]> => {
  const parser = CSVParser({ fromLine: 2 });

  return new Promise((resolve, reject) => {
    const trackSegments: SkizTrackSegment[] = [];

    parser
      .on('error', reject)
      .on('readable', () => {
        let record;

        while ((record = parser.read()) !== null) {
          trackSegments.push({
            startTime: new Date(parseFloat(record[0]) * 1000),
            endTime: new Date(parseFloat(record[1]) * 1000),
            number: parseInt(record[4], 10),
            name: record[5],
            comment: record[6],
            type: record[7],
            category: record[8],
            link: record[9],
            uuid: record[10],
            metrics: {
              time: parseFloat(record[11]),
              speed: parseFloat(record[12]),
              distance: parseFloat(record[13]),
              vertical: parseFloat(record[14]),
              maxSpeed: parseFloat(record[15]),
              slope: parseFloat(record[16]),
              maxSlope: parseFloat(record[17]),
              minAltitude: parseFloat(record[18]),
              maxAltitude: parseFloat(record[19]),
              startAltitude: parseFloat(record[20]),
              finishAltitude: parseFloat(record[21]),
            },
          });
        }
      })
      .once('end', () => {
        resolve(trackSegments);
      });

    readStream.pipe(parser);
  });
};

const parseTrackXmlFile = async (
  readStream: Readable
): Promise<SkizTrackXML> => {
  const buffer = await convertReadStreamToBuffer(readStream);
  const parser = new XMLParser(xmlParserOptions);
  const parsed = parser.parse(buffer.toString('utf-8'));

  const track = parsed.track;
  const metrics = track.metrics;

  return {
    rating: parseInt(track.rating, 10),
    start: new Date(Date.parse(track.start)),
    finish: new Date(Date.parse(track.finish)),
    description: track.description,
    version: track.version,
    parseObjectId: track.parseObjectId,
    tz: track.tz,
    includeInSeason: track.includeinseason === 'true',
    syncIdentifier: track.syncIdentifier,
    conditions: track.conditions,
    platform: track.platform,
    weather: track.weather,
    activity: track.activity,
    hidden: track.hidden === 'true',
    duration: parseFloat(track.duration),
    name: track.name,
    syncVersion: parseInt(track.syncVersion, 10),
    trackMetrics: {
      maxSpeed: metrics.maxspeed,
      maxDescentSpeed: metrics.maxdescentspeed,
      maxAscentSpeed: metrics.maxascentspeed,
      maxDescentSteepness: metrics.maxdescentsteepness,
      maxAscentSteepness: metrics.maxascentsteepness,
      maxVerticalDescentSpeed: metrics.maxverticaldescentspeed,
      maxVerticalAscentSpeed: metrics.maxverticalascentspeed,
      totalAscent: metrics.totalascent,
      totalDescent: metrics.totaldescent,
      maxAltitude: metrics.maxaltitude,
      minAltitude: metrics.minaltitude,
      distance: metrics.distance,
      profileDistance: metrics.profiledistance,
      descentDistance: metrics.descentdistance,
      ascentDistance: metrics.ascentdistance,
      averageSpeed: metrics.averagespeed,
      averageDescentSpeed: metrics.averagedescentspeed,
      averageAscentSpeed: metrics.averageascentspeed,
      movingAverageSpeed: metrics.movingaveragespeed,
      movingAverageDescentSpeed: metrics.movingaveragedescentspeed,
      movingAverageAscentSpeed: metrics.movingaverageascentspeed,
      duration: metrics.duration,
      startAltitude: metrics.startaltitude,
      finishAltitude: metrics.finishaltitude,
      ascents: metrics.ascents,
      descents: metrics.descents,
      laps: metrics.laps,
    },
  };
};

const parseEventsXmlFile = async (
  readStream: Readable
): Promise<SkizTrackEvent[]> => {
  const buffer = await convertReadStreamToBuffer(readStream);
  const parser = new XMLParser(xmlParserOptions);
  const parsed = parser.parse(buffer.toString('utf-8'));

  const events: SkizTrackEventXML[] = parsed.events.event || [];
  const trackEvents = events.map((event: SkizTrackEventXML) => ({
    start: new Date(Date.parse(event.start)),
    end: new Date(Date.parse(event.end)),
    type: event.type,
  }));

  return trackEvents;
};

export const parseSkizFile = (
  contents: ArrayBuffer | Buffer
): Promise<SkizTrack> => {
  const buffer =
    contents instanceof ArrayBuffer ? Buffer.from(contents) : contents;

  return new Promise((resolve, reject) => {
    fromBuffer(
      buffer,
      { lazyEntries: true },
      (err: Error | null, zipFile: ZipFile) => {
        if (err) {
          return reject(err);
        }

        let skizTrackXml: SkizTrackXML;
        let batteryUsage: SkizBatteryUsage[];
        let relativeAltitude: SkizRelativeAltitude[];
        let trackEvents: SkizTrackEvent[];
        let trackNodes: SkizTrackNode[];
        let trackSegments: SkizTrackSegment[];

        zipFile.readEntry();

        zipFile
          .on('error', reject)
          .on('entry', async (entry) => {
            if (
              ![
                'Battery.csv',
                'Events.xml',
                'Nodes.csv',
                'RelativeAltitudeSensor.csv',
                'Segment.csv',
                'Track.xml',
              ].includes(entry.fileName)
            ) {
              return zipFile.readEntry();
            }

            const readStream = await openReadStream(zipFile, entry);

            if (entry.fileName === 'Battery.csv') {
              batteryUsage = await parseBatteryCsvFile(readStream);
            } else if (entry.fileName === 'Events.xml') {
              trackEvents = await parseEventsXmlFile(readStream);
            } else if (entry.fileName === 'Nodes.csv') {
              trackNodes = await parseNodeCsvFile(readStream);
            } else if (entry.fileName === 'RelativeAltitudeSensor.csv') {
              relativeAltitude =
                await parseRelativeAltitudeSensorCsvFile(readStream);
            } else if (entry.fileName === 'Segment.csv') {
              trackSegments = await parseSegmentCsvFile(readStream);
            } else if (entry.fileName === 'Track.xml') {
              skizTrackXml = await parseTrackXmlFile(readStream);
            }

            zipFile.readEntry();
          })
          .once('end', () => {
            resolve({
              ...skizTrackXml,
              batteryUsage,
              relativeAltitude,
              trackEvents,
              trackNodes,
              trackSegments,
            });
          });
      }
    );
  });
};
