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

export async function search(query: string): Promise<void> {
  const { listSources } = await import("../core/config.js");
  const { fetchRegistry, searchRegistry } = await import("../core/registry.js");

  const sources = listSources();
  const index = await fetchRegistry(sources);
  const results = searchRegistry(index, query);

  if (results.length === 0) {
    console.log(`No packages found matching '${query}'.`);
    return;
  }

  const lines: string[] = [];
  for (const { name, entry } of results) {
    const counts = entry.skills
      ? `${entry.skills.length} skills`
      : `${entry.skillCount ?? "?"} skills`;
    lines.push(`${name}`);
    lines.push(`  ${entry.description}`);
    lines.push(`  latest: ${entry.latest}  |  ${counts}  |  platforms: ${entry.platforms.join(", ")}`);
    if (entry.skills && entry.skills.length > 0) {
      lines.push(`  categories: ${categoriesSummary(entry.skills)}`);
    }
    lines.push("");
  }
  console.log(lines.join("\n").trimEnd());
}
