import { existsSync, readFileSync, rmSync } from "node:fs";

const PID_FILE = ".e2e-backend.pid";

// Stop the backend started in global-setup.ts.
export default function globalTeardown(): void {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, "utf8").trim());
  rmSync(PID_FILE, { force: true });
  if (!pid) return;
  try {
    // Negative PID kills the whole detached process group.
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
}
