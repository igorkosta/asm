import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-source-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
});

describe("source list command", () => {
  it("prints 'No sources configured' when empty", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { listSources } = await import("../../src/commands/source.js");
    await listSources();

    expect(logs).toEqual(["No sources configured."]);
  });

  it("prints each source name and url", async () => {
    const { addSource } = await import("../../src/core/config.js");
    addSource({ name: "community", indexUrl: "https://github.com/..." });
    addSource({ name: "internal", indexUrl: "https://gitlab.internal.co/..." });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { listSources } = await import("../../src/commands/source.js");
    await listSources();

    expect(logs).toContain("community: https://github.com/...");
    expect(logs).toContain("internal: https://gitlab.internal.co/...");
  });

  it("prints apiBaseUrl when present", async () => {
    const { addSource } = await import("../../src/core/config.js");
    addSource({ name: "internal", indexUrl: "https://gitlab.internal.co/...", apiBaseUrl: "https://gitlab.internal.co/api/v4" });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { listSources } = await import("../../src/commands/source.js");
    await listSources();

    expect(logs).toContain("  apiBaseUrl: https://gitlab.internal.co/api/v4");
  });
});

describe("source add command", () => {
  it("adds a source and prints confirmation", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { addSource } = await import("../../src/commands/source.js");
    await addSource("community", "https://github.com/...");

    expect(logs).toEqual(["Source 'community' added."]);

    const { listSources } = await import("../../src/core/config.js");
    expect(listSources()).toHaveLength(1);
    expect(listSources()[0].name).toBe("community");
  });

  it("adds source with apiBaseUrl", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { addSource } = await import("../../src/commands/source.js");
    await addSource("internal", "https://gitlab.internal.co/...", { apiBaseUrl: "https://gitlab.internal.co/api/v4" });

    const { listSources } = await import("../../src/core/config.js");
    expect(listSources()[0].apiBaseUrl).toBe("https://gitlab.internal.co/api/v4");
  });
});

describe("source remove command", () => {
  it("removes a source and prints confirmation", async () => {
    const { addSource } = await import("../../src/core/config.js");
    addSource({ name: "community", indexUrl: "https://github.com/..." });

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { removeSource } = await import("../../src/commands/source.js");
    await removeSource("community");

    expect(logs).toEqual(["Source 'community' removed."]);

    const { listSources } = await import("../../src/core/config.js");
    expect(listSources()).toHaveLength(0);
  });
});
