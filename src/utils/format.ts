import pc from "picocolors";

export const fmt = {
  pkg: (s: string) => pc.cyan(s),
  error: (s: string) => pc.red(s),
  success: (s: string) => pc.green(s),
  warning: (s: string) => pc.yellow(s),
  dim: (s: string) => pc.dim(s),
  bold: (s: string) => pc.bold(s),
  heading: (s: string) => pc.bold(pc.cyan(s)),
  check: pc.green("✓"),
  arrow: pc.yellow("→"),
  version: (s: string) => pc.yellow(s),
};
