import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-config-test-"));
  process.env.AGS_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.AGS_CONFIG_DIR;
});

describe("readConfig", () => {
  it("returns empty sources when no config file exists", async () => {
    const { readConfig } = await import("../../src/core/config.js");
    const config = readConfig();
    expect(config).toEqual({ sources: [] });
  });
});

describe("writeConfig", () => {
  it("writes config to disk", async () => {
    const { writeConfig } = await import("../../src/core/config.js");
    writeConfig({ sources: [{ name: "test", indexUrl: "https://example.com/registry.json" }] });
    const raw = readFileSync(join(tmpDir, "config.json"), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.sources[0].name).toBe("test");
  });
});

describe("addSource", () => {
  it("adds a new source", async () => {
    const { addSource, readConfig } = await import("../../src/core/config.js");
    addSource({ name: "community", indexUrl: "https://github.com/..." });
    const config = readConfig();
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0].name).toBe("community");
  });

  it("overwrites existing source with same name", async () => {
    const { addSource, readConfig } = await import("../../src/core/config.js");
    addSource({ name: "community", indexUrl: "https://old.com/..." });
    addSource({ name: "community", indexUrl: "https://new.com/...", apiBaseUrl: "https://api.new.com" });
    const config = readConfig();
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0].indexUrl).toBe("https://new.com/...");
    expect(config.sources[0].apiBaseUrl).toBe("https://api.new.com");
  });
});

describe("removeSource", () => {
  it("removes a source by name", async () => {
    const { addSource, removeSource, readConfig } = await import("../../src/core/config.js");
    addSource({ name: "a", indexUrl: "https://a.com/..." });
    addSource({ name: "b", indexUrl: "https://b.com/..." });
    removeSource("a");
    const config = readConfig();
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0].name).toBe("b");
  });

  it("does nothing when source does not exist", async () => {
    const { addSource, removeSource, readConfig } = await import("../../src/core/config.js");
    addSource({ name: "a", indexUrl: "https://a.com/..." });
    removeSource("nonexistent");
    expect(readConfig().sources).toHaveLength(1);
  });
});

describe("listSources", () => {
  it("returns empty array when no config", async () => {
    const { listSources } = await import("../../src/core/config.js");
    expect(listSources()).toEqual([]);
  });

  it("returns all sources", async () => {
    const { addSource, listSources } = await import("../../src/core/config.js");
    addSource({ name: "a", indexUrl: "https://a.com/..." });
    addSource({ name: "b", indexUrl: "https://b.com/..." });
    expect(listSources()).toHaveLength(2);
  });
});

describe("readConfig after write round-trip", () => {
  it("preserves apiBaseUrl", async () => {
    const { writeConfig, readConfig } = await import("../../src/core/config.js");
    const input = {
      sources: [
        { name: "internal", indexUrl: "https://gitlab.internal.co/registry.json", apiBaseUrl: "https://gitlab.internal.co/api/v4" },
      ],
    };
    writeConfig(input);
    const output = readConfig();
    expect(output).toEqual(input);
  });
});
