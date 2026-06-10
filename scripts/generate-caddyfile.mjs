import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);

const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  return args[index + 1] ?? fallback;
};

const host = readArg("--host", "berry.local");
const dist = readArg("--dist", "/var/www/berry-os/dist");
const statusFile = readArg("--status-file", "/var/lib/berry-os/status/status.json");
const configPath = resolve(
  process.cwd(),
  readArg("--config", "public/config.json"),
);
const rawConfig = readFileSync(configPath, "utf8");
const parsed = JSON.parse(rawConfig);

const services = Array.isArray(parsed.services) ? parsed.services : [];

const routeBlocks = services
  .filter(
    (service) =>
      typeof service?.url === "string" &&
      service.url.startsWith("/apps/") &&
      typeof service?.proxyTarget === "string" &&
      service.proxyTarget.length > 0,
  )
  .map((service) => {
    const routePrefix = new URL(
      service.url,
      "http://berry.local",
    ).pathname.replace(/\/$/, "");

    return `  handle_path ${routePrefix}/* {\n    reverse_proxy ${service.proxyTarget}\n  }`;
  });

const statusRoot = statusFile.replace(/\/[^/]+$/, "") || ".";
const statusFilename = statusFile.split("/").pop() || "status.json";

const caddyfile = `${host} {
  root * ${dist}
  encode zstd gzip

  handle /api/status {
    root * ${statusRoot}
    rewrite * /${statusFilename}
    header Content-Type application/json
    file_server
  }

${routeBlocks.join("\n\n")}

  handle {
    try_files {path} /index.html
    file_server
  }
}
`;

process.stdout.write(caddyfile);
