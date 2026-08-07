import type { components } from "./contract";

export type EventType = components["schemas"]["EventType"];
export type Booking = components["schemas"]["Booking"];
export type Slot = components["schemas"]["Slot"];
export type DayAvailability = components["schemas"]["DayAvailability"];
export type AvailabilityWindow = components["schemas"]["AvailabilityWindow"];
export type CreateBooking = components["schemas"]["CreateBooking"];
export type CreateEventType = components["schemas"]["CreateEventType"];

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorPayload {
  code?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let payload: ErrorPayload = {};
    try {
      payload = (await res.json()) as ErrorPayload;
    } catch {
      // ignore non-json error bodies
    }
    throw new ApiError(res.status, payload.code ?? "UNKNOWN", payload.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listEventTypes(): Promise<EventType[]> {
    return request<{ items: EventType[] }>("/event-types").then((r) => r.items);
  },

  availability(eventTypeId: string, from: string, to: string): Promise<AvailabilityWindow> {
    return request<AvailabilityWindow>(
      `/event-types/${eventTypeId}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
  },

  createBooking(body: CreateBooking): Promise<Booking> {
    return request<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) });
  },

  adminListEventTypes(): Promise<EventType[]> {
    return request<{ items: EventType[] }>("/admin/event-types").then((r) => r.items);
  },

  createEventType(body: CreateEventType): Promise<EventType> {
    return request<EventType>("/admin/event-types", { method: "POST", body: JSON.stringify(body) });
  },

  upcomingBookings(): Promise<Booking[]> {
    return request<{ items: Booking[] }>("/admin/bookings/upcoming").then((r) => r.items);
  },
};
