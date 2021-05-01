import test from 'ava';
import { promises as fsAsync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseSkizFile } from '../index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(dirname);
const rootCwd = path.join(dirname, '/dir');

test('should parse .skiz file', async (t) => {
  const file = await fsAsync.readFile('./example.skiz');
  const result = await parseSkizFile(file);

  t.is(result.name, 'Day 1 - 2018/2019');
  t.is(result.activity, 'skiing');
  t.truthy(result.trackMetrics);
  t.truthy(result.trackSegments);
  t.truthy(result.trackNodes);
  t.truthy(result.trackSegments.length);
  t.truthy(result.trackNodes.length);
});
