import { readFile, writeFile } from 'node:fs/promises';
const file = '.github/workflows/ci.yml';
let text = await readFile(file, 'utf8');
const marker = '      - name: Check deterministic performance contract\n        run: bun run performance:contract';
if (!text.includes(marker) || text.includes('\n  provider-benchmark:')) throw new Error('Unexpected CI state');
text = text.replace('on:\n', 'on:\n  workflow_dispatch:\n');
text = text.replace(marker, '      - name: Check deterministic performance contracts\n        run: |\n          bun run performance:contract\n          bun run bench:providers:test');
text += '\n' + await readFile('.provider-job.yml', 'utf8');
await writeFile(file, text);
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
Object.assign(manifest.scripts, {
  'bench:providers': 'node benchmarks/providers/run.mjs',
  'bench:providers:compare': 'node benchmarks/providers/run.mjs --compare',
  'bench:providers:full': 'node benchmarks/providers/run.mjs --full',
  'bench:providers:smoke': 'node benchmarks/providers/run.mjs --smoke',
  'bench:providers:test': 'node --test benchmarks/providers/contract.test.mjs'
});
manifest.scripts.verify = manifest.scripts.verify.replace('bun run performance:contract &&', 'bun run performance:contract && bun run bench:providers:test &&');
await writeFile('package.json', JSON.stringify(manifest, null, 2) + '\n');
