import type { RepositoryInfo, Platform } from "../types/index.js";

export function parseRepository(repoUrl: string): RepositoryInfo {
  let url = repoUrl.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const parsed = new URL(url);
  let host = parsed.hostname;
  let path = parsed.pathname.replace(/\/+$/, "");

  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  if (path.endsWith(".git")) {
    path = path.slice(0, -4);
  }

  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid repository URL: "${repoUrl}" — expected at least owner/repo`);
  }

  const repo = parts.pop()!;
  const owner = parts.join("/");

  return { host, owner, repo, platform: "github" };
}

export function detectPlatform(host: string, apiBaseUrl?: string): Platform {
  const h = host.toLowerCase().replace(/^www\./, "");

  if (h === "github.com") return "github";
  if (h === "gitlab.com") return "gitlab";

  if (apiBaseUrl) {
    const lower = apiBaseUrl.toLowerCase();
    if (lower.includes("/api/v3")) return "github";
    if (lower.includes("/api/v4")) return "gitlab";
  }

  return "github";
}

export function tarballUrl(
  info: RepositoryInfo,
  version: string,
  apiBaseUrl?: string,
): string {
  const platform = detectPlatform(info.host, apiBaseUrl ?? info.apiBaseUrl);
  const base = `https://${info.host}/${info.owner}/${info.repo}`;

  if (platform === "gitlab") {
    return `${base}/-/archive/${version}/${version}.tar.gz`;
  }

  return `${base}/archive/${version}.tar.gz`;
}
