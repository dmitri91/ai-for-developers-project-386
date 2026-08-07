import type { APIRequestContext, Page } from "@playwright/test";

const SEEDED_TYPES = {
  "evt-15": { name: "Встреча 15 минут", duration: 15 },
  "evt-30": { name: "Встреча 30 минут", duration: 30 },
} as const;

export function seededType(key: keyof typeof SEEDED_TYPES): { name: string; duration: number } {
  return { ...SEEDED_TYPES[key] };
}

export const todayISO = (): string => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12))
    .toISOString()
    .slice(0, 10);
};

export async function freeSlotCount(page: Page): Promise<number> {
  return page.getByRole("button", { name: /Свободно/ }).count();
}

export async function openBookingOnToday(page: Page, eventTypeId: string): Promise<void> {
  await page.goto(`/book/${eventTypeId}`);
  await page.locator("[data-today]").click();
  await expectFreeSlot(page);
}

export async function expectFreeSlot(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Свободно/ }).first().waitFor();
}

export async function pickFirstFreeSlot(page: Page): Promise<string> {
  await page.getByRole("button", { name: /Свободно/ }).first().click();
  return new URL(page.url()).searchParams.get("ts") ?? "";
}

export async function bookSlotViaApi(
  request: APIRequestContext,
  eventTypeId: string,
  guestName: string,
  startAt: string,
): Promise<number> {
  const res = await request.post("http://localhost:4010/bookings", {
    data: { eventTypeId, guestName, startAt },
  });
  return res.status();
}

export async function openAdminBookings(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name: "Админка" }).click();
  await page.getByRole("link", { name: "Предстоящие встречи" }).click();
}