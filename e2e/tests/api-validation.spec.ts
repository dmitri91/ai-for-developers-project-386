import { expect, test } from "@playwright/test";

test.describe("API validation and error handling", () => {
  test("GET /event-types/:id/availability без обязательных query параметров возвращает 400", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:4010/event-types/evt-30/availability");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET /event-types/:id/availability с from > to возвращает 400", async ({ request }) => {
    const res = await request.get(
      "http://localhost:4010/event-types/evt-30/availability?from=2026-05-10&to=2026-05-01",
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET /event-types/:id/availability с диапазоном дальше 14 дней возвращает 400", async ({
    request,
  }) => {
    const today = new Date();
    const day20 = new Date(today.getTime() + 20 * 86_400_000).toISOString().slice(0, 10);
    const res = await request.get(
      `http://localhost:4010/event-types/evt-30/availability?from=${today.toISOString().slice(0, 10)}&to=${day20}`,
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET /event-types/:id/availability для несуществующего типа возвращает 404", async ({
    request,
  }) => {
    const res = await request.get(
      "http://localhost:4010/event-types/non-existing-type/availability?from=2026-05-01&to=2026-05-05",
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  test("POST /bookings с датой в прошлом возвращает 400", async ({ request }) => {
    const res = await request.post("http://localhost:4010/bookings", {
      data: {
        eventTypeId: "evt-30",
        guestName: "Гость из прошлого",
        startAt: "2020-01-01T10:00:00.000Z",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("POST /bookings с датой дальше 14 дней возвращает 400", async ({ request }) => {
    const farFuture = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
    const res = await request.post("http://localhost:4010/bookings", {
      data: {
        eventTypeId: "evt-30",
        guestName: "Гость из будущего",
        startAt: `${farFuture}T10:00:00.000Z`,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET неизвестный путь внутри /event-types возвращает 404 JSON, а не HTML", async ({ request }) => {
    const res = await request.get("http://localhost:4010/event-types/unknown-id/nested-action");
    expect(res.status()).toBe(404);
    expect(res.headers()["content-type"]).toContain("application/json");
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  test("POST /bookings с временем не кратным 30 минутам возвращает 400", async ({ request }) => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const invalidStart = new Date(
      Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 10, 15),
    ).toISOString();

    const res = await request.post("http://localhost:4010/bookings", {
      data: {
        eventTypeId: "evt-30",
        guestName: "Гость",
        startAt: invalidStart,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("POST /admin/event-types с невалидными данными возвращает 400", async ({ request }) => {
    const res1 = await request.post("http://localhost:4010/admin/event-types", {
      data: { name: "", duration: 30 },
    });
    expect(res1.status()).toBe(400);
    const body1 = await res1.json();
    expect(body1.code).toBe("VALIDATION_ERROR");

    const res2 = await request.post("http://localhost:4010/admin/event-types", {
      data: { name: "Встреча", duration: 0 },
    });
    expect(res2.status()).toBe(400);
    const body2 = await res2.json();
    expect(body2.code).toBe("VALIDATION_ERROR");
  });
});
