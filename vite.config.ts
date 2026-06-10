import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProxyOptions } from "vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

type ServiceProxyInput = {
  url?: string;
  proxyTarget?: string;
  proxyPaths?: string[];
};

const rootDir = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(rootDir, "public/config.json");

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parseConfigJson = <T>(rawConfig: string): T => {
  let sanitized = "";
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < rawConfig.length; index += 1) {
    const char = rawConfig[index];
    const next = rawConfig[index + 1];

    if (lineComment) {
      if (char === "\n" || char === "\r") {
        lineComment = false;
        sanitized += char;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      sanitized += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      sanitized += char;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    sanitized += char;
  }

  return JSON.parse(sanitized.replace(/,\s*([}\]])/g, "$1")) as T;
};

const loadProxyConfig = (): Record<string, ProxyOptions> => {
  const rawConfig = readFileSync(configPath, "utf8");
  const parsed = parseConfigJson<{
    statusEndpoint?: string;
    services?: ServiceProxyInput[];
  }>(rawConfig);
  const proxies: Record<string, ProxyOptions> = {};
  const statusEndpoint = parsed.statusEndpoint;

  for (const service of parsed.services ?? []) {
    if (!service.proxyTarget) {
      continue;
    }

    if (service.url?.startsWith("/apps/")) {
      const routePrefix = new URL(
        service.url,
        "http://berry.local",
      ).pathname.replace(/\/$/, "");

      proxies[routePrefix] = {
        target: service.proxyTarget,
        changeOrigin: true,
        ws: true,
        rewrite: (path) =>
          path.replace(new RegExp(`^${escapeRegExp(routePrefix)}`), ""),
      };
    }

    for (const rawPath of service.proxyPaths ?? []) {
      if (typeof rawPath !== "string" || !rawPath.startsWith("/")) {
        continue;
      }

      const proxyPath = rawPath.replace(/\/$/, "") || "/";
      const existing = proxies[proxyPath];
      if (existing) {
        continue;
      }

      proxies[proxyPath] = {
        target: service.proxyTarget,
        changeOrigin: true,
        ws: true,
        bypass: (req) => {
          if (statusEndpoint && req.url === statusEndpoint) {
            return req.url;
          }
          return undefined;
        },
      };
    }
  }

  return proxies;
};

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: loadProxyConfig(),
  },
});
