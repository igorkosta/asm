import { fmt } from "../utils/format.js";

export async function list(
  options: { global?: boolean; agent?: string },
): Promise<void> {
  const { readLockfile } = await import("../core/lockfile.js");

  const rootDir = process.cwd();
  const lockfile = readLockfile(rootDir);
  const entries = Object.entries(lockfile.packages);

  if (entries.length === 0) {
    console.log(fmt.dim("No packages installed."));
    return;
  }

  const filtered = options.agent
    ? entries.filter(([, e]) => e.agent === options.agent)
    : entries;

  if (filtered.length === 0) {
    const suffix = options.agent ? ` for agent '${options.agent}'` : "";
    console.log(fmt.dim(`No packages installed${suffix}.`));
    return;
  }

  const lines: string[] = [];
  for (const [name, entry] of filtered) {
    const skillCount = entry.skills.length;
    const suffix = options.global ? `  [global: ${entry.agent}]` : "";
    lines.push(`${fmt.heading(name)}${suffix}`);
    lines.push(`  version: ${fmt.version(entry.version)}  |  ${fmt.bold(String(skillCount))} skills  |  agent: ${fmt.dim(entry.agent)}`);
    if (entry.skills.length > 0) {
      lines.push(`  skills: ${fmt.dim(entry.skills.join(", "))}`);
    }
    lines.push("");
  }
  console.log(lines.join("\n").trimEnd());
}
