import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { start } from "../src/server.js";

describe("server.js HTTP routing & handlers", () => {
  let server;
  const PORT = 4019;
  const baseUrl = `http://localhost:${PORT}`;

  before((_, done) => {
    server = start(PORT, () => done());
  });

  after((_, done) => {
    server.close(done);
  });

  test("GET /ping возвращает 200 { status: 'ok' }", async () => {
    const res = await fetch(`${baseUrl}/ping`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { status: "ok" });
  });

  test("OPTIONS /ping возвращает 204 с CORS заголовками", async () => {
    const res = await fetch(`${baseUrl}/ping`, { method: "OPTIONS" });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.ok(res.headers.get("access-control-allow-methods")?.includes("GET"));
  });

  test("GET /event-types возвращает список доступных типов", async () => {
    const res = await fetch(`${baseUrl}/event-types`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.items));
    assert.ok(body.items.length >= 2);
  });

  test("GET /admin/event-types возвращает список для администратора", async () => {
    const res = await fetch(`${baseUrl}/admin/event-types`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.items));
  });

  test("POST /bookings с невалидным JSON возвращает 400 VALIDATION_ERROR", async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "VALIDATION_ERROR");
  });

  test("POST /bookings с телом, не являющимся JSON-объектом, возвращает 400", async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("just a string"),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "VALIDATION_ERROR");
  });

  test("GET неизвестный маршрут возвращает 404 NOT_FOUND", async () => {
    const res = await fetch(`${baseUrl}/non-existing-route-12345`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.code, "NOT_FOUND");
  });
});

describe("server.js static SPA fallback & API route isolation", () => {
  let prodServer;
  let tempStaticDir;
  const PROD_PORT = 4020;
  const prodBaseUrl = `http://localhost:${PROD_PORT}`;

  before((_, done) => {
    tempStaticDir = mkdtempSync(join(tmpdir(), "static-test-"));
    writeFileSync(join(tempStaticDir, "index.html"), "<!DOCTYPE html><html><body>SPA</body></html>");
    prodServer = start(PROD_PORT, () => done(), { staticDir: tempStaticDir });
  });

  after((_, done) => {
    prodServer.close(() => {
      try {
        rmSync(tempStaticDir, { recursive: true, force: true });
      } catch {
        // cleanup
      }
      done();
    });
  });

  test("GET неизвестный путь внутри /event-types возвращает 404 JSON, а не index.html (200)", async () => {
    const res = await fetch(`${prodBaseUrl}/event-types/unknown-nested-path`);
    assert.equal(res.status, 404);
    assert.ok(res.headers.get("content-type")?.includes("application/json"));
    const body = await res.json();
    assert.equal(body.code, "NOT_FOUND");
  });

  test("GET неизвестный путь внутри /bookings возвращает 404 JSON", async () => {
    const res = await fetch(`${prodBaseUrl}/bookings/unknown-id`);
    assert.equal(res.status, 404);
    assert.ok(res.headers.get("content-type")?.includes("application/json"));
    const body = await res.json();
    assert.equal(body.code, "NOT_FOUND");
  });

  test("GET SPA-маршрут возвращает 200 text/html (index.html)", async () => {
    const res = await fetch(`${prodBaseUrl}/book/evt-30`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("text/html"));
  });
});
