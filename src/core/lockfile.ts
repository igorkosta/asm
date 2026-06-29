import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Lockfile, LockfileEntry } from "../types/index.js";

export function lockfilePath(rootDir: string): string {
  return join(rootDir, "ags-lock.json");
}

export function readLockfile(rootDir: string): Lockfile {
  const path = lockfilePath(rootDir);
  if (!existsSync(path)) return { packages: {} };
  return JSON.parse(readFileSync(path, "utf-8")) as Lockfile;
}

export function writeLockfile(rootDir: string, lockfile: Lockfile): void {
  writeFileSync(lockfilePath(rootDir), JSON.stringify(lockfile, null, 2) + "\n");
}

export function addToLockfile(
  rootDir: string,
  pkgName: string,
  entry: LockfileEntry,
): void {
  const lockfile = readLockfile(rootDir);
  lockfile.packages[pkgName] = entry;
  writeLockfile(rootDir, lockfile);
}

export function removeFromLockfile(rootDir: string, pkgName: string): void {
  const lockfile = readLockfile(rootDir);
  delete lockfile.packages[pkgName];
  writeLockfile(rootDir, lockfile);
}
