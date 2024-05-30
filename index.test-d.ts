import { expectError, expectType } from 'tsd';

import { parseSkizFile, SkizTrack } from './index.js';

const arrayBuffer = new ArrayBuffer(0);
const buffer = Buffer.from(arrayBuffer);
const callback = (error: Error | null, result: SkizTrack) => {};

expectType<Promise<SkizTrack>>(parseSkizFile(buffer));
expectError<Promise<SkizTrack>>(parseSkizFile(buffer, callback));
expectType<Promise<SkizTrack>>(parseSkizFile(arrayBuffer));
expectError<Promise<SkizTrack>>(parseSkizFile(arrayBuffer, callback));

expectType<void>(parseSkizFile(buffer, callback));
expectError<void>(parseSkizFile(buffer));
expectType<void>(parseSkizFile(arrayBuffer, callback));
expectError<void>(parseSkizFile(arrayBuffer));
