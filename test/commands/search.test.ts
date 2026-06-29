import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-search-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
  vi.restoreAllMocks();
});

describe("search command", () => {
  it("prints 'No packages found' when nothing matches", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("zzzznonexistent");

    expect(logs).toEqual(["No packages found matching 'zzzznonexistent'."]);
  });

  it("finds packages by package name", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("addyosmani");

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("latest: 0.6.2");
    expect(output).toContain("categories:");
  });

  it("finds packages by skill name", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("tdd");

    const output = logs.join("\n");
    expect(output).toContain("kayaman-skills");
    expect(output).toContain("tdd");
  });

  it("finds packages by skill category", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("security");

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("farmage-opencode-skills");
    expect(output).toContain("kayaman-skills");
    expect(output).toContain("secure-code-guardian");
    expect(output).toContain("security-and-hardening");
    expect(output).toContain("app-security");
  });

  it("shows matching skill names with descriptions", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("test-driven-development");

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("test-driven-development");
    expect(output).toContain("Write tests first, then implement code to pass them");
  });

  it("lists multiple matching packages", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { search } = await import("../../src/commands/search.js");
    await search("skills");

    const output = logs.join("\n");
    expect(output).toContain("addyosmani-agent-skills");
    expect(output).toContain("anthropics-skills");
    expect(output).toContain("kayaman-skills");
  });
});
