import { expectError, expectType } from 'tsd';

import { parseSkizFile, SkizTrack } from './index.js';

const arrayBuffer = new ArrayBuffer(0);
const buffer = Buffer.from(arrayBuffer);

expectType<Promise<SkizTrack>>(parseSkizFile(buffer));
expectType<Promise<SkizTrack>>(parseSkizFile(arrayBuffer));
