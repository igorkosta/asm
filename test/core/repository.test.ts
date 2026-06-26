import { describe, it, expect } from "vitest";
import { parseRepository, detectPlatform, tarballUrl } from "../../src/core/repository.js";

describe("parseRepository", () => {
  it("parses a full GitHub URL", () => {
    const r = parseRepository("https://github.com/security-team/owasp");
    expect(r.host).toBe("github.com");
    expect(r.owner).toBe("security-team");
    expect(r.repo).toBe("owasp");
  });

  it("parses a full GitLab URL", () => {
    const r = parseRepository("https://gitlab.com/devops/audit-tool");
    expect(r.host).toBe("gitlab.com");
    expect(r.owner).toBe("devops");
    expect(r.repo).toBe("audit-tool");
  });

  it("parses a self-hosted URL", () => {
    const r = parseRepository("https://gitlab.internal.co/org/tool");
    expect(r.host).toBe("gitlab.internal.co");
    expect(r.owner).toBe("org");
    expect(r.repo).toBe("tool");
  });

  it("strips trailing slash", () => {
    const r = parseRepository("https://github.com/owner/repo/");
    expect(r.repo).toBe("repo");
  });

  it("strips .git suffix", () => {
    const r = parseRepository("https://github.com/owner/repo.git");
    expect(r.repo).toBe("repo");
  });

  it("prepends https:// when protocol missing", () => {
    const r = parseRepository("github.com/owner/repo");
    expect(r.host).toBe("github.com");
    expect(r.owner).toBe("owner");
    expect(r.repo).toBe("repo");
  });

  it("strips www. prefix", () => {
    const r = parseRepository("https://www.github.com/owner/repo");
    expect(r.host).toBe("github.com");
  });

  it("defaults platform to github", () => {
    const r = parseRepository("https://github.com/owner/repo");
    expect(r.platform).toBe("github");
  });

  it("throws on URL without owner/repo", () => {
    expect(() => parseRepository("https://github.com")).toThrow(/owner\/repo/);
  });

  it("throws on empty string", () => {
    expect(() => parseRepository("")).toThrow();
  });
});

describe("detectPlatform", () => {
  it("detects github.com as github", () => {
    expect(detectPlatform("github.com")).toBe("github");
  });

  it("detects gitlab.com as gitlab", () => {
    expect(detectPlatform("gitlab.com")).toBe("gitlab");
  });

  it("detects github via apiBaseUrl with v3", () => {
    expect(detectPlatform("ghe.internal.co", "https://ghe.internal.co/api/v3")).toBe("github");
  });

  it("detects gitlab via apiBaseUrl with v4", () => {
    expect(detectPlatform("gitlab.internal.co", "https://gitlab.internal.co/api/v4")).toBe("gitlab");
  });

  it("defaults to github for unknown host without apiBaseUrl", () => {
    expect(detectPlatform("unknown.host.com")).toBe("github");
  });

  it("is case-insensitive", () => {
    expect(detectPlatform("GITHUB.COM")).toBe("github");
  });

  it("strips www. before detection", () => {
    expect(detectPlatform("www.gitlab.com")).toBe("gitlab");
  });
});

describe("tarballUrl", () => {
  it("constructs GitHub tarball URL for tag ref", () => {
    const info = parseRepository("https://github.com/security-team/owasp");
    expect(tarballUrl(info, "v2.1.0")).toBe(
      "https://github.com/security-team/owasp/archive/v2.1.0.tar.gz",
    );
  });

  it("constructs GitHub tarball URL for branch ref", () => {
    const info = parseRepository("https://github.com/owner/repo");
    expect(tarballUrl(info, "main")).toBe(
      "https://github.com/owner/repo/archive/main.tar.gz",
    );
  });

  it("constructs GitHub tarball URL for tag without v prefix", () => {
    const info = parseRepository("https://github.com/owner/repo");
    expect(tarballUrl(info, "0.6.2")).toBe(
      "https://github.com/owner/repo/archive/0.6.2.tar.gz",
    );
  });

  it("constructs GitLab tarball URL", () => {
    const info = parseRepository("https://gitlab.com/devops/audit-tool");
    expect(tarballUrl(info, "v1.0.0")).toBe(
      "https://gitlab.com/devops/audit-tool/-/archive/v1.0.0/v1.0.0.tar.gz",
    );
  });

  it("uses self-hosted host in URL", () => {
    const info = parseRepository("https://ghe.internal.co/org/tool");
    expect(tarballUrl(info, "v2.0.0")).toBe(
      "https://ghe.internal.co/org/tool/archive/v2.0.0.tar.gz",
    );
  });

  it("uses gitlab format for self-hosted gitlab with apiBaseUrl hint", () => {
    const info = parseRepository("https://gitlab.internal.co/org/tool");
    const url = tarballUrl(info, "v3.0.0", "https://gitlab.internal.co/api/v4");
    expect(url).toBe(
      "https://gitlab.internal.co/org/tool/-/archive/v3.0.0/v3.0.0.tar.gz",
    );
  });

  it("uses github format for self-hosted github with apiBaseUrl hint", () => {
    const info = parseRepository("https://ghe.internal.co/org/tool");
    const url = tarballUrl(info, "v1.0.0", "https://ghe.internal.co/api/v3");
    expect(url).toBe(
      "https://ghe.internal.co/org/tool/archive/v1.0.0.tar.gz",
    );
  });
});
