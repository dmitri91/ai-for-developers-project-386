import { randomUUID } from "node:crypto";

const eventTypes = [
  { id: "evt-15", name: "Встреча 15 минут", description: "Короткий тип события для быстрого слота.", duration: 15 },
  { id: "evt-30", name: "Встреча 30 минут", description: "Базовый тип события для бронирования.", duration: 30 },
];

const bookings = [];

export function listEventTypes() {
  return eventTypes;
}

export function findEventType(id) {
  return eventTypes.find((t) => t.id === id);
}

export function createEventType({ name, description, duration }) {
  const eventType = { id: randomUUID(), name, description, duration };
  eventTypes.push(eventType);
  return eventType;
}

export function listBookings() {
  return bookings;
}

export function createBooking({ eventTypeId, guestName, startAt, endAt }) {
  const booking = {
    id: randomUUID(),
    eventTypeId,
    guestName,
    startAt,
    endAt,
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}