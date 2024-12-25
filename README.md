# skiz-parser

Parse a .skiz file exported from Ski Tracks

## Install

```bash
$ npm install skiz-parser
```

## Usage

```js
import { readFile } from 'node:fs/promises';
import { parseSkizFile } from 'skiz-parser';

const contents = await readFile('./example.skiz');
const result = await parseSkizFile(contents);

console.log(result);
//=> { name: 'Day 1 - 2018/2019', … }
```

## API

### parseSkizFile(contents)

Returns a `Promise<SkizTrack>` with the parsed .skiz file.

#### contents

Type: `ArrayBuffer | Buffer`

Contents of a `.skiz` file.
