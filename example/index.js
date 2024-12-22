import { readFile } from 'node:fs/promises';
import { parseSkizFile } from 'skiz-parser';

(async () => {
  const contents = await readFile('../example.skiz');
  const result = await parseSkizFile(contents);

  console.log(result);
})();
