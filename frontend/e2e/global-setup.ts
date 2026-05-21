import { execSync, spawn } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const BASE_URL = "http://127.0.0.1:8000";
const PID_FILE = ".e2e-backend.pid";

async function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("e2e backend did not become healthy in time");
}

// Build the current frontend (so the backend serves fresh dist), seed a FRESH
// e2e DB with a verified admin + regular user, then start the backend ourselves.
// We manage the process here instead of via Playwright's `webServer` because the
// latter's spawn context left SQLite writes failing readonly.
export default async function globalSetup(): Promise<void> {
  execSync("npm run build", { stdio: "inherit" });
  rmSync("../backend/e2e_test.db", { force: true });
  execSync("DATABASE_URL=sqlite:///./e2e_test.db DEBUG=true .venv/bin/python scripts/seed_e2e.py", {
    stdio: "inherit",
    cwd: "../backend",
    shell: "/bin/bash",
  });

  const backend = spawn(
    ".venv/bin/uvicorn",
    ["app.main:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "warning"],
    {
      cwd: "../backend",
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        DATABASE_URL: "sqlite:///./e2e_test.db",
        DEBUG: "true",
        COOKIE_SECURE: "false",
        TESTING: "true",
        EMAIL_PROVIDER: "dev",
      },
    }
  );
  backend.unref();
  writeFileSync(PID_FILE, String(backend.pid));

  await waitForHealth(30_000);
}
