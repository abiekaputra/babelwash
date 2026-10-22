import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ignored = new Set(['node_modules', 'dist', 'runtime', '.git', 'docs']);
const productionExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.css']);
const violations = [];

function visit(directory) {
  for (const name of readdirSync(directory)) {
    if (ignored.has(name)) continue;
    const path = join(directory, name);
    if (statSync(path).isDirectory()) visit(path);
    else if (productionExtensions.has(extname(name))) {
      const lines = readFileSync(path, 'utf8').split('\n').length;
      const limit = path.includes('/tests/') ? 1_000 : 300;
      if (lines > limit) violations.push(`${relative(root, path)}: ${lines}/${limit}`);
    }
  }
}

visit(root);
if (violations.length > 0) {
  console.error(`File length violations:\n${violations.join('\n')}`);
  process.exit(1);
}
console.log('All source files respect the configured line limits.');
