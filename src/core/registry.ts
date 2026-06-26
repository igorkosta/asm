import type { Source, RegistryIndex, RegistryEntry, SkillEntry } from "../types/index.js";
import defaultRegistry from "../registry/default-registry.json";

export async function fetchRegistry(sources: Source[]): Promise<RegistryIndex> {
  if (sources.length === 0) {
    return defaultRegistry as RegistryIndex;
  }

  const merged: RegistryIndex = {};

  for (const source of sources) {
    try {
      const res = await fetch(source.indexUrl);

      if (!res.ok) {
        console.error(`Warning: source "${source.name}" returned ${res.status} — skipping`);
        continue;
      }

      const json = (await res.json()) as RegistryIndex;

      for (const [name, entry] of Object.entries(json)) {
        merged[name] = entry;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Warning: failed to fetch source "${source.name}": ${msg} — skipping`);
    }
  }

  return merged;
}

function matchQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

export function searchRegistry(
  index: RegistryIndex,
  query: string,
): Array<{ name: string; entry: RegistryEntry }> {
  const q = query.toLowerCase();
  const results: Array<{ name: string; entry: RegistryEntry }> = [];

  for (const [name, entry] of Object.entries(index)) {
    if (
      matchQuery(name, q) ||
      matchQuery(entry.description, q)
    ) {
      results.push({ name, entry });
      continue;
    }

    const matched = (entry.skills ?? []).some((skill: string | SkillEntry) => {
      const skillName = typeof skill === "string" ? skill : skill.name;
      const category = typeof skill === "string" ? undefined : skill.category;
      return (
        matchQuery(skillName, q) ||
        (category !== undefined && matchQuery(category, q))
      );
    });

    if (matched) {
      results.push({ name, entry });
    }
  }

  return results;
}
