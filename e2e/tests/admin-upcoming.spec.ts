import { expect, test } from "@playwright/test";
import { bookSlotViaApi, openAdminBookings, seededType } from "./helpers";

test.describe("Admin upcoming bookings page", () => {
  test("отображение предстоящих встреч с корректной информацией", async ({ page, request }) => {
    const type15 = seededType("evt-15");
    const guestName = "Константин Тестовый";

    const tomorrow = new Date(Date.now() + 86_400_000);
    const startAt = new Date(
      Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 11, 0),
    ).toISOString();

    const status = await bookSlotViaApi(request, "evt-15", guestName, startAt);
    expect(status).toBe(201);

    await openAdminBookings(page);

    await expect(page.getByRole("heading", { name: "Встречи" })).toBeVisible();
    await expect(page.getByText(guestName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(type15.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("15 мин", { exact: true }).first()).toBeVisible();
  });
});
