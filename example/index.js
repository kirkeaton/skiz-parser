import { promises as fsAsync } from 'fs';
import { parseSkizFile } from 'skiz-parser';

(async () => {
  const contents = await fsAsync.readFile('../example.skiz');
  const result = await parseSkizFile(contents);

  console.log(result);
})();
