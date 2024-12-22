import { parse as CSVParser } from 'csv-parse';
import { XMLParser } from 'fast-xml-parser';
import yauzl from 'yauzl';

const xmlParserOptions = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
};

const convertReadStreamToBuffer = (readStream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

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

const openReadStream = (zipFile, entry) => {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err, readStream) => {
      err ? reject(err) : resolve(readStream);
    });
  });
};

const parseBatteryCsvFile = (readStream) => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const batteryUsage = [];

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
        resolve({ batteryUsage });
      });

    readStream.pipe(parser);
  });
};

const parseNodeCsvFile = (readStream) => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const trackNodes = [];

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
        resolve({ trackNodes });
      });

    readStream.pipe(parser);
  });
};

const parseRelativeAltitudeSensorCsvFile = (readStream) => {
  const parser = CSVParser();

  return new Promise((resolve, reject) => {
    const relativeAltitude = [];

    readStream.pipe(parser);

    parser
      .on('error', reject)
      .on('readable', (data) => {
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
        resolve({ relativeAltitude });
      });
  });
};

const parseSegmentCsvFile = (readStream) => {
  const parser = CSVParser({ fromLine: 2 });

  return new Promise((resolve, reject) => {
    const trackSegments = [];

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
        resolve({ trackSegments });
      });

    readStream.pipe(parser);
  });
};

const parseTrackXmlFile = async (readStream) => {
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

const parseEventsXmlFile = async (readStream) => {
  const buffer = await convertReadStreamToBuffer(readStream);
  const parser = new XMLParser(xmlParserOptions);
  const parsed = parser.parse(buffer.toString('utf-8'));

  const events = parsed.events.event || [];
  const trackEvents = events.map((event) => ({
    start: new Date(Date.parse(event.start)),
    end: new Date(Date.parse(event.end)),
    type: event.type,
  }));

  return { trackEvents };
};

export const parseSkizFile = (contents) => {
  if (contents instanceof ArrayBuffer) {
    contents = Buffer.from(contents);
  }

  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(contents, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }

      let data = {};

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

          let result;
          if (entry.fileName === 'Battery.csv') {
            result = await parseBatteryCsvFile(readStream);
          } else if (entry.fileName === 'Events.xml') {
            result = await parseEventsXmlFile(readStream);
          } else if (entry.fileName === 'Nodes.csv') {
            result = await parseNodeCsvFile(readStream);
          } else if (entry.fileName === 'RelativeAltitudeSensor.csv') {
            result = await parseRelativeAltitudeSensorCsvFile(readStream);
          } else if (entry.fileName === 'Segment.csv') {
            result = await parseSegmentCsvFile(readStream);
          } else if (entry.fileName === 'Track.xml') {
            result = await parseTrackXmlFile(readStream);
          }

          data = { ...data, ...result };

          zipFile.readEntry();
        })
        .once('end', () => {
          resolve(data);
        });
    });
  });
};
