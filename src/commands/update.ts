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
    console.error(`Package '${pkgName}' is not installed.`);
    return;
  }

  const { fetchRegistry } = await import("../core/registry.js");
  const { readConfig } = await import("../core/config.js");
  const config = readConfig();
  const index = await fetchRegistry(config.sources);
  const entry = index[pkgName];

  if (!entry) {
    console.error(`Package '${pkgName}' not found in registry.`);
    return;
  }

  if (entry.latest === current.version) {
    console.log(`'${pkgName}' is already at latest version ${entry.latest}.`);
    return;
  }

  const dest = resolvePackageDir(pkgName, options);
  console.log(`Updating '${pkgName}' (${current.version} → ${entry.latest})...`);

  const { integrity, resolved } = await installPackage(pkgName, entry, dest);

  const updated: LockfileEntry = {
    version: entry.latest,
    resolved,
    integrity,
    agent: current.agent,
    skills: current.skills,
  };

  addToLockfile(rootDir, pkgName, updated);

  const counts = entry.skills
    ? `${entry.skills.length} skills`
    : `${entry.skillCount ?? "?"} skills`;
  console.log(`Updated '${pkgName}' (${counts})`);
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
    console.log("No packages installed.");
    return;
  }

  for (const pkgName of packages) {
    await updateOne(pkgName, options);
  }
}
