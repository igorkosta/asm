import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

vi.mock("../../src/core/installer.js", () => ({
  installPackage: vi.fn().mockResolvedValue({
    integrity: "sha256-abc123def456",
    resolved: "https://github.com/addyosmani/agent-skills/archive/0.6.2.tar.gz",
  }),
  downloadPackage: vi.fn(),
}));

let tmpDir: string;
const origCwd = process.cwd();

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-install-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("install command", () => {
  it("exits with error when package not in registry", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { install } = await import("../../src/commands/install.js");
    await expect(install("nonexistent-pkg", {})).rejects.toThrow("process.exit");

    expect(logs).toContain("Package 'nonexistent-pkg' not found in registry.");
  });

  it("prints progress messages on success", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { install } = await import("../../src/commands/install.js");
    await install("addyosmani-agent-skills", {});

    expect(logs.some((l) => l.startsWith("Installing '"))).toBe(true);
    expect(logs.some((l) => l.startsWith("Installed '"))).toBe(true);
  });

  it("creates lockfile entry after install", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { install } = await import("../../src/commands/install.js");
    await install("addyosmani-agent-skills", {});

    const lockPath = join(tmpDir, "ags-lock.json");
    expect(existsSync(lockPath)).toBe(true);
    const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
    expect(lock.packages["addyosmani-agent-skills"]).toBeDefined();
    expect(lock.packages["addyosmani-agent-skills"].version).toBe("0.6.2");
    expect(lock.packages["addyosmani-agent-skills"].skills).toContain("using-agent-skills");
  });

  it("creates .gitignore entry for local install", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { install } = await import("../../src/commands/install.js");
    await install("addyosmani-agent-skills", {});

    const gitignorePath = join(tmpDir, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(true);
    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).toContain("ags_modules/skills/");
  });

  it("does not modify .gitignore for global install", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { install } = await import("../../src/commands/install.js");
    await install("addyosmani-agent-skills", { global: true, agent: "testagent" });

    const gitignorePath = join(tmpDir, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(false);
  });

  it("stores agent field for global installs", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { install } = await import("../../src/commands/install.js");
    await install("addyosmani-agent-skills", { global: true, agent: "testagent" });

    const lockPath = join(tmpDir, "ags-lock.json");
    const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
    expect(lock.packages["addyosmani-agent-skills"].agent).toBe("testagent");
  });
});
