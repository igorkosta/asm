import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

vi.mock("../../src/core/installer.js", () => ({
  installPackage: vi.fn().mockResolvedValue({
    integrity: "sha256-updated",
    resolved: "https://github.com/addyosmani/agent-skills/archive/0.7.0.tar.gz",
  }),
  downloadPackage: vi.fn(),
}));

let tmpDir: string;
const origCwd = process.cwd();

function writeLockfile(packages: Record<string, any>): void {
  writeFileSync(
    join(tmpDir, "ags-lock.json"),
    JSON.stringify({ packages }, null, 2) + "\n",
  );
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-update-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("update command", () => {
  it("shows 'already at latest' when version matches", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills"],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { update } = await import("../../src/commands/update.js");
    await update("addyosmani-agent-skills", {});

    expect(logs.some((l) => l.includes("already at latest"))).toBe(true);
  });

  it("updates package to newer version", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.5.0",
        resolved: "https://...",
        integrity: "sha256-old",
        agent: "local",
        skills: ["using-agent-skills"],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { update } = await import("../../src/commands/update.js");
    await update("addyosmani-agent-skills", {});

    expect(logs.some((l) => l.includes("0.5.0") && l.includes("0.6.2"))).toBe(true);

    const lock = JSON.parse(readFileSync(join(tmpDir, "ags-lock.json"), "utf-8"));
    expect(lock.packages["addyosmani-agent-skills"].version).toBe("0.6.2");
    expect(lock.packages["addyosmani-agent-skills"].integrity).toBe("sha256-updated");
  });

  it("prints error when package not installed", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));

    const { update } = await import("../../src/commands/update.js");
    await update("not-installed-pkg", {});

    expect(logs).toContain("Package 'not-installed-pkg' is not installed.");
  });

  it("updates all packages when no package specified", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.5.0",
        resolved: "https://...",
        integrity: "sha256-old",
        agent: "local",
        skills: ["using-agent-skills"],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { update } = await import("../../src/commands/update.js");
    await update(undefined, {});

    expect(logs.some((l) => l.includes("0.5.0") && l.includes("0.6.2"))).toBe(true);
  });

  it("prints 'No packages installed' when nothing to update", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { update } = await import("../../src/commands/update.js");
    await update(undefined, {});

    expect(logs).toEqual(["No packages installed."]);
  });
});
