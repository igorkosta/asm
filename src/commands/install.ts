import { fmt } from "../utils/format.js";
import type { LockfileEntry } from "../types/index.js";

export async function install(
  pkgSpec: string,
  options: { global?: boolean; agent?: string },
): Promise<void> {
  const { readConfig } = await import("../core/config.js");
  const { resolvePackageDir } = await import("../core/config.js");
  const { fetchRegistry } = await import("../core/registry.js");
  const { installPackage } = await import("../core/installer.js");
  const { addToLockfile } = await import("../core/lockfile.js");
  const { ensureGitignore } = await import("../core/gitignore.js");

  const config = readConfig();
  const index = await fetchRegistry(config.sources);

  const pkgName = pkgSpec;
  const entry = index[pkgName];

  if (!entry) {
    console.error(fmt.error(`Package ${fmt.pkg(pkgName)} not found in registry.`));
    process.exit(1);
  }

  const dest = resolvePackageDir(pkgName, options);
  const agent = options.global ? (options.agent ?? process.env.AGS_AGENT ?? "opencode") : "local";

  console.log(`Installing ${fmt.pkg(pkgName)} (${fmt.version(entry.latest)})...`);

  const { integrity, resolved } = await installPackage(pkgName, entry, dest);

  const lockfileEntry: LockfileEntry = {
    version: entry.latest,
    resolved,
    integrity,
    agent,
    skills: (entry.skills ?? []).map((s) => (typeof s === "string" ? s : s.name)),
  };

  const rootDir = process.cwd();
  addToLockfile(rootDir, pkgName, lockfileEntry);

  if (!options.global) {
    ensureGitignore(rootDir);
  }

  const count = entry.skills ? entry.skills.length : (entry.skillCount ?? "?");
  console.log(fmt.success(`Installed ${fmt.pkg(pkgName)} (${fmt.bold(String(count))} skills)`));
}
