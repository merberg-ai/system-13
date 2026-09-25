import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, resolveConfigPath } from "./config.js";

declare const __SYSTEM13_VERSION__: string;

const config = loadConfig();
const startedAt = Date.now();

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../public");

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  body: unknown
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendText(
  response: http.ServerResponse,
  statusCode: number,
  body: string
): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function safePublicPath(urlPath: string): string | null {
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const decoded = decodeURIComponent(requested);
  const candidate = path.resolve(publicDir, `.${decoded}`);

  if (candidate !== publicDir && !candidate.startsWith(publicDir + path.sep)) {
    return null;
  }

  return candidate;
}

function serveStatic(
  request: http.IncomingMessage,
  response: http.ServerResponse
): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  const candidate = safePublicPath(url.pathname);

  if (!candidate) {
    sendText(response, 400, "Bad request\n");
    return;
  }

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    sendText(response, 404, "Not found\n");
    return;
  }

  const extension = path.extname(candidate).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=300"
  });
  fs.createReadStream(candidate).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    sendText(response, 405, "Method not allowed\n");
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "system13",
      version: __SYSTEM13_VERSION__,
      maintenance: config.maintenance.enabled,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
    });
    return;
  }

  if (url.pathname === "/version") {
    sendJson(response, 200, {
      service: "system13",
      version: __SYSTEM13_VERSION__
    });
    return;
  }

  if (config.maintenance.enabled && url.pathname !== "/maintenance") {
    sendText(
      response,
      503,
      "SYSTEM 13\n\nREMOTE CONNECTIONS TEMPORARILY SUSPENDED\n"
    );
    return;
  }

  if (url.pathname === "/maintenance") {
    sendJson(response, 200, {
      enabled: config.maintenance.enabled
    });
    return;
  }

  serveStatic(request, response);
});

server.listen(config.server.port, config.server.bind, () => {
  console.log(
    `SYSTEM 13 ${__SYSTEM13_VERSION__} listening on http://${config.server.bind}:${config.server.port}`
  );
  console.log(`Config: ${resolveConfigPath()}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
