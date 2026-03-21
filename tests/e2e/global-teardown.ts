import fs from 'fs';
import path from 'path';

const pidFile = path.join(__dirname, '.devserver.pid');

export default async function globalTeardown() {
  if (!fs.existsSync(pidFile)) return;
  const pid = Number(fs.readFileSync(pidFile, 'utf-8'));
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
  fs.unlinkSync(pidFile);
}
