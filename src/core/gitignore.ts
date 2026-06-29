import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ENTRY = "ags_modules/skills/";

export function gitignorePath(rootDir: string): string {
  return join(rootDir, ".gitignore");
}

export function ensureGitignore(rootDir: string): void {
  const path = gitignorePath(rootDir);
  const content = existsSync(path) ? readFileSync(path, "utf-8") : "";
  const lines = content.split(/\r?\n/);

  if (lines.includes(ENTRY)) return;

  const newContent = content.endsWith("\n") || content === ""
    ? `${content}${ENTRY}\n`
    : `${content}\n${ENTRY}\n`;
  writeFileSync(path, newContent);
}

export function removeGitignore(rootDir: string): void {
  const path = gitignorePath(rootDir);
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l !== ENTRY);
  const newContent = lines.join("\n");
  writeFileSync(path, newContent + (newContent.length > 0 ? "\n" : ""));
}
