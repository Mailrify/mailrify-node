import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const cjsPackagePath = resolve('dist', 'cjs', 'package.json');

await mkdir(resolve('dist', 'cjs'), { recursive: true });
await writeFile(
  cjsPackagePath,
  JSON.stringify(
    {
      type: 'commonjs'
    },
    null,
    2,
  ),
);
