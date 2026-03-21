import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const baseURL = 'http://127.0.0.1:3000';
const pidFile = path.join(__dirname, '.devserver.pid');

function checkServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(baseURL, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServer()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Dev server did not start in time');
}

export default async function globalSetup() {
  const alreadyUp = await checkServer();
  if (alreadyUp) return;

  const proc = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
    stdio: 'inherit',
  });

  fs.writeFileSync(pidFile, String(proc.pid));
  await waitForServer(120_000);
}
