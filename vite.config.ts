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
};

const rootDir = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(rootDir, "public/config.json");

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const loadProxyConfig = (): Record<string, ProxyOptions> => {
  const rawConfig = readFileSync(configPath, "utf8");
  const parsed = JSON.parse(rawConfig) as { services?: ServiceProxyInput[] };
  const proxies: Record<string, ProxyOptions> = {};

  for (const service of parsed.services ?? []) {
    if (!service.url?.startsWith("/apps/") || !service.proxyTarget) {
      continue;
    }

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
