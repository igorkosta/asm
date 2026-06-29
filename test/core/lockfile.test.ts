import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { LockfileEntry } from "../../src/types/index.js";

let tmpDir: string;

const sampleEntry: LockfileEntry = {
  version: "2.1.0",
  resolved: "https://github.com/security-team/owasp/archive/v2.1.0.tar.gz",
  integrity: "sha256-abc123",
  agent: "opencode",
  skills: ["sast-analysis", "sqli-detection"],
};

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-lockfile-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("readLockfile", () => {
  it("returns empty lockfile when file does not exist", async () => {
    const { readLockfile } = await import("../../src/core/lockfile.js");
    expect(readLockfile(tmpDir)).toEqual({ packages: {} });
  });
});

describe("writeLockfile", () => {
  it("writes lockfile to disk", async () => {
    const { writeLockfile, lockfilePath } = await import("../../src/core/lockfile.js");
    writeLockfile(tmpDir, { packages: { owasp: sampleEntry } });
    expect(existsSync(lockfilePath(tmpDir))).toBe(true);
  });
});

describe("read-after-write round-trip", () => {
  it("preserves all fields", async () => {
    const { writeLockfile, readLockfile } = await import("../../src/core/lockfile.js");
    writeLockfile(tmpDir, { packages: { owasp: sampleEntry } });
    const loaded = readLockfile(tmpDir);
    expect(loaded.packages.owasp).toEqual(sampleEntry);
  });
});

describe("addToLockfile", () => {
  it("adds a new package entry", async () => {
    const { addToLockfile, readLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", sampleEntry);
    expect(readLockfile(tmpDir).packages.owasp.version).toBe("2.1.0");
  });

  it("overwrites existing entry with same name", async () => {
    const { addToLockfile, readLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", sampleEntry);
    const updated: LockfileEntry = {
      ...sampleEntry,
      version: "3.0.0",
    };
    addToLockfile(tmpDir, "owasp", updated);
    expect(readLockfile(tmpDir).packages.owasp.version).toBe("3.0.0");
  });
});

describe("removeFromLockfile", () => {
  it("removes an existing package", async () => {
    const { addToLockfile, removeFromLockfile, readLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", sampleEntry);
    addToLockfile(tmpDir, "other", sampleEntry);
    removeFromLockfile(tmpDir, "owasp");
    const lock = readLockfile(tmpDir);
    expect(lock.packages.owasp).toBeUndefined();
    expect(lock.packages.other).toBeDefined();
  });

  it("does nothing when package does not exist", async () => {
    const { addToLockfile, removeFromLockfile, readLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", sampleEntry);
    removeFromLockfile(tmpDir, "nonexistent");
    expect(readLockfile(tmpDir).packages.owasp).toBeDefined();
  });
});
