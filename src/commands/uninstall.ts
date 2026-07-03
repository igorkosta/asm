import { fmt } from "../utils/format.js";

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
  const pkgName = slashIdx >= 0 ? pkgSpec.slice(0, slashIdx) : pkgSpec;
  const dest = resolvePackageDir(pkgName, options);

  if (slashIdx >= 0) {
    const skillName = pkgSpec.slice(slashIdx + 1);

    uninstallSkill(pkgName, skillName, dest, rootDir);

    console.log(fmt.success(`Removed skill ${fmt.pkg(skillName)} from package ${fmt.pkg(pkgName)}.`));
  } else {
    uninstallPackage(pkgName, dest);
    removeFromLockfile(rootDir, pkgName);

    if (!options.global) {
      const lockfile = readLockfile(rootDir);
      if (Object.keys(lockfile.packages).length === 0) {
        removeGitignore(rootDir);
      }
    }

    console.log(fmt.success(`Removed package ${fmt.pkg(pkgName)}.`));
  }
}
