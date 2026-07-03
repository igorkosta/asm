import { fmt } from "../utils/format.js";
import type { Source } from "../types/index.js";

export async function listSources(): Promise<void> {
  const { listSources: getSources } = await import("../core/config.js");
  const sources = getSources();
  if (sources.length === 0) {
    console.log(fmt.dim("No sources configured."));
    return;
  }
  for (const src of sources) {
    console.log(`${fmt.bold(src.name)}: ${fmt.dim(src.indexUrl)}`);
    if (src.apiBaseUrl) {
      console.log(`  ${fmt.dim("apiBaseUrl:")} ${fmt.dim(src.apiBaseUrl)}`);
    }
  }
}

export async function addSource(name: string, indexUrl: string, options?: { apiBaseUrl?: string }): Promise<void> {
  const { addSource: add } = await import("../core/config.js");
  const source: Source = { name, indexUrl };
  if (options?.apiBaseUrl) source.apiBaseUrl = options.apiBaseUrl;
  add(source);
  console.log(fmt.success(`Source ${fmt.pkg(name)} added.`));
}

export async function removeSource(name: string): Promise<void> {
  const { removeSource: remove } = await import("../core/config.js");
  remove(name);
  console.log(fmt.success(`Source ${fmt.pkg(name)} removed.`));
}
