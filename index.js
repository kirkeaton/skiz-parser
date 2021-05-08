import csv from 'csv-parser';
import xmlParser from 'fast-xml-parser';
import { promisify } from 'util';
import yauzl from 'yauzl';

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

const parseNodeCsvFile = (readStream) => {
  return new Promise((resolve, reject) => {
    const trackNodes = [];

    readStream
      .pipe(csv({ headers: false }))
      .on('error', reject)
      .on('data', (data) => {
        const values = Object.values(data);

        trackNodes.push({
          timestamp: new Date(parseFloat(values[0]) * 1000.0),
          latitude: parseFloat(values[1]),
          longitude: parseFloat(values[2]),
          altitude: parseFloat(values[3]),
          heading: parseFloat(values[4]),
          velocity: parseFloat(values[5]),
          hAccuracy: parseFloat(values[6]),
          vAccuracy: parseFloat(values[7]),
        });
      })
      .once('end', () => {
        resolve({ trackNodes });
      });
  });
};

const parseSegmentCsvFile = (readStream) => {
  return new Promise((resolve, reject) => {
    const trackSegments = [];

    readStream
      .pipe(csv({ headers: false, skipLines: 1 }))
      .on('error', reject)
      .on('data', (data) => {
        const values = Object.values(data);

        trackSegments.push({
          startTime: new Date(parseFloat(values[0]) * 1000),
          endTime: new Date(parseFloat(values[1]) * 1000),
          number: parseInt(values[4], 10),
          name: values[5],
          comment: values[6],
          type: values[7],
          category: values[8],
          link: values[9],
          uuid: values[10],
          metrics: {
            time: parseFloat(values[11]),
            speed: parseFloat(values[12]),
            distance: parseFloat(values[13]),
            vertical: parseFloat(values[14]),
            maxSpeed: parseFloat(values[15]),
            slope: parseFloat(values[16]),
            maxSlope: parseFloat(values[17]),
            minAltitude: parseFloat(values[18]),
            maxAltitude: parseFloat(values[19]),
            startAltitude: parseFloat(values[20]),
            finishAltitude: parseFloat(values[21]),
          },
        });
      })
      .once('end', () => {
        resolve({ trackSegments });
      });
  });
};

const parseTrackXmlFile = async (readStream) => {
  const options = {
    attributeNamePrefix: '',
    ignoreAttributes: false,
  };

  const buffer = await convertReadStreamToBuffer(readStream);
  const parsed = xmlParser.parse(buffer.toString('utf-8'), options);

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
  const options = {
    attributeNamePrefix: '',
    ignoreAttributes: false,
  };

  const buffer = await convertReadStreamToBuffer(readStream);
  const parsed = xmlParser.parse(buffer.toString('utf-8'), options);

  const events = parsed.events.event || [];
  const trackEvents = events.map((event) => ({
    start: new Date(Date.parse(event.start)),
    end: new Date(Date.parse(event.end)),
    type: event.type,
  }));

  return { trackEvents };
};

export const parseSkizFile = (file, callback) => {
  const parse = (resolve, reject) => {
    yauzl.fromBuffer(file, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }

      let data = {};

      const openReadStream = promisify(zipFile.openReadStream.bind(zipFile));

      zipFile.readEntry();

      zipFile
        .on('error', reject)
        .on('entry', async (entry) => {
          if (
            !['Events.xml', 'Nodes.csv', 'Segment.csv', 'Track.xml'].includes(
              entry.fileName
            )
          ) {
            return zipFile.readEntry();
          }

          const readStream = await openReadStream(entry);

          let result;
          if (entry.fileName === 'Events.xml') {
            result = await parseEventsXmlFile(readStream);
          } else if (entry.fileName === 'Nodes.csv') {
            result = await parseNodeCsvFile(readStream);
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
  };

  return typeof callback === 'function'
    ? parse(callback.bind(null, undefined), callback)
    : new Promise(parse);
};
