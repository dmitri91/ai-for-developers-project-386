import "@typespec/http";

using Http;

@service(#{ title: "Calendar Booking Service" })
namespace CalendarService;

/** Тип события, создаваемый владельцем календаря: название, описание и длительность в минутах. */
model EventType {
  id: string;
  name: string;
  description: string;
  @minValue(1)
  duration: int32;
}

/** Тело при создании типа события. id присваивается сервером. */
model CreateEventType {
  name: string;
  description: string;
  @minValue(1)
  duration: int32;
}

model EventTypeList {
  items: EventType[];
}

/** Свободный слот в окне записи. */
model Slot {
  startAt: utcDateTime;
  endAt: utcDateTime;
}

/** Доступные слоты для одного дня календаря. */
model DayAvailability {
  date: plainDate;
  slots: Slot[];
}

/** Окно доступности свободных слотов на ближайшие 14 дней от текущей даты. */
model AvailabilityWindow {
  eventTypeId: string;
  from: plainDate;
  to: plainDate;
  days: DayAvailability[];
}

/** Бронирование гостя на свободный слот. */
model Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  createdAt: utcDateTime;
}

/** Данные для бронирования свободного слота без регистрации. */
model CreateBooking {
  eventTypeId: string;
  guestName: string;
  startAt: utcDateTime;
}

model BookingList {
  items: Booking[];
}

@error
model ValidationError {
  @statusCode statusCode: 400;
  code: "VALIDATION_ERROR";
  message: string;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "NOT_FOUND";
  message: string;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  code: "SLOT_OCCUPIED";
  message: string;
}

model BookingCreated {
  @statusCode statusCode: 201;
  @body body: Booking;
}

model EventTypeCreated {
  @statusCode statusCode: 201;
  @body body: EventType;
}

/**
 * Публичный сценарий гостя. Гость не создаёт аккаунт и не входит в систему.
 */
@route("/event-types")
interface EventTypes {
  @doc("Страница с видами брони: название, описание и длительность типа события. Доступна без входа.")
  @get list(): EventTypeList;

  /**
   * Календарь свободных слотов в окне [from, to].
   * Окно записи по умолчанию — ближайшие 14 дней от текущей даты.
   */
  @get
  @route("{eventTypeId}/availability")
  availability(
    @path eventTypeId: string,
    @query from: plainDate,
    @query to: plainDate
  ): AvailabilityWindow | NotFoundError | ValidationError;
}

/**
 * Публичный сценарий гостя: создание бронирования на свободный слот.
 * На одно и то же время нельзя создать две записи, даже для разных типов событий —
 * в этом случае возвращается 409 Conflict.
 */
@route("/bookings")
interface Bookings {
  @doc("Создание бронирования на выбранный свободный слот.")
  @post
  create(@body body: CreateBooking): BookingCreated | ValidationError | ConflictError | NotFoundError;
}

/**
 * Админская часть. Владелец календаря — один предзаданный профиль, используется по умолчанию,
 * без регистрации и входа.
 */
@route("/admin/event-types")
interface AdminEventTypes {
  @doc("Список типов событий для админской части.")
  @get list(): EventTypeList;

  @doc("Создание типа события: id присваивается сервером, задаются название, описание и длительность в минутах.")
  @post
  create(@body body: CreateEventType): EventTypeCreated | ValidationError;
}

/** Страница предстоящих встреч владельца. */
@route("/admin/bookings")
interface AdminBookings {
  @doc("Предстоящие встречи: в одном списке показаны бронирования всех типов событий по возрастанию времени.")
  @get
  @route("upcoming")
  listUpcoming(): BookingList;
}