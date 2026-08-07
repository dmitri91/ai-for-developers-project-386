import { expect, test } from "@playwright/test";

const NEW_TYPE = { name: "Консультация 60", description: "Подробная консультация", duration: 60 };

test("S6: админ создаёт тип события — он виден админу и гостю", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Админка" }).click();

  await page.getByLabel("Название").fill(NEW_TYPE.name);
  await page.getByLabel("Описание").fill(NEW_TYPE.description);
  await page.getByLabel("Длительность (минуты)").fill(String(NEW_TYPE.duration));
  await page.getByRole("button", { name: "Создать", exact: true }).click();

  await expect(page.getByText(NEW_TYPE.name, { exact: true }).first()).toBeVisible();

  await page.goto("/book");
  await expect(page.getByText(NEW_TYPE.name, { exact: true }).first()).toBeVisible();
});