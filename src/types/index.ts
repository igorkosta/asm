export interface Source {
  name: string;
  indexUrl: string;
  apiBaseUrl?: string;
}

export interface AsmConfig {
  sources: Source[];
}

export interface SkillEntry {
  name: string;
  category?: string;
}

export interface RegistryEntry {
  description: string;
  latest: string;
  repository: string;
  platforms: string[];
  skills?: SkillEntry[];
  skillCount?: number;
}

export type RegistryIndex = Record<string, RegistryEntry>;

export interface SkillManifest {
  name: string;
  description: string;
  entry: string;
}

export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  platforms: string[];
  repository: string;
  skills: SkillManifest[];
}

export interface LockfileEntry {
  version: string;
  resolved: string;
  integrity: string;
  agent: string;
  skills: string[];
}

export interface Lockfile {
  packages: Record<string, LockfileEntry>;
}

export type Platform = "github" | "gitlab";

export interface RepositoryInfo {
  platform: Platform;
  host: string;
  owner: string;
  repo: string;
  apiBaseUrl?: string;
}
