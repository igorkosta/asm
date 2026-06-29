export async function uninstall(
  pkgSpec: string,
  options: { global?: boolean; agent?: string },
): Promise<void> {
  const { resolvePackageDir } = await import("../core/config.js");
  const { uninstallPackage, uninstallSkill } = await import("../core/uninstaller.js");
  const { readLockfile, removeFromLockfile } = await import("../core/lockfile.js");
  const { removeGitignore } = await import("../core/gitignore.js");

  const slashIdx = pkgSpec.indexOf("/");
  const rootDir = process.cwd();

  if (slashIdx >= 0) {
    const pkgName = pkgSpec.slice(0, slashIdx);
    const skillName = pkgSpec.slice(slashIdx + 1);
    const dest = resolvePackageDir(pkgName, options);

    uninstallSkill(pkgName, skillName, dest, rootDir);

    console.log(`Removed skill '${skillName}' from package '${pkgName}'.`);
  } else {
    const pkgName = pkgSpec;
    const dest = resolvePackageDir(pkgName, options);

    uninstallPackage(pkgName, dest);
    removeFromLockfile(rootDir, pkgName);

    if (!options.global) {
      const lockfile = readLockfile(rootDir);
      if (Object.keys(lockfile.packages).length === 0) {
        removeGitignore(rootDir);
      }
    }

    console.log(`Removed package '${pkgName}'.`);
  }
}
