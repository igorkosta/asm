import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

vi.mock("../../src/core/uninstaller.js", () => ({
  uninstallPackage: vi.fn(),
  uninstallSkill: vi.fn(),
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
  tmpDir = mkdtempSync(join(tmpdir(), "ags-uninstall-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("uninstall command", () => {
  it("removes package from lockfile on uninstall", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://github.com/addyosmani/agent-skills/archive/0.6.2.tar.gz",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills", "tdd"],
      },
    });

    vi.spyOn(console, "log").mockImplementation(() => {});
    const { uninstallPackage } = await import("../../src/core/uninstaller.js");

    const { uninstall } = await import("../../src/commands/uninstall.js");
    await uninstall("addyosmani-agent-skills", {});

    expect(uninstallPackage).toHaveBeenCalled();

    const lock = JSON.parse(readFileSync(join(tmpDir, "ags-lock.json"), "utf-8"));
    expect(lock.packages["addyosmani-agent-skills"]).toBeUndefined();
  });

  it("prints confirmation message for package uninstall", async () => {
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

    const { uninstall } = await import("../../src/commands/uninstall.js");
    await uninstall("addyosmani-agent-skills", {});

    expect(logs).toContain("Removed package 'addyosmani-agent-skills'.");
  });

  it("supports pkg/skill format", async () => {
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
    const { uninstallSkill } = await import("../../src/core/uninstaller.js");

    const { uninstall } = await import("../../src/commands/uninstall.js");
    await uninstall("addyosmani-agent-skills/using-agent-skills", {});

    expect(uninstallSkill).toHaveBeenCalledWith(
      "addyosmani-agent-skills",
      "using-agent-skills",
      expect.any(String),
      process.cwd(),
    );

    expect(logs).toContain("Removed skill 'using-agent-skills' from package 'addyosmani-agent-skills'.");
  });

  it("cleans .gitignore when last local package is removed", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills"],
      },
    });
    writeFileSync(join(tmpDir, ".gitignore"), "node_modules/\nags_modules/skills/\n");

    vi.spyOn(console, "log").mockImplementation(() => {});
    const { uninstall } = await import("../../src/commands/uninstall.js");
    await uninstall("addyosmani-agent-skills", {});

    const gitignore = readFileSync(join(tmpDir, ".gitignore"), "utf-8");
    expect(gitignore).not.toContain("ags_modules/skills/");
  });

  it("does not clean .gitignore when other packages remain", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills"],
      },
      "kayaman-skills": {
        version: "v0.8.0",
        resolved: "https://...",
        integrity: "sha256-def",
        agent: "local",
        skills: ["clean-code"],
      },
    });
    writeFileSync(join(tmpDir, ".gitignore"), "node_modules/\nags_modules/skills/\n");

    vi.spyOn(console, "log").mockImplementation(() => {});
    const { uninstall } = await import("../../src/commands/uninstall.js");
    await uninstall("addyosmani-agent-skills", {});

    const gitignore = readFileSync(join(tmpDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("ags_modules/skills/");
  });
});
