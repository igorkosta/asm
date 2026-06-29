import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { basename } from "path";
import type { PackageManifest, SkillManifest } from "../types/index.js";

function prompt(query: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const msg = defaultValue ? `${query} (${defaultValue}) ` : `${query} `;
    rl.question(msg, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

async function promptRequired(query: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const ask = () => {
      const msg = defaultValue ? `${query} (${defaultValue}) ` : `${query} `;
      rl.question(msg, (answer) => {
        const val = answer.trim() || defaultValue || "";
        if (val) {
          rl.close();
          resolve(val);
        } else {
          console.log("This field is required.");
          ask();
        }
      });
    };
    ask();
  });
}

export async function init(pkgName?: string, options?: { description?: string; version?: string; repository?: string; platforms?: string }): Promise<void> {
  const cwd = process.cwd();
  const manifestPath = join(cwd, "ags.json");

  if (existsSync(manifestPath)) {
    console.error("ags.json already exists in this directory.");
    process.exit(1);
  }

  const name = pkgName || await promptRequired("Package name", basename(cwd));
  const description = options?.description || await prompt("Description", "A collection of AI agent skills");
  const version = options?.version || await prompt("Version", "0.1.0");
  const platforms = options?.platforms
    ? options.platforms.split(",").map((s) => s.trim())
    : (await prompt("Platforms (comma-separated)", "github"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const repoDefault = `https://github.com/your-org/${name}`;
  const repository = options?.repository || await promptRequired("Repository URL", repoDefault);

  const skillsDir = join(cwd, "skills");
  mkdirSync(skillsDir, { recursive: true });

  const sampleSkill: SkillManifest = {
    name: "hello-world",
    description: "A sample skill to get started",
    entry: "skills/hello-world.md",
  };

  const sampleContent = `# hello-world

This is a sample skill. Replace this file with your actual skill implementation.

## Usage

Describe how agents should use this skill here.
`;

  writeFileSync(join(skillsDir, "hello-world.md"), sampleContent);

  const manifest: PackageManifest = {
    name,
    version,
    description,
    platforms,
    repository,
    skills: [sampleSkill],
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`Created ${manifestPath}`);
  console.log(`Created ${join("skills", "hello-world.md")}`);
  console.log();
  console.log("Next steps:");
  console.log("  1. Add your skill files to the skills/ directory");
  console.log("  2. Update ags.json with your skills list");
  console.log("  3. Run 'ags publish' to validate and output registry entry");
}
