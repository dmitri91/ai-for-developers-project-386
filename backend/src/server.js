import { createReadStream } from "node:fs";
import { statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import * as rules from "./rules.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(body));
}

function sendStatic(res, filePath, fallback) {
  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    if (fallback) return sendStatic(res, fallback, null);
    return send(res, 404, { code: "NOT_FOUND", message: "Файл не найден" });
  }
  res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

async function route(req, res, options = {}) {
  const { pathname, searchParams } = new URL(req.url, "http://localhost");
  const method = req.method;

  if (method === "OPTIONS") return send(res, 204, "");

  if (pathname === "/event-types" && method === "GET") {
    return send(res, 200, { items: rules.eventTypes() });
  }

  const availMatch = pathname.match(/^\/event-types\/([^/]+)\/availability$/);
  if (availMatch && method === "GET") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) throw rules.validationError("Нужны параметры from и to");
    return send(res, 200, rules.availabilityWindow(availMatch[1], from, to));
  }

  if (pathname === "/bookings" && method === "POST") {
    const booking = rules.createBooking(await readBody(req));
    return send(res, 201, booking);
  }

  if (pathname === "/admin/event-types" && method === "GET") {
    return send(res, 200, { items: rules.eventTypes() });
  }

  if (pathname === "/admin/event-types" && method === "POST") {
    const eventType = rules.createEventType(await readBody(req));
    return send(res, 201, eventType);
  }

  if (pathname === "/admin/bookings/upcoming" && method === "GET") {
    return send(res, 200, { items: rules.pendingBookings() });
  }

  if (options.staticDir) {
    if (method !== "GET" && method !== "HEAD") throw new rules.ApiError(405, "METHOD_NOT_ALLOWED", "Метод не поддерживается");
    const indexFile = join(options.staticDir, "index.html");
    let decodedPath = pathname;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      // некорректный percent-encoding — отдаём как есть
    }
    const requested = pathname === "/" ? indexFile : join(options.staticDir, decodedPath);
    if (requested.startsWith(`${normalize(options.staticDir)}${pathname === "/" ? "/index.html" : "/"}`)) {
      return sendStatic(res, requested, pathname.startsWith("/assets/") ? null : indexFile);
    }
  }

  throw new rules.ApiError(404, "NOT_FOUND", "Неизвестный маршрут");
}

export function start(port, onListen, options = {}) {
  const server = createServer((req, res) => {
    route(req, res, options).catch((err) => {
      if (err instanceof rules.ApiError) return send(res, err.statusCode, { code: err.code, message: err.message });
      send(res, 500, { code: "ERROR", message: String((err && err.message) || err) });
    });
  });
  server.listen(port, () => onListen?.(port));
  return server;
}