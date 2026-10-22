import { spawn } from 'node:child_process';

const children = [
  spawn('pnpm', ['dev:api'], { stdio: 'inherit' }),
  spawn('pnpm', ['dev:web'], { stdio: 'inherit' }),
];

function stop(signal) {
  for (const child of children) child.kill(signal);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

await Promise.race(children.map((child) => new Promise((resolve) => child.on('exit', resolve))));
stop('SIGTERM');
