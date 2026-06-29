import type { Source } from "../types/index.js";

export async function listSources(): Promise<void> {
  const { listSources: getSources } = await import("../core/config.js");
  const sources = getSources();
  if (sources.length === 0) {
    console.log("No sources configured.");
    return;
  }
  for (const src of sources) {
    console.log(`${src.name}: ${src.indexUrl}`);
    if (src.apiBaseUrl) {
      console.log(`  apiBaseUrl: ${src.apiBaseUrl}`);
    }
  }
}

export async function addSource(name: string, indexUrl: string, options?: { apiBaseUrl?: string }): Promise<void> {
  const { addSource: add } = await import("../core/config.js");
  const source: Source = { name, indexUrl };
  if (options?.apiBaseUrl) source.apiBaseUrl = options.apiBaseUrl;
  add(source);
  console.log(`Source '${name}' added.`);
}

export async function removeSource(name: string): Promise<void> {
  const { removeSource: remove } = await import("../core/config.js");
  remove(name);
  console.log(`Source '${name}' removed.`);
}
