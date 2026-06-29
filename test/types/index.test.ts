import { describe, it, expect } from "vitest";
import type {
  Source,
  AsmConfig,
  RegistryEntry,
  RegistryIndex,
  PackageManifest,
  SkillManifest,
  LockfileEntry,
  Lockfile,
  RepositoryInfo,
} from "../../src/types/index.js";

function jsonRoundtrip<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

describe("Source", () => {
  it("supports cloud GitHub source", () => {
    const src: Source = {
      name: "community",
      indexUrl: "https://raw.githubusercontent.com/agent-skills/index/main/registry.json",
    };
    const round = jsonRoundtrip(src);
    expect(round.name).toBe("community");
    expect(round.indexUrl).toContain("githubusercontent.com");
    expect(round.apiBaseUrl).toBeUndefined();
  });

  it("supports self-hosted GitLab source with apiBaseUrl", () => {
    const src: Source = {
      name: "internal",
      indexUrl: "https://gitlab.internal.co/team/registry/raw/main/registry.json",
      apiBaseUrl: "https://gitlab.internal.co/api/v4",
    };
    const round = jsonRoundtrip(src);
    expect(round.name).toBe("internal");
    expect(round.apiBaseUrl).toBe("https://gitlab.internal.co/api/v4");
  });
});

describe("AsmConfig", () => {
  it("holds multiple sources", () => {
    const config: AsmConfig = {
      sources: [
        { name: "community", indexUrl: "https://github.com/..." },
        { name: "internal", indexUrl: "https://gitlab.internal.co/..." },
      ],
    };
    const round = jsonRoundtrip(config);
    expect(round.sources).toHaveLength(2);
    expect(round.sources[1].name).toBe("internal");
  });

  it("allows empty sources list", () => {
    const config: AsmConfig = { sources: [] };
    expect(jsonRoundtrip(config).sources).toEqual([]);
  });
});

describe("RegistryEntry / RegistryIndex", () => {
  const entry: RegistryEntry = {
    description: "OWASP security testing toolkit",
    latest: "2.1.0",
    repository: "https://github.com/agent-skills/owasp",
    platforms: ["opencode"],
    skills: ["sast-analysis", "sqli-detection", "xss-detection"],
  };

  it("round-trips a single entry", () => {
    const round = jsonRoundtrip(entry);
    expect(round.description).toBe("OWASP security testing toolkit");
    expect(round.latest).toBe("2.1.0");
    expect(round.repository).toBe("https://github.com/agent-skills/owasp");
    expect(round.platforms).toEqual(["opencode"]);
    expect(round.skills).toHaveLength(3);
  });

  it("supports multi-platform entry", () => {
    const multi: RegistryEntry = {
      ...entry,
      platforms: ["opencode", "pi", "claude"],
    };
    expect(jsonRoundtrip(multi).platforms).toHaveLength(3);
  });

  it("round-trips a full registry index", () => {
    const index: RegistryIndex = {
      owasp: entry,
      "audit-tool": {
        description: "Audit logging toolkit",
        latest: "1.0.0",
        repository: "https://gitlab.internal.co/security/audit-tool",
        platforms: ["opencode"],
        skills: ["audit-logger", "compliance-check"],
      },
    };
    const round = jsonRoundtrip(index);
    expect(Object.keys(round)).toHaveLength(2);
    expect(round["audit-tool"].repository).toContain("gitlab.internal.co");
  });

  it("handles empty registry", () => {
    expect(jsonRoundtrip({} as RegistryIndex)).toEqual({});
  });
});

describe("PackageManifest / SkillManifest", () => {
  const manifest: PackageManifest = {
    name: "owasp",
    version: "2.1.0",
    description: "OWASP security testing toolkit",
    platforms: ["opencode"],
    repository: "https://github.com/agent-skills/owasp",
    skills: [
      {
        name: "sast-analysis",
        description: "Architecture analysis SAST skill",
        entry: "skills/sast-analysis/SKILL.md",
      },
    ],
  };

  it("round-trips manifest with skills", () => {
    const round = jsonRoundtrip(manifest);
    expect(round.name).toBe("owasp");
    expect(round.skills).toHaveLength(1);
    expect(round.skills[0].entry).toBe("skills/sast-analysis/SKILL.md");
  });

  it("allows skill with optional scripts/assets", () => {
    const skill: SkillManifest = {
      name: "sqli-detection",
      description: "SQL injection detection",
      entry: "skills/sqli-detection/SKILL.md",
    };
    const m: PackageManifest = {
      ...manifest,
      skills: [...manifest.skills, skill],
    };
    expect(jsonRoundtrip(m).skills).toHaveLength(2);
  });

  it("allows manifest with no skills", () => {
    const empty: PackageManifest = {
      ...manifest,
      skills: [],
    };
    expect(jsonRoundtrip(empty).skills).toEqual([]);
  });
});

describe("Lockfile / LockfileEntry", () => {
  const entry: LockfileEntry = {
    version: "2.1.0",
    resolved: "https://github.com/agent-skills/owasp/archive/v2.1.0.tar.gz",
    integrity: "sha256-abc123def456",
    agent: "opencode",
    skills: ["sast-analysis", "sqli-detection"],
  };

  it("round-trips a lockfile entry", () => {
    const round = jsonRoundtrip(entry);
    expect(round.version).toBe("2.1.0");
    expect(round.resolved).toContain("owasp/archive");
    expect(round.integrity).toMatch(/^sha256-/);
    expect(round.agent).toBe("opencode");
    expect(round.skills).toContain("sast-analysis");
  });

  it("round-trips a lockfile with multiple packages", () => {
    const lockfile: Lockfile = {
      packages: {
        owasp: entry,
        "audit-tool": {
          version: "1.0.0",
          resolved: "https://gitlab.internal.co/security/audit-tool/-/archive/v1.0.0/v1.0.0.tar.gz",
          integrity: "sha256-xyz789",
          agent: "opencode",
          skills: ["audit-logger"],
        },
      },
    };
    const round = jsonRoundtrip(lockfile);
    expect(Object.keys(round.packages)).toHaveLength(2);
    expect(round.packages["audit-tool"].skills).toHaveLength(1);
  });

  it("handles empty lockfile", () => {
    const empty: Lockfile = { packages: {} };
    expect(jsonRoundtrip(empty)).toEqual({ packages: {} });
  });
});

describe("RepositoryInfo", () => {
  it("holds GitHub info", () => {
    const repo: RepositoryInfo = {
      platform: "github",
      host: "github.com",
      owner: "agent-skills",
      repo: "owasp",
    };
    expect(repo.platform).toBe("github");
    expect(repo.apiBaseUrl).toBeUndefined();
  });

  it("holds GitLab info with apiBaseUrl", () => {
    const repo: RepositoryInfo = {
      platform: "gitlab",
      host: "gitlab.internal.co",
      owner: "security",
      repo: "audit-tool",
      apiBaseUrl: "https://gitlab.internal.co/api/v4",
    };
    expect(repo.apiBaseUrl).toBe("https://gitlab.internal.co/api/v4");
  });
});
