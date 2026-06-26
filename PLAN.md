# Agent Skills Manager (`asm`)

A CLI package manager for AI agent skills, modeled after npm. Packages bundle one or more skills (e.g., `owasp` contains `sast-analysis`, `sqli-detection`, `xss-detection`). Skills are hosted in source repositories (GitHub or GitLab, cloud or self-hosted), indexed by one or more configurable registry sources.

---

## Design decisions

| Area | Decision |
|------|----------|
| Registry | Multiple sources configured in `~/.config/asm/config.json`; each source points to a `registry.json` |
| Source hosts | GitHub cloud, GitLab cloud, or self-hosted (any domain) |
| Platform detection | Auto-detect from hostname (`github.com`, `gitlab.com`); override via `apiBaseUrl` for self-hosted |
| Install granularity | `asm install pkg` installs all; `asm install pkg/skill` for one |
| Package > Skill | 1:N, versioned as a unit, skills owned by one package |
| Single-skill packages | Always `pkg/skill` path (no alias) |
| Manifest field | `"platforms": ["opencode", "pi", "claude"]` |
| Registry versions | Only `latest` (MVP); expand later |
| Version resolution | Direct tarball URL construction — `latest` is the exact ref name (tag, branch, or SHA) — no Releases API |
| Lockfile | JSON (`asm-lock.json`) |
| Registry cache | Always fresh |
| .gitignore | Auto-managed (like npm) |
| CLI language | TypeScript (Node.js), distributed via npm as `asm` |
| Test runner | vitest + v8 coverage, tests in `test/` (excluded from build) |

---

## Install paths

| Scope | Path |
|-------|------|
| Local | `./asm_modules/skills/<pkg>/` |
| Global (opencode) | `~/.config/opencode/skills/<pkg>/` |
| Global (pi) | `~/.config/pi/skills/<pkg>/` |
| Global (claude) | `~/.config/claude/skills/<pkg>/` |

Global installs require `--agent <name>`. Config resolution: `ASM_AGENT` env var, `--agent` flag, then interactive prompt.

---

## Config (`~/.config/asm/config.json`)

```json
{
  "sources": [
    {
      "name": "community",
      "indexUrl": "https://raw.githubusercontent.com/agent-skills/index/main/registry.json"
    },
    {
      "name": "internal",
      "indexUrl": "https://gitlab.internal.co/team/registry.json",
      "apiBaseUrl": "https://gitlab.internal.co/api/v4"
    }
  ]
}
```

- `name` — unique identifier
- `indexUrl` — URL to the `registry.json` index file
- `apiBaseUrl` — optional, for self-hosted platform detection (GitHub Enterprise → `/api/v3`, GitLab → `/api/v4`)

Managed via `asm source list|add|remove`.

**Default registry:** `asm` ships with a built-in `src/registry/default-registry.json` containing curated community packages. When no sources are configured, `fetchRegistry()` returns this built-in index — no setup required to start searching.

---

## Package structure

```
<package-name>/
  asm.json                     # Package manifest
  lib/                         # Shared utilities (optional)
  skills/
    <skill-name>/
      SKILL.md                 # Skill instructions
      scripts/                 # Bundled scripts (optional)
      assets/                  # Templates, configs (optional)
```

---

## Registry index format (`registry.json`)

```json
{
  "owasp": {
    "description": "OWASP security testing toolkit",
    "latest": "2.1.0",
    "repository": "https://github.com/security-team/owasp",
    "platforms": ["opencode"],
    "skills": [
      { "name": "sast-analysis", "category": "security" },
      { "name": "sqli-detection", "category": "security" },
      { "name": "xss-detection", "category": "security" }
    ]
  }
}
```

`repository` is a full URL: `https://github.com/{owner}/{repo}`, `https://gitlab.com/{owner}/{repo}`, or any self-hosted URL.

`skills` is optional — aggregator packages may omit it and use `skillCount` instead. Each skill has a `name` and optional `category` for searchability.

---

## Package manifest (`asm.json`)

```json
{
  "name": "owasp",
  "version": "2.1.0",
  "description": "OWASP security testing toolkit",
  "platforms": ["opencode"],
  "repository": "https://github.com/security-team/owasp",
  "skills": [
    {
      "name": "sast-analysis",
      "description": "Architecture analysis SAST skill",
      "entry": "skills/sast-analysis/SKILL.md"
    }
  ]
}
```

---

## Repository URL → tarball URL mapping

| Platform | Tarball URL pattern |
|----------|---------------------|
| GitHub (cloud or self-hosted) | `{host}/{owner}/{repo}/archive/{ref}.tar.gz` — ref can be tag, branch, or SHA |
| GitLab (cloud or self-hosted) | `{host}/{owner}/{repo}/-/archive/{ref}/{ref}.tar.gz` — ref can be tag, branch, or SHA |

No Releases API calls needed. The tarball URL is constructed directly from the repository URL + version tag.

---

## `asm install` flow

