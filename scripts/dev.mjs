import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";

const projectRoot = process.cwd();
const lockPath = path.join(projectRoot, ".next", "dev", "lock");

function getLockHolderPids() {
  if (!existsSync(lockPath)) return [];

  try {
    const output = execSync(`lsof -t "${lockPath}"`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!output) return [];

    return output
      .split(/\s+/)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupNextDevLock() {
  if (!existsSync(lockPath)) return;

  const pids = getLockHolderPids();
  if (pids.length > 0) {
    console.log(`[dev] Found Next dev lock holder PID(s): ${pids.join(", ")}`);

    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // ignore
      }
    }

    await sleep(600);

    for (const pid of pids) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // ignore
      }
    }

    await sleep(150);
  } else {
    console.log(
      `[dev] Lock file exists but no PID found via lsof. Removing lock file...`,
    );
  }

  try {
    rmSync(lockPath, { force: true });
  } catch {
    // ignore
  }
}

async function main() {
  await cleanupNextDevLock();

  const child = spawn("next", ["dev", "--webpack"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev] Failed to start dev server:", error);
  process.exit(1);
});
