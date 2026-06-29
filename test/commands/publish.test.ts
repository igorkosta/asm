import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;
const origCwd = process.cwd();

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-publish-test-"));
  process.chdir(tmpDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.chdir(origCwd);
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeManifest(overrides: Record<string, unknown> = {}) {
  const manifest = {
    name: "test-pkg",
    version: "1.0.0",
    description: "A test package",
    platforms: ["github"],
    repository: "https://github.com/org/test-pkg",
    skills: [
      { name: "hello-world", description: "A sample skill", entry: "skills/hello-world.md" },
    ],
    ...overrides,
  };
  writeFileSync(join(tmpDir, "ags.json"), JSON.stringify(manifest, null, 2));
}

function createSkillFile(path: string) {
  const full = join(tmpDir, path);
  mkdirSync(join(tmpDir, "skills"), { recursive: true });
  writeFileSync(full, "# hello-world\n");
}

describe("publish command", () => {
  it("exits with error when no ags.json exists", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { publish } = await import("../../src/commands/publish.js");
    await expect(publish()).rejects.toThrow("process.exit");
    expect(logs.some((l) => l.includes("No ags.json"))).toBe(true);
  });

  it("exits with error when ags.json is invalid JSON", async () => {
    writeFileSync(join(tmpDir, "ags.json"), "not json");

    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { publish } = await import("../../src/commands/publish.js");
    await expect(publish()).rejects.toThrow("process.exit");
    expect(logs.some((l) => l.includes("Failed to parse"))).toBe(true);
  });

  it("exits with error when manifest is missing required fields", async () => {
    writeManifest({ name: "" });

    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { publish } = await import("../../src/commands/publish.js");
    await expect(publish()).rejects.toThrow("process.exit");
    expect(logs.some((l) => l.includes("Validation errors"))).toBe(true);
    expect(logs.some((l) => l.includes("name"))).toBe(true);
  });

  it("exits with error when skill entry files are missing", async () => {
    writeManifest();

    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { publish } = await import("../../src/commands/publish.js");
    await expect(publish()).rejects.toThrow("process.exit");
    expect(logs.some((l) => l.includes("Missing skill entry"))).toBe(true);
  });

  it("validates manifest and prints registry entry snippet on success", async () => {
    writeManifest();
    createSkillFile("skills/hello-world.md");

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { publish } = await import("../../src/commands/publish.js");
    await publish();

    const output = logs.join("\n");
    expect(output).toContain("test-pkg v1.0.0");
    expect(output).toContain("https://github.com/org/test-pkg");
    expect(output).toContain("hello-world");
    expect(output).toContain("Registry entry snippet");
  });

  it("outputs valid JSON snippet that can be merged into a registry", async () => {
    writeManifest();
    createSkillFile("skills/hello-world.md");

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { publish } = await import("../../src/commands/publish.js");
    await publish();

    const output = logs.join("\n");
    const jsonMatch = output.match(/\{[^]*\n\}/);
    expect(jsonMatch).toBeTruthy();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed["test-pkg"]).toBeDefined();
    expect(parsed["test-pkg"].latest).toBe("1.0.0");
    expect(parsed["test-pkg"].skills).toHaveLength(1);
    expect(parsed["test-pkg"].skills[0].name).toBe("hello-world");
  });

  it("allows empty skills array", async () => {
    writeManifest({ skills: [] });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { publish } = await import("../../src/commands/publish.js");
    await publish();

    const output = logs.join("\n");
    expect(output).toContain("test-pkg v1.0.0");
  });
});
