#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("ags")
  .description("Agent Skills Manager — install, update, and manage AI agent skills")
  .version("0.1.0");

program
  .command("install <pkg>")
  .alias("i")
  .description("Install a package (all skills) or a specific skill (pkg/skill)")
  .option("--agent <name>", "Target agent (opencode, pi, claude)")
  .option("-g, --global", "Install globally for the target agent")
  .action(async (pkg, options) => {
    const { install } = await import("./commands/install.js");
    await install(pkg, options);
  });

program
  .command("uninstall <pkg>")
  .alias("un")
  .description("Remove a package or specific skill (pkg/skill)")
  .option("--agent <name>", "Target agent (opencode, pi, claude)")
  .option("-g, --global", "Remove from global install")
  .action(async (pkg, options) => {
    const { uninstall } = await import("./commands/uninstall.js");
    await uninstall(pkg, options);
  });

program
  .command("list")
  .alias("ls")
  .description("List installed packages and their skills")
  .option("--agent <name>", "Filter by agent (opencode, pi, claude)")
  .option("-g, --global", "List global installs")
  .action(async (options) => {
    const { list } = await import("./commands/list.js");
    await list(options);
  });

program
  .command("search <query>")
  .description("Search the registry for packages")
  .action(async (query) => {
    const { search } = await import("./commands/search.js");
    await search(query);
  });

program
  .command("info <pkg>")
  .description("Show metadata for a package or specific skill")
  .action(async (pkg) => {
    const { info } = await import("./commands/info.js");
    await info(pkg);
  });

program
  .command("init [name]")
  .description("Scaffold a new package")
  .option("--description <desc>", "Package description")
  .option("--version <semver>", "Package version")
  .option("--repository <url>", "Repository URL")
  .option("--platforms <list>", "Platforms (comma-separated)")
  .action(async (name, options) => {
    const { init } = await import("./commands/init.js");
    await init(name, options);
  });

program
  .command("update [pkg]")
  .description("Update one or all packages to the latest version")
  .option("--agent <name>", "Target agent")
  .option("-g, --global", "Update global installs")
  .action(async (pkg, options) => {
    const { update } = await import("./commands/update.js");
    await update(pkg, options);
  });

program
  .command("publish")
  .description("Publish a package to the registry")
  .action(async () => {
    const { publish } = await import("./commands/publish.js");
    await publish();
  });

const source = program
  .command("source")
  .description("Manage registry sources");

source
  .command("list")
  .description("List configured sources")
  .action(async () => {
    const { listSources } = await import("./commands/source.js");
    await listSources();
  });

source
  .command("add <name> <indexUrl>")
  .description("Add or update a registry source")
  .option("--api-base-url <url>", "API base URL for self-hosted instances")
  .action(async (name, indexUrl, options) => {
    const { addSource } = await import("./commands/source.js");
    await addSource(name, indexUrl, options);
  });

source
  .command("remove <name>")
  .description("Remove a registry source")
  .action(async (name) => {
    const { removeSource } = await import("./commands/source.js");
    await removeSource(name);
  });

program.parse(process.argv);
