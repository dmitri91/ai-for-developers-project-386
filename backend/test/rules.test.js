import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as rules from "../src/rules.js";
import * as store from "../src/storage.js";

describe("rules.js business logic", () => {
  beforeEach(() => {
    // Очищаем историю бронирований перед каждым тестом
    store.listBookings().length = 0;
  });

  describe("availabilityWindow", () => {
    const todayStr = () => {
      const d = new Date();
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .slice(0, 10);
    };

    const addDays = (baseStr, days) => {
      const d = new Date(`${baseStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };

    test("выбрасывает NOT_FOUND для несуществующего типа события", () => {
      assert.throws(
        () => rules.availabilityWindow("non-existent-id", todayStr(), todayStr()),
        (err) => err instanceof rules.ApiError && err.statusCode === 404 && err.code === "NOT_FOUND",
      );
    });

    test("выбрасывает VALIDATION_ERROR при отсутствии from или to", () => {
      assert.throws(
        () => rules.availabilityWindow("evt-15", null, todayStr()),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.code === "VALIDATION_ERROR",
      );
      assert.throws(
        () => rules.availabilityWindow("evt-15", todayStr(), ""),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.code === "VALIDATION_ERROR",
      );
    });

    test("выбрасывает VALIDATION_ERROR при некорректном формате даты", () => {
      assert.throws(
        () => rules.availabilityWindow("evt-15", "invalid-date", todayStr()),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
    });

    test("выбрасывает VALIDATION_ERROR если from > to", () => {
      const today = todayStr();
      const tomorrow = addDays(today, 1);
      assert.throws(
        () => rules.availabilityWindow("evt-15", tomorrow, today),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("не позже"),
      );
    });

    test("выбрасывает VALIDATION_ERROR если диапазон выходит за 14 дней от текущей даты", () => {
      const today = todayStr();
      const day15 = addDays(today, 15);
      assert.throws(
        () => rules.availabilityWindow("evt-15", today, day15),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("14 дней"),
      );
    });

    test("вычисляет свободные слоты для будущего дня", () => {
      const tomorrow = addDays(todayStr(), 1);
      const res = rules.availabilityWindow("evt-30", tomorrow, tomorrow);

      assert.equal(res.eventTypeId, "evt-30");
      assert.equal(res.days.length, 1);
      assert.equal(res.days[0].date, tomorrow);
      // С 09:00 до 18:00 шаг 30 мин = 18 слотов в рабочий день
      assert.equal(res.days[0].slots.length, 18);
      assert.equal(res.days[0].slots[0].startAt, `${tomorrow}T09:00:00.000Z`);
      assert.equal(res.days[0].slots[0].endAt, `${tomorrow}T09:30:00.000Z`);
    });

    test("исключает занятые слоты из списка доступных", () => {
      const tomorrow = addDays(todayStr(), 1);
      const startAt = `${tomorrow}T10:00:00.000Z`;

      rules.createBooking({
        eventTypeId: "evt-30",
        guestName: "Тестовый Гость",
        startAt,
      });

      const res = rules.availabilityWindow("evt-30", tomorrow, tomorrow);
      const slotStarts = res.days[0].slots.map((s) => s.startAt);

      assert.ok(!slotStarts.includes(startAt));
      assert.equal(res.days[0].slots.length, 17);
    });
  });

  describe("createBooking", () => {
    const todayStr = () => {
      const d = new Date();
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .slice(0, 10);
    };

    const addDays = (baseStr, days) => {
      const d = new Date(`${baseStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };

    test("выбрасывает VALIDATION_ERROR при отсутствии обязательных полей", () => {
      assert.throws(
        () => rules.createBooking({}),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "  " }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
    });

    test("выбрасывает NOT_FOUND если eventTypeId не найден", () => {
      assert.throws(
        () => rules.createBooking({ eventTypeId: "unknown", guestName: "Гость", startAt: "2026-01-01T10:00:00.000Z" }),
        (err) => err instanceof rules.ApiError && err.statusCode === 404,
      );
    });

    test("выбрасывает VALIDATION_ERROR для невалидного startAt", () => {
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: "invalid" }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
    });

    test("выбрасывает VALIDATION_ERROR при бронировании в прошлом", () => {
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: "2020-01-01T10:00:00.000Z" }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("прошлом"),
      );
    });

    test("выбрасывает VALIDATION_ERROR при бронировании за пределами 14 дней", () => {
      const farFuture = addDays(todayStr(), 20);
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: `${farFuture}T10:00:00.000Z` }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("14-дневного"),
      );
    });

    test("выбрасывает VALIDATION_ERROR при бронировании вне рабочих часов", () => {
      const tomorrow = addDays(todayStr(), 1);
      // До 09:00
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: `${tomorrow}T08:00:00.000Z` }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("вне рабочего времени"),
      );
      // После 18:00
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: `${tomorrow}T18:00:00.000Z` }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("вне рабочего времени"),
      );
    });

    test("выбрасывает VALIDATION_ERROR если время не кратно 30 минутам", () => {
      const tomorrow = addDays(todayStr(), 1);
      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Гость", startAt: `${tomorrow}T10:15:00.000Z` }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("кратен 30"),
      );
    });

    test("выбрасывает VALIDATION_ERROR если слот выходит за пределы рабочего дня", () => {
      const tomorrow = addDays(todayStr(), 1);
      // Создаем тип события длительностью 60 мин
      const type60 = rules.createEventType({ name: "60 мин", duration: 60 });
      // Старт в 17:30 + 60 мин = 18:30 (выходит за 18:00)
      assert.throws(
        () => rules.createBooking({ eventTypeId: type60.id, guestName: "Гость", startAt: `${tomorrow}T17:30:00.000Z` }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("пределы рабочего дня"),
      );
    });

    test("выбрасывает SLOT_OCCUPIED (409) при пересечении слотов", () => {
      const tomorrow = addDays(todayStr(), 1);
      const startAt = `${tomorrow}T11:00:00.000Z`;

      rules.createBooking({ eventTypeId: "evt-30", guestName: "Первый", startAt });

      assert.throws(
        () => rules.createBooking({ eventTypeId: "evt-30", guestName: "Второй", startAt }),
        (err) => err instanceof rules.ApiError && err.statusCode === 409 && err.code === "SLOT_OCCUPIED",
      );
    });

    test("успешно создает бронирование и рассчитывает endAt", () => {
      const tomorrow = addDays(todayStr(), 1);
      const startAt = `${tomorrow}T14:00:00.000Z`;

      const booking = rules.createBooking({
        eventTypeId: "evt-30",
        guestName: "  Успешный Гость  ",
        startAt,
      });

      assert.ok(booking.id);
      assert.equal(booking.guestName, "Успешный Гость");
      assert.equal(booking.eventTypeId, "evt-30");
      assert.equal(booking.startAt, startAt);
      assert.equal(booking.endAt, `${tomorrow}T14:30:00.000Z`);
    });
  });

  describe("createEventType & eventTypes", () => {
    test("выбрасывает VALIDATION_ERROR для невалидного имени", () => {
      assert.throws(
        () => rules.createEventType({ name: "  ", duration: 30 }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400 && err.message.includes("name"),
      );
    });

    test("выбрасывает VALIDATION_ERROR для некорректной длительности", () => {
      assert.throws(
        () => rules.createEventType({ name: "Test", duration: 0 }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
      assert.throws(
        () => rules.createEventType({ name: "Test", duration: 15.5 }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
      assert.throws(
        () => rules.createEventType({ name: "Test", duration: -10 }),
        (err) => err instanceof rules.ApiError && err.statusCode === 400,
      );
    });

    test("успешно создает тип события", () => {
      const created = rules.createEventType({
        name: "  Специальная консультация  ",
        description: "Детали встречи",
        duration: 45,
      });

      assert.ok(created.id);
      assert.equal(created.name, "Специальная консультация");
      assert.equal(created.description, "Детали встречи");
      assert.equal(created.duration, 45);

      const all = rules.eventTypes();
      assert.ok(all.some((t) => t.id === created.id));
    });
  });

  describe("pendingBookings", () => {
    const todayStr = () => {
      const d = new Date();
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .slice(0, 10);
    };

    const addDays = (baseStr, days) => {
      const d = new Date(`${baseStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };

    test("возвращает только будущие бронирования, отсортированные по возрастанию", () => {
      const tomorrow = addDays(todayStr(), 1);
      const afterTomorrow = addDays(todayStr(), 2);

      // Вручную добавляем прошедшее бронирование в хранилище
      store.listBookings().push({
        id: "past-booking",
        eventTypeId: "evt-30",
        guestName: "Прошедший Гость",
        startAt: "2020-01-01T10:00:00.000Z",
        endAt: "2020-01-01T10:30:00.000Z",
        createdAt: "2020-01-01T09:00:00.000Z",
      });

      // Добавляем два будущих в обратном порядке
      rules.createBooking({
        eventTypeId: "evt-30",
        guestName: "Второй будущий",
        startAt: `${afterTomorrow}T10:00:00.000Z`,
      });
      rules.createBooking({
        eventTypeId: "evt-30",
        guestName: "Первый будущий",
        startAt: `${tomorrow}T10:00:00.000Z`,
      });

      const upcoming = rules.pendingBookings();

      assert.equal(upcoming.length, 2);
      assert.equal(upcoming[0].guestName, "Первый будущий");
      assert.equal(upcoming[1].guestName, "Второй будущий");
    });
  });
});
