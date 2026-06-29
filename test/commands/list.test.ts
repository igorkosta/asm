import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;
const origCwd = process.cwd();

function writeLockfile(packages: Record<string, any>): void {
  writeFileSync(
    join(tmpDir, "ags-lock.json"),
    JSON.stringify({ packages }, null, 2) + "\n",
  );
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-list-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("list command", () => {
  it("prints 'No packages installed' when lockfile is empty", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({});

    expect(logs).toEqual(["No packages installed."]);
  });

  it("prints 'No packages installed' when lockfile missing", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({});

    expect(logs).toEqual(["No packages installed."]);
  });

  it("shows installed packages with version and skill count", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://github.com/addyosmani/agent-skills/archive/0.6.2.tar.gz",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills", "tdd", "security-and-hardening"],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({});

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("version: 0.6.2");
    expect(output).toContain("3 skills");
    expect(output).toContain("agent: local");
  });

  it("lists installed skill names", async () => {
    writeLockfile({
      "addyosmani-agent-skills": {
        version: "0.6.2",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: ["using-agent-skills", "security-and-hardening"],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({});

    const output = logs.join("\n");
    expect(output).toContain("using-agent-skills");
    expect(output).toContain("security-and-hardening");
  });

  it("filters by agent", async () => {
    writeLockfile({
      pkgA: {
        version: "1.0",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: [],
      },
      pkgB: {
        version: "2.0",
        resolved: "https://...",
        integrity: "sha256-def",
        agent: "myagent",
        skills: [],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({ agent: "myagent" });

    const output = logs.join("\n");
    expect(output).toContain("pkgB");
    expect(output).not.toContain("pkgA");
  });

  it("handles agent filter with no matches", async () => {
    writeLockfile({
      pkgA: {
        version: "1.0",
        resolved: "https://...",
        integrity: "sha256-abc",
        agent: "local",
        skills: [],
      },
    });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { list } = await import("../../src/commands/list.js");
    await list({ agent: "nonexistent" });

    expect(logs).toEqual(["No packages installed for agent 'nonexistent'."]);
  });
});
