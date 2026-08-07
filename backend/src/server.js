import { createServer } from "node:http";
import * as rules from "./rules.js";

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

async function route(req, res) {
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

  throw new rules.ApiError(404, "NOT_FOUND", "Неизвестный маршрут");
}

export function start(port, onListen) {
  const server = createServer((req, res) => {
    route(req, res).catch((err) => {
      if (err instanceof rules.ApiError) return send(res, err.statusCode, { code: err.code, message: err.message });
      send(res, 500, { code: "ERROR", message: String((err && err.message) || err) });
    });
  });
  server.listen(port, () => onListen?.(port));
  return server;
}