1. Fetch `registry.json` from each configured source, merge into unified index
2. Resolve package, find `latest` version from index entry
3. Parse `repository` URL → detect platform (GitHub / GitLab) → construct tarball URL
4. Download release tarball, compute SHA-256 integrity
5. Extract to target directory (strip top-level directory)
6. Write `asm-lock.json` entry
7. Auto-add `asm_modules/skills/` to `.gitignore` (local installs)

---

## Lockfile (`asm-lock.json`)

```json
{
  "packages": {
    "owasp": {
      "version": "2.1.0",
      "resolved": "https://github.com/security-team/owasp/archive/v2.1.0.tar.gz",
      "integrity": "sha256-...",
      "agent": "opencode",
      "skills": ["sast-analysis", "sqli-detection"]
    }
  }
}
```

Location: project root for local installs, agent config dir for global installs.

---

## CLI reference

| Command | Description |
|---------|-------------|
| `asm install <pkg>[/<skill>] [--agent <a>]` | Install package (all skills or one) |
| `asm uninstall <pkg>[/<skill>] [--agent <a>]` | Remove package or specific skill |
| `asm list [--agent <a>]` | List installed packages |
| `asm search <query>` | Search registry |
| `asm info <pkg>[/<skill>]` | Show metadata |
| `asm init` | Scaffold a new package |
| `asm update [<pkg>]` | Update to latest version |
| `asm publish` | Publish to registry |
| `asm source list\|add\|remove` | Manage registry sources |

---

## Implementation status

| # | Module | Status | What it does |
|---|--------|--------|--------------|
| 1 | `types/index.ts` | **Done** | TypeScript interfaces for `asm.json`, registry, lockfile, config, source, repository, skill entry |
| 2 | `core/config.ts` | **Done** | Read/write `~/.config/asm/config.json`, source management (add/remove/list), path resolution |
| 3 | `core/repository.ts` | **Done** | Parse repo URL, detect platform (GitHub/GitLab), construct tarball URL |
| 4 | `core/registry.ts` | **Done** | Fetch + parse `registry.json` from each source, merge, search (by name, description, skill name, category) |
| 5 | `core/lockfile.ts` | **Done** | Read/write `asm-lock.json` |
| 6 | `core/installer.ts` | **Done** | Download tarball, verify SHA-256, extract via `tar` |
| 7 | `core/uninstaller.ts` | **Done** | Remove package/skill files, clean lockfile |
| 8 | `core/gitignore.ts` | **Done** | Auto-add/remove `asm_modules/skills/` in `.gitignore` |
| 9 | `commands/source.ts` | **Done** | CLI handler for `source list\|add\|remove` |
| — | `index.ts` | **Done** | CLI entry point, arg parsing, routing |
| — | Tests | **Done** | 90 tests across `test/`; vitest + v8 coverage |
| 10 | `commands/search.ts` | **Done** | CLI handler for `search` — fetches registry, filters by query, shows category breakdown |
| 11 | `commands/info.ts` | **Not started** | CLI handler for `info` |
| 12 | `commands/install.ts` | **Done** | CLI handler for `install` — registry lookup, download, extract, lockfile, gitignore |
| 13 | `commands/uninstall.ts` | **Not started** | CLI handler for `uninstall` |
| 14 | `commands/list.ts` | **Not started** | CLI handler for `list` |
| 15 | `commands/init.ts` | **Not started** | Scaffold new package |
| 16 | `commands/update.ts` | **Not started** | Update to latest version |
| 17 | `commands/publish.ts` | **Not started** | Publish to registry |

---

## Project directory structure

```
asm/
  .gitignore                  # Excludes node_modules/, dist/, coverage/
  package.json                # npm package for CLI
  tsconfig.json               # TypeScript config (ES2024)
  vitest.config.ts            # vitest runner config
  PLAN.md
  src/
    index.ts                  # Entry point, CLI routing
    commands/
      source.ts               # source list|add|remove
      install.ts              # (not yet)
      uninstall.ts            # (not yet)
      list.ts                 # (not yet)
      search.ts               # (not yet)
      info.ts                 # (not yet)
      init.ts                 # (not yet)
      update.ts               # (not yet)
      publish.ts              # (not yet)
    core/
      config.ts               # Path detection, agent resolution, source config
      repository.ts           # URL parsing, platform detection, tarball URL construction
      registry.ts             # Fetch & parse registry index from sources (falls back to default)
      lockfile.ts             # Read/write asm-lock.json
      installer.ts            # Download + extract + integrity
      uninstaller.ts          # Remove + clean lockfile
      gitignore.ts            # Auto-manage .gitignore
    registry/
      default-registry.json   # Built-in package index (8 curated packages)
    types/
      index.ts                # All TypeScript interfaces
  test/
    types/
      index.test.ts
    core/
      config.test.ts
      repository.test.ts
      registry.test.ts
      lockfile.test.ts
      installer.test.ts
      uninstaller.test.ts
      gitignore.test.ts
    commands/
      source.test.ts
      install.test.ts      # (not yet)
      uninstall.test.ts    # (not yet)
      list.test.ts         # (not yet)
      search.test.ts       # (not yet)
      info.test.ts         # (not yet)
      init.test.ts         # (not yet)
```
