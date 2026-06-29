import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir: string;
let gitignorePath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ags-gitignore-test-"));
  gitignorePath = join(tmpDir, ".gitignore");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("ensureGitignore", () => {
  it("creates .gitignore and adds entry if file does not exist", async () => {
    const { ensureGitignore } = await import("../../src/core/gitignore.js");
    ensureGitignore(tmpDir);

    expect(existsSync(gitignorePath)).toBe(true);
    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).toContain("ags_modules/skills/");
  });

  it("appends entry to existing .gitignore", async () => {
    writeFileSync(gitignorePath, "node_modules/\n");

    const { ensureGitignore } = await import("../../src/core/gitignore.js");
    ensureGitignore(tmpDir);

    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).toContain("node_modules/");
    expect(content).toContain("ags_modules/skills/");
  });

  it("does not duplicate entry", async () => {
    const { ensureGitignore } = await import("../../src/core/gitignore.js");
    ensureGitignore(tmpDir);
    ensureGitignore(tmpDir);

    const content = readFileSync(gitignorePath, "utf-8");
    const matches = content.match(/ags_modules\/skills\//g);
    expect(matches).toHaveLength(1);
  });

  it("is a no-op when entry already present", async () => {
    writeFileSync(gitignorePath, "ags_modules/skills/\n");

    const { ensureGitignore } = await import("../../src/core/gitignore.js");
    ensureGitignore(tmpDir);

    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).toBe("ags_modules/skills/\n");
  });
});

describe("removeGitignore", () => {
  it("removes the entry from .gitignore", async () => {
    writeFileSync(gitignorePath, "node_modules/\nags_modules/skills/\n.env\n");

    const { removeGitignore } = await import("../../src/core/gitignore.js");
    removeGitignore(tmpDir);

    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).not.toContain("ags_modules/skills/");
    expect(content).toContain("node_modules/");
    expect(content).toContain(".env");
  });

  it("does nothing when file does not exist", async () => {
    const { removeGitignore } = await import("../../src/core/gitignore.js");
    removeGitignore(tmpDir);

    expect(existsSync(gitignorePath)).toBe(false);
  });

  it("does nothing when entry is not in file", async () => {
    writeFileSync(gitignorePath, "node_modules/\n");

    const { removeGitignore } = await import("../../src/core/gitignore.js");
    removeGitignore(tmpDir);

    const content = readFileSync(gitignorePath, "utf-8");
    expect(content).toContain("node_modules/");
  });
});
