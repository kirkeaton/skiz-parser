import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseSkizFile } from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const filename = path.join(dirname, '../example.skiz');

test('should parse .skiz file', async (t) => {
  const file = await readFile(filename);
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
