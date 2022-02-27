import test from 'ava';
import { promises as fsAsync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseSkizFile } from '../index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const filename = path.join(dirname, '../example.skiz');

test('should parse .skiz file using promises', async (t) => {
  const file = await fsAsync.readFile(filename);
  const result = await parseSkizFile(file);

  t.is(result.name, 'Day 15 - 2020/2021');
  t.is(result.activity, 'skiing');
  t.truthy(result.trackMetrics);
  t.truthy(result.trackEvents);
  t.truthy(result.trackSegments);
  t.truthy(result.trackNodes);
  t.truthy(result.trackEvents.length);
  t.truthy(result.trackSegments.length);
  t.truthy(result.trackNodes.length);
  t.truthy(result.batteryUsage.length);
});

test('should parse .skiz file using callback', async (t) => {
  const file = await fsAsync.readFile(filename);
  return new Promise((resolve, reject) => {
    parseSkizFile(file, (err, result) => {
      if (err) {
        return reject(err);
      }

      t.is(result.name, 'Day 15 - 2020/2021');
      t.is(result.activity, 'skiing');
      t.truthy(result.trackMetrics);
      t.truthy(result.trackEvents);
      t.truthy(result.trackSegments);
      t.truthy(result.trackNodes);
      t.truthy(result.trackEvents.length);
      t.truthy(result.trackSegments.length);
      t.truthy(result.trackNodes.length);
      t.truthy(result.batteryUsage.length);
      resolve();
    });
  });
});
