import { promises as fsAsync } from 'fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseSkizFile } from '../index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const filename = path.join(dirname, '../example.skiz');

test('should parse .skiz file using promises', async (t) => {
  const file = await fsAsync.readFile(filename);
  const result = await parseSkizFile(file);

  assert.equal(result.name, 'Day 15 - 2020/2021');
  assert.equal(result.activity, 'skiing');
  assert.ok(result.trackMetrics);
  assert.ok(result.trackEvents);
  assert.ok(result.trackSegments);
  assert.ok(result.trackNodes);
  assert.ok(result.batteryUsage);
  assert.ok(result.relativeAltitude);
  assert.ok(result.trackEvents.length);
  assert.ok(result.trackSegments.length);
  assert.ok(result.trackNodes.length);
  assert.ok(result.batteryUsage.length);
  assert.ok(result.relativeAltitude.length);
});

test('should parse .skiz file using callback', async (t) => {
  const file = await fsAsync.readFile(filename);
  return new Promise((resolve, reject) => {
    parseSkizFile(file, (err, result) => {
      if (err) {
        return reject(err);
      }

      assert.equal(result.name, 'Day 15 - 2020/2021');
      assert.equal(result.activity, 'skiing');
      assert.ok(result.trackMetrics);
      assert.ok(result.trackEvents);
      assert.ok(result.trackSegments);
      assert.ok(result.trackNodes);
      assert.ok(result.batteryUsage);
      assert.ok(result.relativeAltitude);
      assert.ok(result.trackEvents.length);
      assert.ok(result.trackSegments.length);
      assert.ok(result.trackNodes.length);
      assert.ok(result.batteryUsage.length);
      assert.ok(result.relativeAltitude.length);
      resolve();
    });
  });
});
