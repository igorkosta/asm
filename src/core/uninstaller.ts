import { existsSync, rmSync } from "fs";
import { join } from "path";
import { removeFromLockfile, addToLockfile, readLockfile } from "./lockfile.js";
import type { LockfileEntry } from "../types/index.js";

export function uninstallPackage(pkgName: string, dest: string): void {
  if (!existsSync(dest)) {
    console.log(`Package '${pkgName}' is not installed.`);
    return;
  }
  rmSync(dest, { recursive: true, force: true });
}

export function uninstallSkill(
  pkgName: string,
  skillName: string,
  dest: string,
  rootDir: string,
): void {
  const skillDir = join(dest, "skills", skillName);
  if (!existsSync(skillDir)) {
    console.log(`Skill '${skillName}' not found in package '${pkgName}'.`);
    return;
  }
  rmSync(skillDir, { recursive: true, force: true });

  const lockfile = readLockfile(rootDir);
  const entry = lockfile.packages[pkgName];
  if (entry) {
    const remaining = entry.skills.filter((s) => s !== skillName);
    if (remaining.length === 0) {
      removeFromLockfile(rootDir, pkgName);
      rmSync(dest, { recursive: true, force: true });
    } else {
      addToLockfile(rootDir, pkgName, { ...entry, skills: remaining });
    }
  }
}
