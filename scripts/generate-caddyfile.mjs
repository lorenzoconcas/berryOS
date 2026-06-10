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

const parseConfigJson = (rawConfig) => {
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

  return JSON.parse(sanitized.replace(/,\s*([}\]])/g, "$1"));
};

const rawConfig = readFileSync(configPath, "utf8");
const parsed = parseConfigJson(rawConfig);

const services = Array.isArray(parsed.services) ? parsed.services : [];

const createProxyBlock = (
    path,
    target,
    stripPrefix,
    tlsInsecure = false,
) => {
  const normalizedPath = path.replace(/\/$/, "") || "/";

  const isExactFile =
      normalizedPath !== "/" &&
      /\.[A-Za-z0-9]+$/.test(normalizedPath.split("/").pop() || "");

  const reverseProxy = tlsInsecure
      ? `reverse_proxy ${target} {
      transport http {
        tls_insecure_skip_verify
      }
    }`
      : `reverse_proxy ${target}`;

  if (stripPrefix) {
    return `  handle_path ${normalizedPath}/* {
    ${reverseProxy}
  }`;
  }

  if (normalizedPath === "/") {
    return `  handle /* {
    ${reverseProxy}
  }`;
  }

  if (isExactFile) {
    return `  handle ${normalizedPath} {
    ${reverseProxy}
  }`;
  }

  return `  handle ${normalizedPath}* {
    ${reverseProxy}
  }`;
};

const routeBlocks = [];

for (const service of services) {
  if (
      typeof service?.proxyTarget !== "string" ||
      service.proxyTarget.length === 0
  ) {
    continue;
  }

  const tlsInsecure = service.proxyTlsInsecure === true;

  if (typeof service?.url === "string" && service.url.startsWith("/apps/")) {
    const routePrefix = new URL(
        service.url,
        "http://berry.local",
    ).pathname.replace(/\/$/, "");

    routeBlocks.push(
        createProxyBlock(
            routePrefix,
            service.proxyTarget,
            true,
            tlsInsecure,
        ),
    );
  }

  if (!Array.isArray(service?.proxyPaths)) {
    continue;
  }

  for (const rawPath of service.proxyPaths) {
    if (typeof rawPath !== "string" || !rawPath.startsWith("/")) {
      continue;
    }

    routeBlocks.push(
        createProxyBlock(
            rawPath,
            service.proxyTarget,
            false,
            tlsInsecure,
        ),
    );
  }
}

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