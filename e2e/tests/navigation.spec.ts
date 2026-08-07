import { expect, test } from "@playwright/test";

test("S9: несуществующий тип события в URL", async ({ page }) => {
  await page.goto("/book/ne-sche-voyushchiy-id");
  await expect(page.getByText(/Тип события не найден/)).toBeVisible();
});

test("S12: навигация между страницами", async ({ page }) => {
  await page.goto("/book");
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/book/evt-30");
  await page.getByRole("button", { name: "Назад к типам" }).click();
  await expect(page).toHaveURL("/book");

  await page.goto("/");
  await page.getByRole("link", { name: "Админка" }).click();
  await expect(page).toHaveURL("/admin");

  await page.getByRole("link", { name: "Предстоящие встречи" }).click();
  await expect(page).toHaveURL("/admin/bookings");

  await page.getByRole("link", { name: "Типы событий" }).click();
  await expect(page).toHaveURL("/admin");
});