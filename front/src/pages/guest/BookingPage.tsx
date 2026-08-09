import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Alert, Badge, Button, Card, Container, Divider, Grid, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import { api, ApiError, type AvailabilityWindow, type EventType, type Slot } from "../../api/client";
import { formatTime } from "../../datetime";

export default function BookingPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => (location.state as { date?: string } | null)?.date ?? null,
  );

  useEffect(() => {
    if (!eventTypeId) return;
    const load = async () => {
      try {
        const from = dayjs().format("YYYY-MM-DD");
        const to = dayjs().add(13, "day").format("YYYY-MM-DD");
        const [types, window] = await Promise.all([
          api.listEventTypes(),
          api.availability(eventTypeId, from, to),
        ]);
        const found = types.find((t) => t.id === eventTypeId) ?? null;
        setEventType(found);
        setAvailability(window);
        if (!found) setError("Тип события не найден");
      } catch (e) {
        setError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [eventTypeId]);

  const loadAvailability = async () => {
    if (!eventTypeId) return;
    try {
      const from = dayjs().format("YYYY-MM-DD");
      const to = dayjs().add(13, "day").format("YYYY-MM-DD");
      setAvailability(await api.availability(eventTypeId, from, to));
    } catch {
      // keep current window
    }
  };

  const handleDateChange = (d: string | null) => {
    if (d) setSelectedDate(d);
  };

  const slotsForDate: Slot[] = useMemo(() => {
    if (!selectedDate || !availability) return [];
    return availability.days.find((day) => day.date === selectedDate)?.slots ?? [];
  }, [selectedDate, availability]);

  if (loading) return <Loader mt="xl" />;
  if (error) return <Alert color="red" mt="xl">{error}</Alert>;

  const dateLabel = selectedDate ? dayjs(selectedDate).format("dddd, D MMMM") : "Дата не выбрана";

  return (
    <Container size="lg">
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="md">
            {eventType && (
              <>
                <Title order={2}>{eventType.name}</Title>
                <Badge color="blue" variant="light" w="fit-content">
                  {eventType.duration} мин
                </Badge>
                <Text c="dimmed" size="sm">
                  {eventType.description || "Без описания"}
                </Text>
              </>
            )}

            <Divider />

            <Text fw={600}>Выбранная дата</Text>
            <Text c="dimmed">{dateLabel}</Text>

            <Divider />

            <Text fw={600}>Статус слотов</Text>
            {slotsForDate.length === 0 ? (
              <Text c="dimmed" size="sm">
                На выбранную дату свободных слотов нет.
              </Text>
            ) : (
              <Stack gap={6}>
                {slotsForDate.map((slot) => (
                  <Button
                    key={slot.startAt}
                    variant="default"
                    size="sm"
                    radius="md"
                    fullWidth
                    onClick={() =>
                      navigate(`/book/${eventTypeId}/confirm?ts=${encodeURIComponent(slot.startAt)}`)
                    }
                    style={{ paddingLeft: 12, paddingRight: 12 }}
                  >
                    <Group justify="space-between" w="100%" wrap="nowrap">
                      <Text fw={600}>
                        {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                      </Text>
                      <Badge color="green" variant="light" size="sm">
                        Свободно
                      </Badge>
                    </Group>
                  </Button>
                ))}
              </Stack>
            )}

            <Group mt="sm">
              <Button variant="default" onClick={() => navigate("/book")}>
                Назад к типам
              </Button>
            </Group>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="lg" padding="lg" style={{ background: "white" }}>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={600} size="lg">
                  Календарь
                </Text>
                <Button variant="subtle" size="xs" onClick={loadAvailability}>
                  Обновить слоты
                </Button>
              </Group>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                minDate={availability?.from}
                maxDate={availability?.to}
                size="md"
              />
              <Text size="xs" c="dimmed">
                Доступны слоты на ближайшие 14 дней.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}