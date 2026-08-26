// bun test runs every file in one process, so a mock.module() call in one
// test file leaks into every other file that imports the same specifier
// afterwards. Each file gets its own `bun test` process instead.
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const testDir = path.join(import.meta.dir, '..', 'test');
const files = (await readdir(testDir)).filter((f) => f.endsWith('.test.ts')).sort();

let failed = false;
for (const file of files) {
  const proc = Bun.spawn(['bun', 'test', path.join(testDir, file)], { stdio: ['inherit', 'inherit', 'inherit'] });
  const code = await proc.exited;
  if (code !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
