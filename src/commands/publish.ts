import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { PackageManifest, RegistryEntry } from "../types/index.js";

interface ValidationError {
  field: string;
  message: string;
}

function validateManifest(manifest: unknown): { errors: ValidationError[]; manifest?: PackageManifest } {
  const errors: ValidationError[] = [];
  const m = manifest as Record<string, unknown>;

  if (!m || typeof m !== "object") {
    errors.push({ field: "(root)", message: "manifest must be a JSON object" });
    return { errors };
  }

  if (typeof m.name !== "string" || !m.name) {
    errors.push({ field: "name", message: "required string" });
  }

  if (typeof m.version !== "string" || !m.version) {
    errors.push({ field: "version", message: "required string" });
  }

  if (typeof m.description !== "string" || !m.description) {
    errors.push({ field: "description", message: "required string" });
  }

  if (!Array.isArray(m.platforms) || m.platforms.length === 0) {
    errors.push({ field: "platforms", message: "required non-empty array" });
  }

  if (typeof m.repository !== "string" || !m.repository) {
    errors.push({ field: "repository", message: "required string" });
  }

  if (!Array.isArray(m.skills)) {
    errors.push({ field: "skills", message: "required array" });
  } else {
    for (let i = 0; i < m.skills.length; i++) {
      const s = m.skills[i] as Record<string, unknown>;
      const prefix = `skills[${i}]`;
      if (!s || typeof s !== "object") {
        errors.push({ field: prefix, message: "must be an object" });
        continue;
      }
      if (typeof s.name !== "string" || !s.name) {
        errors.push({ field: `${prefix}.name`, message: "required string" });
      }
      if (typeof s.entry !== "string" || !s.entry) {
        errors.push({ field: `${prefix}.entry`, message: "required string" });
      }
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { errors: [], manifest: manifest as PackageManifest };
}

export async function publish(): Promise<void> {
  const cwd = process.cwd();
  const manifestPath = join(cwd, "ags.json");

  if (!existsSync(manifestPath)) {
    console.error("No ags.json found in the current directory.");
    console.error("Run 'ags init' to create one.");
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse ags.json:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const { errors, manifest } = validateManifest(raw);

  if (errors.length > 0) {
    console.error("Validation errors in ags.json:");
    for (const err of errors) {
      console.error(`  ${err.field}: ${err.message}`);
    }
    process.exit(1);
  }

  const m = manifest!;

  // Verify skill entry files exist
  const missing: string[] = [];
  for (const skill of m.skills) {
    const filePath = join(cwd, skill.entry);
    if (!existsSync(filePath)) {
      missing.push(skill.entry);
    }
  }

  if (missing.length > 0) {
    console.error("Missing skill entry files:");
    for (const f of missing) {
      console.error(`  ${f}`);
    }
    process.exit(1);
  }

  console.log(`✓ ${m.name} v${m.version} — ${m.description}`);
  console.log(`  repository: ${m.repository}`);
  console.log(`  platforms: ${m.platforms.join(", ")}`);
  console.log(`  skills: ${m.skills.map((s) => s.name).join(", ")}`);
  console.log();
  console.log("Registry entry snippet (add this to a registry.json source):");
  console.log();

  const entry: RegistryEntry = {
    description: m.description,
    latest: m.version,
    repository: m.repository,
    platforms: m.platforms,
    skills: m.skills.map((s) => ({
      name: s.name,
      description: s.description,
    })),
  };

  const snippet = JSON.stringify({ [m.name]: entry }, null, 2);
  console.log(snippet);
  console.log();
  console.log("To make this package available, add the entry above to your");
  console.log("registry index and publish it at a URL, then run:");
  console.log(`  ags source add my-source <index-url>`);
}
