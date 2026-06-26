import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as tar from "tar";

let fixtureBuffer: Buffer;
let fixtureDest: string;

beforeAll(async () => {
  const tmp = mkdtempSync(join(tmpdir(), "asm-install-fixture-"));
  const topDir = join(tmp, "fake-pkg-1.0.0");
  const skillsDir = join(topDir, "skills", "test-skill");
  mkdirSync(skillsDir, { recursive: true });
  writeFileSync(join(skillsDir, "SKILL.md"), "# Test Skill\nHello world\n");
  writeFileSync(join(topDir, "asm.json"), JSON.stringify({ name: "fake-pkg" }));

  const stream = tar.c(
    { cwd: tmp, portable: true, gzip: true },
    ["fake-pkg-1.0.0"],
  );
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  fixtureBuffer = Buffer.concat(chunks);
  // Create an independent copy (Buffer.from shares backing store)
  const copy = Buffer.alloc(fixtureBuffer.length);
  fixtureBuffer.copy(copy);
  fixtureBuffer = copy;

  rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => {
  fixtureDest = mkdtempSync(join(tmpdir(), "asm-install-test-"));
});

afterEach(() => {
  rmSync(fixtureDest, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

describe("downloadPackage", () => {
  it("downloads and extracts tarball", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: () => Promise.resolve(fixtureBuffer.buffer),
    }));

    const { downloadPackage } = await import("../../src/core/installer.js");

    const result = await downloadPackage(
      "https://github.com/security-team/fake-pkg",
      "1.0.0",
      fixtureDest,
    );

    expect(result.integrity).toMatch(/^sha256-/);
    expect(result.resolved).toContain("fake-pkg/archive/1.0.0.tar.gz");
    expect(existsSync(join(fixtureDest, "asm.json"))).toBe(true);
    expect(existsSync(join(fixtureDest, "skills", "test-skill", "SKILL.md"))).toBe(true);

    const content = readFileSync(join(fixtureDest, "skills", "test-skill", "SKILL.md"), "utf-8");
    expect(content).toContain("Hello world");
  });

  it("throws on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    }));

    const { downloadPackage } = await import("../../src/core/installer.js");

    await expect(
      downloadPackage("https://github.com/security-team/fake-pkg", "1.0.0", fixtureDest),
    ).rejects.toThrow(/404/);
  });

  it("throws on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const { downloadPackage } = await import("../../src/core/installer.js");

    await expect(
      downloadPackage("https://github.com/security-team/fake-pkg", "1.0.0", fixtureDest),
    ).rejects.toThrow("ECONNREFUSED");
  });

  it("uses GitLab tarball URL format", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: () => Promise.resolve(fixtureBuffer.buffer),
    }));

    const { downloadPackage } = await import("../../src/core/installer.js");

    const result = await downloadPackage(
      "https://gitlab.com/devops/fake-pkg",
      "v1.0.0",
      fixtureDest,
      "https://gitlab.com/api/v4",
    );

    expect(result.resolved).toContain("gitlab.com/devops/fake-pkg/-/archive/v1.0.0");
  });
});

describe("installPackage", () => {
  it("downloads and extracts using a RegistryEntry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: () => Promise.resolve(fixtureBuffer.buffer),
    }));

    const { installPackage } = await import("../../src/core/installer.js");

    const entry = {
      description: "Fake package",
      latest: "1.0.0",
      repository: "https://github.com/security-team/fake-pkg",
      platforms: ["opencode"],
      skills: ["test-skill"],
    };

    const result = await installPackage("fake-pkg", entry, fixtureDest);

    expect(result.integrity).toMatch(/^sha256-/);
    expect(existsSync(join(fixtureDest, "asm.json"))).toBe(true);
  });
});
