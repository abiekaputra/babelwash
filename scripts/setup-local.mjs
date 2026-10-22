import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

if (!existsSync('.env')) copyFileSync('.env.example', '.env');
mkdirSync('runtime', { recursive: true });
console.log('Local configuration is ready. Run `pnpm dev`.');
