import { fmt } from "../utils/format.js";
import type { RegistryEntry, SkillEntry } from "../types/index.js";

function categoriesSummary(skills: SkillEntry[]): string {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    const cat = skill.category ?? "uncategorized";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.map(([cat, n]) => `${cat} (${n})`).join(", ");
}

function showPackage(pkgName: string, entry: RegistryEntry): void {
  const lines: string[] = [];
  lines.push(`${fmt.heading(pkgName)}`);
  lines.push(``);
  lines.push(`  ${fmt.dim(entry.description)}`);
  lines.push(``);
  lines.push(`  ${fmt.dim("latest:")}      ${fmt.version(entry.latest)}`);
  lines.push(`  ${fmt.dim("repository:")}  ${fmt.dim(entry.repository)}`);
  lines.push(`  ${fmt.dim("platforms:")}   ${fmt.dim(entry.platforms.join(", "))}`);
  lines.push(``);

  if (entry.skills && entry.skills.length > 0) {
    lines.push(`  ${fmt.dim("categories:")}  ${fmt.dim(categoriesSummary(entry.skills))}`);
    lines.push(``);
    lines.push(`  ${fmt.bold("skills:")}`);
    for (const skill of entry.skills) {
      const tag = skill.category ?? "";
      const desc = skill.description ?? "";
      lines.push(`    ${fmt.bold(skill.name.padEnd(36))} ${fmt.dim(tag.padEnd(12))} ${fmt.dim(desc)}`);
    }
  } else if (entry.skillCount !== undefined) {
    lines.push(`  ${fmt.dim("skillCount:")}  ${fmt.bold(String(entry.skillCount))}`);
  }

  console.log(lines.join("\n"));
}

function showSkill(entry: RegistryEntry, pkgName: string, skillName: string): void {
  const skill = (entry.skills ?? []).find(
    (s) => s.name === skillName,
  );

  if (!skill) {
    console.error(fmt.error(`Skill ${fmt.pkg(skillName)} not found in package ${fmt.pkg(pkgName)}.`));
    process.exit(1);
  }

  const lines: string[] = [];
  lines.push(`${fmt.heading(skill.name)}`);
  lines.push(`  ${fmt.dim("Package:")}     ${fmt.pkg(pkgName)}`);
  lines.push(`  ${fmt.dim("Category:")}    ${fmt.dim(skill.category ?? "(none)")}`);
  if (skill.description) {
    lines.push(`  ${fmt.dim("Description:")} ${fmt.dim(skill.description)}`);
  }
  console.log(lines.join("\n"));
}

export async function info(pkgSpec: string): Promise<void> {
  const { listSources } = await import("../core/config.js");
  const { fetchRegistry } = await import("../core/registry.js");

  const sources = listSources();
  const index = await fetchRegistry(sources);

  const slashIdx = pkgSpec.indexOf("/");
  const pkgName = slashIdx >= 0 ? pkgSpec.slice(0, slashIdx) : pkgSpec;
  const skillName = slashIdx >= 0 ? pkgSpec.slice(slashIdx + 1) : undefined;

  const entry = index[pkgName];
  if (!entry) {
    console.error(fmt.error(`Package ${fmt.pkg(pkgName)} not found in registry.`));
    process.exit(1);
  }

  if (skillName) {
    showSkill(entry, pkgName, skillName);
  } else {
    showPackage(pkgName, entry);
  }
}
