import { fmt } from "../utils/format.js";
import type { LockfileEntry } from "../types/index.js";

async function updateOne(
  pkgName: string,
  options: { global?: boolean; agent?: string },
): Promise<void> {
  const { resolvePackageDir } = await import("../core/config.js");
  const { installPackage } = await import("../core/installer.js");
  const { readLockfile, addToLockfile } = await import("../core/lockfile.js");

  const rootDir = process.cwd();
  const lockfile = readLockfile(rootDir);
  const current = lockfile.packages[pkgName];
  if (!current) {
    console.error(fmt.error(`Package ${fmt.pkg(pkgName)} is not installed.`));
    return;
  }

  const { fetchRegistry } = await import("../core/registry.js");
  const { readConfig } = await import("../core/config.js");
  const config = readConfig();
  const index = await fetchRegistry(config.sources);
  const entry = index[pkgName];

  if (!entry) {
    console.error(fmt.error(`Package ${fmt.pkg(pkgName)} not found in registry.`));
    return;
  }

  if (entry.latest === current.version) {
    console.log(`${fmt.pkg(pkgName)} is already at latest version ${fmt.version(entry.latest)}.`);
    return;
  }

  const dest = resolvePackageDir(pkgName, options);
  console.log(`Updating ${fmt.pkg(pkgName)} (${fmt.version(current.version)} ${fmt.arrow} ${fmt.version(entry.latest)})...`);

  const { integrity, resolved } = await installPackage(pkgName, entry, dest);

  const updated: LockfileEntry = {
    version: entry.latest,
    resolved,
    integrity,
    agent: current.agent,
    skills: current.skills,
  };

  addToLockfile(rootDir, pkgName, updated);

  const count = entry.skills ? entry.skills.length : (entry.skillCount ?? "?");
  console.log(fmt.success(`Updated ${fmt.pkg(pkgName)} (${fmt.bold(String(count))} skills)`));
}

export async function update(
  pkg: string | undefined,
  options: { global?: boolean; agent?: string },
): Promise<void> {
  if (pkg) {
    await updateOne(pkg, options);
    return;
  }

  const { readLockfile } = await import("../core/lockfile.js");
  const lockfile = readLockfile(process.cwd());
  const packages = Object.keys(lockfile.packages);

  if (packages.length === 0) {
    console.log(fmt.dim("No packages installed."));
    return;
  }

  for (const pkgName of packages) {
    await updateOne(pkgName, options);
  }
}
