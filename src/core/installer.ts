import { mkdirSync } from "fs";
import { createHash } from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import * as tar from "tar";
import { parseRepository, tarballUrl } from "./repository.js";
import type { RegistryEntry } from "../types/index.js";

export async function downloadPackage(
  repoUrl: string,
  version: string,
  dest: string,
  apiBaseUrl?: string,
): Promise<{ integrity: string; resolved: string }> {
  const info = parseRepository(repoUrl);
  const url = tarballUrl(info, version, apiBaseUrl);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");
  const integrity = `sha256-${hash}`;

  mkdirSync(dest, { recursive: true });

  const source = new Readable();
  source.push(buffer);
  source.push(null);

  await pipeline(
    source,
    tar.extract({ cwd: dest, strip: 1 }),
  );

  return { integrity, resolved: url };
}

export async function installPackage(
  pkgName: string,
  entry: RegistryEntry,
  dest: string,
): Promise<{ integrity: string; resolved: string }> {
  const { integrity, resolved } = await downloadPackage(
    entry.repository,
    entry.latest,
    dest,
  );
  return { integrity, resolved };
}
