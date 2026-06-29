import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;
let pkgDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-uninstall-test-"));
  pkgDir = join(tmpDir, "owasp");
  mkdirSync(join(pkgDir, "skills", "sast-analysis"), { recursive: true });
  mkdirSync(join(pkgDir, "skills", "sqli-detection"), { recursive: true });
  writeFileSync(join(pkgDir, "skills", "sast-analysis", "SKILL.md"), "# SAST");
  writeFileSync(join(pkgDir, "skills", "sqli-detection", "SKILL.md"), "# SQLI");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("uninstallPackage", () => {
  it("removes the package directory", async () => {
    const { uninstallPackage } = await import("../../src/core/uninstaller.js");
    expect(existsSync(pkgDir)).toBe(true);
    uninstallPackage("owasp", pkgDir);
    expect(existsSync(pkgDir)).toBe(false);
  });

  it("does nothing when package not installed", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { uninstallPackage } = await import("../../src/core/uninstaller.js");
    uninstallPackage("nonexistent", join(tmpDir, "nonexistent"));

    expect(logs).toContain("Package 'nonexistent' is not installed.");
  });
});

describe("uninstallSkill", () => {
  it("removes a single skill directory", async () => {
    const { uninstallSkill } = await import("../../src/core/uninstaller.js");
    uninstallSkill("owasp", "sast-analysis", pkgDir, tmpDir);

    expect(existsSync(join(pkgDir, "skills", "sast-analysis"))).toBe(false);
    expect(existsSync(join(pkgDir, "skills", "sqli-detection"))).toBe(true);
  });

  it("removes the whole package when last skill is removed", async () => {
    const { addToLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", {
      version: "1.0",
      resolved: "https://example.com/tarball",
      integrity: "sha256-abc",
      agent: "opencode",
      skills: ["sast-analysis"],
    });

    const { uninstallSkill } = await import("../../src/core/uninstaller.js");
    uninstallSkill("owasp", "sast-analysis", pkgDir, tmpDir);

    expect(existsSync(pkgDir)).toBe(false);

    const { readLockfile } = await import("../../src/core/lockfile.js");
    expect(readLockfile(tmpDir).packages.owasp).toBeUndefined();
  });

  it("updates lockfile skills list when other skills remain", async () => {
    const { addToLockfile } = await import("../../src/core/lockfile.js");
    addToLockfile(tmpDir, "owasp", {
      version: "1.0",
      resolved: "https://example.com/tarball",
      integrity: "sha256-abc",
      agent: "opencode",
      skills: ["sast-analysis", "sqli-detection"],
    });

    const { uninstallSkill } = await import("../../src/core/uninstaller.js");
    uninstallSkill("owasp", "sast-analysis", pkgDir, tmpDir);

    const { readLockfile } = await import("../../src/core/lockfile.js");
    expect(readLockfile(tmpDir).packages.owasp.skills).toEqual(["sqli-detection"]);
  });

  it("logs when skill not found", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const { uninstallSkill } = await import("../../src/core/uninstaller.js");
    uninstallSkill("owasp", "nonexistent", pkgDir, tmpDir);

    expect(logs).toContain("Skill 'nonexistent' not found in package 'owasp'.");
  });
});
