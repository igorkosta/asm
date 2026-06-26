import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Source } from "../../src/types/index.js";

const validIndex = {
  owasp: {
    description: "OWASP security testing toolkit",
    latest: "2.1.0",
    repository: "https://github.com/security-team/owasp",
    platforms: ["opencode"],
    skills: ["sast-analysis", "sqli-detection"],
  },
  "audit-tool": {
    description: "Audit logging toolkit",
    latest: "1.0.0",
    repository: "https://gitlab.internal.co/security/audit-tool",
    platforms: ["opencode"],
    skills: ["audit-logger"],
  },
};

function mockFetch(response: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
  });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchRegistry", () => {
  it("fetches and parses a single source", async () => {
    global.fetch = mockFetch(validIndex);
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const sources: Source[] = [
      { name: "community", indexUrl: "https://example.com/registry.json" },
    ];
    const result = await fetchRegistry(sources);

    expect(result.owasp.description).toBe("OWASP security testing toolkit");
    expect(result["audit-tool"].latest).toBe("1.0.0");
  });

  it("merges multiple sources (later overwrites earlier)", async () => {
    global.fetch = mockFetch(validIndex);
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const sources: Source[] = [
      { name: "a", indexUrl: "https://a.com/registry.json" },
      { name: "b", indexUrl: "https://b.com/registry.json" },
    ];
    const result = await fetchRegistry(sources);

    expect(result.owasp.description).toBe("OWASP security testing toolkit");
    expect(result["audit-tool"].latest).toBe("1.0.0");
  });

  it("skips source on non-200 and logs warning", async () => {
    global.fetch = mockFetch(null, 404);
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const sources: Source[] = [
      { name: "missing", indexUrl: "https://example.com/registry.json" },
    ];
    const result = await fetchRegistry(sources);

    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"missing" returned 404'),
    );
  });

  it("skips source on network error and logs warning", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const sources: Source[] = [
      { name: "broken", indexUrl: "https://example.com/registry.json" },
    ];
    const result = await fetchRegistry(sources);

    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"broken"'),
    );
  });

  it("skips source on invalid JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const sources: Source[] = [
      { name: "bad-json", indexUrl: "https://example.com/registry.json" },
    ];
    const result = await fetchRegistry(sources);

    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"bad-json"'),
    );
  });

  it("returns default registry for empty sources", async () => {
    global.fetch = mockFetch(validIndex);
    const { fetchRegistry } = await import("../../src/core/registry.js");

    const result = await fetchRegistry([]);
    expect(Object.keys(result).length).toBeGreaterThan(0);
    expect(result["addyosmani-agent-skills"]).toBeDefined();
  });
});

describe("searchRegistry", () => {
  it("finds by exact package name", async () => {
    const { searchRegistry } = await import("../../src/core/registry.js");
    const results = searchRegistry(validIndex, "owasp");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("owasp");
  });

  it("finds by partial description", async () => {
    const { searchRegistry } = await import("../../src/core/registry.js");
    const results = searchRegistry(validIndex, "logging");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("audit-tool");
  });

  it("returns empty array for no match", async () => {
    const { searchRegistry } = await import("../../src/core/registry.js");
    const results = searchRegistry(validIndex, "nonexistent");

    expect(results).toHaveLength(0);
  });

  it("is case-insensitive", async () => {
    const { searchRegistry } = await import("../../src/core/registry.js");
    const results = searchRegistry(validIndex, "OWASP");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("owasp");
  });

  it("matches multiple entries", async () => {
    const { searchRegistry } = await import("../../src/core/registry.js");
    const results = searchRegistry(validIndex, "toolkit");

    expect(results).toHaveLength(2);
  });
});
