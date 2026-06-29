import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;
const origCwd = process.cwd();

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-init-test-"));
  process.chdir(tmpDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("init command", () => {
  it("exits with error when ags.json already exists", async () => {
    const { writeFileSync } = await import("fs");
    writeFileSync(join(tmpDir, "ags.json"), "{}");

    const logs: string[] = [];
    const { init } = await import("../../src/commands/init.js");
    const spyErr = vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    const spyExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    await expect(init()).rejects.toThrow("process.exit");
    expect(logs).toContain("ags.json already exists in this directory.");

    spyErr.mockRestore();
    spyExit.mockRestore();
  });

  it("creates ags.json with provided options", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { init } = await import("../../src/commands/init.js");
    await init("test-pkg", {
      description: "A test package",
      version: "1.0.0",
      repository: "https://github.com/org/test-pkg",
      platforms: "github",
    });

    expect(existsSync(join(tmpDir, "ags.json"))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(tmpDir, "ags.json"), "utf-8"));
    expect(manifest.name).toBe("test-pkg");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.description).toBe("A test package");
    expect(manifest.repository).toBe("https://github.com/org/test-pkg");
    expect(manifest.platforms).toEqual(["github"]);
  });

  it("creates skills directory and sample skill file", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { init } = await import("../../src/commands/init.js");
    await init("test-pkg", {
      description: "desc",
      version: "0.1.0",
      repository: "https://github.com/org/test-pkg",
      platforms: "github",
    });

    const skillsDir = join(tmpDir, "skills");
    expect(existsSync(skillsDir)).toBe(true);
    expect(existsSync(join(skillsDir, "hello-world.md"))).toBe(true);

    const sampleContent = readFileSync(join(skillsDir, "hello-world.md"), "utf-8");
    expect(sampleContent).toContain("hello-world");
  });

  it("includes sample skill in manifest", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { init } = await import("../../src/commands/init.js");
    await init("test-pkg", {
      description: "desc",
      version: "0.1.0",
      repository: "https://github.com/org/test-pkg",
      platforms: "github",
    });

    const manifest = JSON.parse(readFileSync(join(tmpDir, "ags.json"), "utf-8"));
    expect(manifest.skills).toHaveLength(1);
    expect(manifest.skills[0].name).toBe("hello-world");
    expect(manifest.skills[0].entry).toBe("skills/hello-world.md");
  });

  it("prints next steps after scaffolding", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { init } = await import("../../src/commands/init.js");
    await init("test-pkg", {
      description: "desc",
      version: "0.1.0",
      repository: "https://github.com/org/test-pkg",
      platforms: "github",
    });

    const text = logs.filter(Boolean).join("\n");
    expect(text).toContain("ags.json");
    expect(text).toContain("hello-world.md");
    expect(text).toContain("Next steps");
  });
});
