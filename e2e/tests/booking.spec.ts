import { expect, test } from "@playwright/test";
import {
  bookSlotViaApi,
  freeSlotCount,
  openAdminBookings,
  openBookingOnToday,
  pickFirstFreeSlot,
  seededType,
} from "./helpers";

test("S1: happy path — сквозное бронирование", async ({ page, request }) => {
  const type30 = seededType("evt-30");

  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: /Записаться/ }).click();
  await expect(page).toHaveURL(/\/book$/);

  await page.getByText(type30.name, { exact: true }).click();
  await expect(page).toHaveURL(/\/book\/evt-30$/);

  await openBookingOnToday(page, "evt-30");
  await pickFirstFreeSlot(page);

  await page.getByLabel("Ваше имя").fill("Иван Петров");
  await page.getByRole("button", { name: "Подтвердить бронь" }).click();
  await expect(page.getByText(/Забронировано!/)).toBeVisible();

  const tomorrow = new Date(Date.now() + 86_400_000);
  const futureStart = new Date(
    Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 9, 0),
  ).toISOString();
  const seeded = await bookSlotViaApi(request, "evt-30", "Иван Петров", futureStart);
  expect(seeded).toBe(201);

  await openAdminBookings(page);
  await expect(page.getByText("Иван Петров", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(type30.name, { exact: true }).first()).toBeVisible();
});

test("S2: занятый слот исчезает из списка свободных", async ({ page }) => {
  await openBookingOnToday(page, "evt-30");
  const before = await freeSlotCount(page);

  await pickFirstFreeSlot(page);
  await page.getByLabel("Ваше имя").fill("Станислав");
  await page.getByRole("button", { name: "Подтвердить бронь" }).click();
  await expect(page.getByText(/Забронировано!/)).toBeVisible();

  await page.getByRole("button", { name: "Назад к слотам" }).click();
  await expect(page).toHaveURL(/\/book\/evt-30$/);

  await page.locator("[data-today]").click();
  await expect(page.getByRole("button", { name: /Свободно/ })).toHaveCount(before - 1);
});

test("S3: конфликт при одновременной брони (409)", async ({ page, request }) => {
  const type30 = seededType("evt-30");

  await openBookingOnToday(page, "evt-30");
  const startAt = await pickFirstFreeSlot(page);

  const status = await bookSlotViaApi(request, "evt-30", "Конкурент", startAt);
  expect(status).toBe(201);

  await page.getByLabel("Ваше имя").fill("Гость Гонки");
  await page.getByRole("button", { name: "Подтвердить бронь" }).click();
  await expect(page.getByText("Слот уже занят", { exact: true })).toBeVisible();
});

test("S4: межтиповой конфликт (409)", async ({ page, request }) => {
  await openBookingOnToday(page, "evt-15");
  const startAt = await pickFirstFreeSlot(page);

  const status = await bookSlotViaApi(request, "evt-30", "Занято в evt-30", startAt);
  expect(status).toBe(201);

  await page.getByLabel("Ваше имя").fill("Гость Другого Типа");
  await page.getByRole("button", { name: "Подтвердить бронь" }).click();
  await expect(page.getByText("Слот уже занят", { exact: true })).toBeVisible();
});

test("S5: валидация имени — кнопка недоступна без имени", async ({ page }) => {
  await openBookingOnToday(page, "evt-15");
  await pickFirstFreeSlot(page);

  await expect(page.getByRole("button", { name: "Подтвердить бронь" })).toBeDisabled();
});

test("S11: длительность разных типов событий в UI", async ({ page }) => {
  await openBookingOnToday(page, "evt-15");
  await expect(page.getByText("15 мин", { exact: true }).first()).toBeVisible();

  await openBookingOnToday(page, "evt-30");
  await expect(page.getByText("30 мин", { exact: true }).first()).toBeVisible();
});

test("S13: невалидный JSON в теле запроса возвращает 400 VALIDATION_ERROR", async ({ request }) => {
  const res = await request.post("http://localhost:4010/bookings", {
    data: Buffer.from("{ invalid json"),
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.code).toBe("VALIDATION_ERROR");
  expect(body.message).toContain("JSON");

  const ping = await request.get("http://localhost:4010/ping");
  expect(ping.status()).toBe(200);
});