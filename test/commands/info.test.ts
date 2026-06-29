import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-info-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("info command", () => {
  it("exits with error when package not in registry", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { info } = await import("../../src/commands/info.js");
    await expect(info("nonexistent-pkg")).rejects.toThrow("process.exit");

    expect(logs).toContain("Package 'nonexistent-pkg' not found in registry.");
  });

  it("shows package metadata", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { info } = await import("../../src/commands/info.js");
    await info("addyosmani-agent-skills");

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("0.6.2");
    expect(output).toContain("https://github.com/addyosmani/agent-skills");
    expect(output).toContain("opencode, claude, codex, cursor, gemini, copilot");
    expect(output).toContain("categories:");
    expect(output).toContain("skills:");
  });

  it("shows skill detail with pkg/skill format", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { info } = await import("../../src/commands/info.js");
    await info("kayaman-skills/app-security");

    const output = logs.join("\n");
    expect(output).toContain("app-security");
    expect(output).toContain("kayaman-skills");
    expect(output).toContain("security");
    expect(output).toContain("Secure applications against common vulnerabilities");
  });

  it("exits with error for unknown skill", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as unknown as (code?: number) => never);

    const { info } = await import("../../src/commands/info.js");
    await expect(info("addyosmani-agent-skills/nonexistent-skill")).rejects.toThrow("process.exit");

    expect(logs).toContain("Skill 'nonexistent-skill' not found in package 'addyosmani-agent-skills'.");
  });

  it("shows skillCount for aggregator packages", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { info } = await import("../../src/commands/info.js");
    await info("microsoft-skills");

    const output = logs.join("\n");
    expect(output).toContain("microsoft-skills");
    expect(output).toContain("skillCount:  174");
  });
});
