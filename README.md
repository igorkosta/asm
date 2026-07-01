# `asm` — Agent Skills Manager

Install, search, update, and manage AI agent skills from your terminal.

```bash
npm install -g @igorkosta/asm
```

---

## Quick start

```bash
# Search the registry
asm search security

# Install a package
asm install addyosmani-agent-skills

# List installed packages
asm list
```

---

## Command reference

### `asm search <query>`

Search the registry for packages. Matches package name, description, skill name, and skill category.

```bash
asm search tdd
asm search security
asm search anthropic
```

Output shows matching packages with version, skill count, category breakdown, and the specific skills that matched.

---

### `asm install <pkg>`

Install a package (all its skills) locally.

```bash
asm install addyosmani-agent-skills
asm i kayaman-skills                # shorthand alias
```

| Flag | Description |
|------|-------------|
| `-g`, `--global` | Install globally for the target agent |
| `--agent <name>` | Target agent (opencode, pi, claude, etc.) |

Global install:

```bash
asm install microsoft-skills -g --agent opencode
```

Installed to `./ags_modules/skills/<pkg>/` (local) or `~/.config/<agent>/skills/<pkg>/` (global).

---

### `asm uninstall <pkg>`

Remove a package or a specific skill.

```bash
asm uninstall addyosmani-agent-skills          # remove entire package
asm un addyosmani-agent-skills/tdd             # remove one skill only
```

| Flag | Description |
|------|-------------|
| `-g`, `--global` | Remove from global install |
| `--agent <name>` | Target agent |

Removes the package from `ags-lock.json` and cleans `.gitignore` when the last local package is removed.

---

### `asm list`

Show installed packages and their skills.

```bash
asm list
asm ls                          # shorthand alias
asm list -g                     # global installs
asm list --agent opencode       # filter by agent
```

---

### `asm info <pkg>`

Show metadata for a package or a specific skill.

```bash
asm info addyosmani-agent-skills                # package overview
asm info addyosmani-agent-skills/tdd            # single skill detail
```

---

### `asm update [pkg]`

Update one or all installed packages to the latest version.

```bash
asm update addyosmani-agent-skills              # update one package
asm update                                      # update all packages
```

| Flag | Description |
|------|-------------|
| `-g`, `--global` | Update global installs |
| `--agent <name>` | Target agent |

Skips packages already at the latest version.

---

### `asm init [name]`

Scaffold a new skill package in the current directory.

```bash
asm init my-skills
asm init --description "My skill collection" --version 0.1.0
```

Creates `ags.json`, `skills/` directory, and a sample skill file.

---

### `asm publish`

Validate the `ags.json` manifest in the current directory and output a registry entry snippet.

```bash
asm publish
```

Checks for required fields and verifies that referenced skill entry files exist.

---

### `asm source`

Manage registry sources.

```bash
asm source list                     # list configured sources
asm source add my-index <url>       # add a source
asm source remove my-index          # remove a source
```

| Flag | Description |
|------|-------------|
| `--api-base-url <url>` | API base URL for self-hosted instances (GitHub Enterprise, GitLab) |

When no sources are configured, ships with a built-in default registry of 8 curated packages.

---

## Configuration

Config file: `~/.config/ags/config.json`

```json
{
  "sources": [
    {
      "name": "community",
      "indexUrl": "https://raw.githubusercontent.com/agent-skills/index/main/registry.json"
    }
  ]
}
```

| Env var | Overrides |
|---------|-----------|
| `AGS_CONFIG_DIR` | Config directory (default `~/.config/ags`) |
| `AGS_AGENT` | Default agent name for global installs |

---

## Install paths

| Scope | Path |
|-------|------|
| Local | `./ags_modules/skills/<pkg>/` |
| Global | `~/.config/<agent>/skills/<pkg>/` |

Global installs require `--agent <name>` or `AGS_AGENT` env var.

---

## Default registry

Nine curated packages are built-in — nothing to configure to get started:

| Package | Skills | Description |
|---------|--------|-------------|
| `addyosmani-agent-skills` | 24 | Spec, plan, build, test, review, ship workflows |
| `anthropics-skills` | 17 | Creative, technical, and enterprise skill examples |
| `farmage-opencode-skills` | 66 | Skills across 12 domains |
| `kayaman-skills` | 46 | Best practices, conventions, and architecture guidance |
| `microsoft-skills` | 174 | Azure SDK and AI Foundry development |
| `flitzrrr-agent-skills` | 504 | Curated from 19 verified sources |
| `newmindsgroup-ai-agent-skills-library` | 1,513 | With brand-config.yml and starter packs |
| `superagent-skills` | 12 | Security skills — hacker, recon, supply-chain, crypto, infra, and more |
| `christophacham-agent-skills-library` | 2,622 | Consolidated from 48 sources across 34 categories |

Add more sources with `asm source add` to extend beyond the defaults.

---

## Lockfile (`ags-lock.json`)

Written to the project root on local installs. Always fresh — no cache.

```json
{
  "packages": {
    "addyosmani-agent-skills": {
      "version": "0.6.2",
      "resolved": "https://github.com/addyosmani/agent-skills/archive/0.6.2.tar.gz",
      "integrity": "sha256-...",
      "agent": "local",
      "skills": ["test-driven-development", "security-and-hardening"]
    }
  }
}
```

---

## Development

```bash
npm run dev           # run directly from source (no build needed)
npm test              # run tests
npm run build         # compile TypeScript to dist/
```
