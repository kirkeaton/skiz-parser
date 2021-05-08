# skiz-parser

> Parse a .skiz file exported from Ski Tracks

## Install

```bash
$ npm install skiz-parser
```

## Usage

```js
import { promises as fsAsync } from 'fs';
import { parseSkizFile } from 'skiz-parser';

const file = await fsAsync.readFile('./example.skiz');
const result = await parseSkizFile(file);

console.log(result);
//=> { name: 'Day 1 - 2018/2019', … }
```

## API

### parseSkizFile(file, callback?)

Returns a `Promise<object>` with the parsed .skiz file.

Optionally a callback function may be used instead.

#### file

Type: `Buffer`

Contents of a `.skiz` file.

#### callback

Type: `Function`

Optional callback with error as the first argument and the parsed .skiz file as the second.
