import * as store from "./storage.js";

const WORK_START = 9; // 09:00
const WORK_END = 18; // 18:00
const STEP_MIN = 30; // шаг сетки слотов
const MS_PER_MIN = 60000;
const MS_DAY = 86400000;
const WINDOW_DAYS = 14;

class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export { ApiError };

export const validationError = (message) => new ApiError(400, "VALIDATION_ERROR", message);
export const notFoundError = (message) => new ApiError(404, "NOT_FOUND", message);
export const conflictError = (message) => new ApiError(409, "SLOT_OCCUPIED", message);

const getTodayUtc = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const isoUtc = (dateStr, hour, minute = 0) =>
  new Date(
    Date.UTC(
      Number(dateStr.slice(0, 4)),
      Number(dateStr.slice(5, 7)) - 1,
      Number(dateStr.slice(8, 10)),
      hour,
      minute,
    ),
  ).toISOString();

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const overlaps = ([aStart, aEnd], [bStart, bEnd]) => aStart < bEnd && bStart < aEnd;

export function availabilityWindow(eventTypeId, fromValue, toValue) {
  const eventType = store.findEventType(eventTypeId);
  if (!eventType) throw notFoundError("Тип события не найден");

  const from = parseDate(fromValue);
  const to = parseDate(toValue);
  if (!from || !to) throw validationError("Параметры from и to должны быть датами вида ГГГГ-ММ-ДД");
  if (from > to) throw validationError("from должно быть не позже to");

  const today = getTodayUtc();
  const maxDate = new Date(today.getTime() + (WINDOW_DAYS - 1) * MS_DAY);
  if (from < today || to > maxDate) {
    throw validationError("Окно доступности должно быть в пределах 14 дней от текущей даты");
  }

  const durationMs = eventType.duration * MS_PER_MIN;
  const bookings = store.listBookings();
  const days = [];
  const now = Date.now();
  let cur = new Date(from.getTime());

  while (cur <= to) {
    const dateStr = cur.toISOString().slice(0, 10);
    const busy = bookings
      .filter((b) => b.startAt.slice(0, 10) === dateStr)
      .map((b) => [Date.parse(b.startAt), Date.parse(b.endAt)]);

    const slots = [];
    for (let h = WORK_START; h < WORK_END; h++) {
      for (let m = 0; m < 60; m += STEP_MIN) {
        const startAt = isoUtc(dateStr, h, m);
        const s = Date.parse(startAt);
        if (s <= now) continue;
        const e = s + durationMs;
        const occupied = busy.some((interval) => overlaps([s, e], interval));
        if (!occupied) slots.push({ startAt, endAt: new Date(e).toISOString() });
      }
    }
    days.push({ date: dateStr, slots });
    cur = new Date(cur.getTime() + MS_DAY);
  }

  return { eventTypeId, from: fromValue, to: toValue, days };
}

export function createBooking({ eventTypeId, guestName, startAt } = {}) {
  if (typeof eventTypeId !== "string" || !eventTypeId.trim())
    throw validationError("eventTypeId обязателен");

  const eventType = store.findEventType(eventTypeId);
  if (!eventType) throw notFoundError("Тип события не найден");

  if (typeof guestName !== "string" || !guestName.trim())
    throw validationError("guestName обязателен");

  const start = Date.parse(startAt);
  if (!Number.isFinite(start)) throw validationError("Некорректный startAt");

  const now = Date.now();
  if (start <= now) throw validationError("Нельзя забронировать слот в прошлом");

  const startDate = new Date(start);
  const today = getTodayUtc();
  const maxDate = new Date(today.getTime() + (WINDOW_DAYS - 1) * MS_DAY);
  const bookingDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  if (bookingDay > maxDate) {
    throw validationError("Слот выходит за пределы 14-дневного окна бронирования");
  }

  const h = startDate.getUTCHours();
  const m = startDate.getUTCMinutes();
  const end = start + eventType.duration * MS_PER_MIN;
  const dayEnd = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), WORK_END);

  if (h < WORK_START || h >= WORK_END) throw validationError("Слот вне рабочего времени");
  if (m % STEP_MIN !== 0) throw validationError("Слот должен быть кратен 30 минутам");
  if (end > dayEnd) throw validationError("Слот выходит за пределы рабочего дня");

  const taken = store
    .listBookings()
    .some((b) => overlaps([start, end], [Date.parse(b.startAt), Date.parse(b.endAt)]));

  if (taken) throw conflictError("Слот уже занят");

  return store.createBooking({ eventTypeId, guestName: guestName.trim(), startAt, endAt: new Date(end).toISOString() });
}

export function pendingBookings() {
  const now = Date.now();
  return store
    .listBookings()
    .filter((b) => Date.parse(b.startAt) >= now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

export const eventTypes = () => store.listEventTypes();

export function createEventType({ name, description, duration } = {}) {
  if (typeof name !== "string" || !name.trim()) throw validationError("name обязателен");
  if (!Number.isInteger(duration) || duration < 1)
    throw validationError("duration должно быть целым числом >= 1");
  return store.createEventType({
    name: name.trim(),
    description: typeof description === "string" ? description : "",
    duration,
  });
}