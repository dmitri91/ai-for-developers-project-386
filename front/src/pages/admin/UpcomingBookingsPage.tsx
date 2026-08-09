import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import dayjs from "dayjs";
import { api, ApiError, type Booking, type EventType } from "../../api/client";
import { formatDateShort, formatDayQuery, formatTime } from "../../datetime";

const AVATAR_COLORS = ["blue", "grape", "teal", "orange", "indigo", "pink", "cyan"];

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface DayGroup {
  date: string;
  label: string;
  items: Booking[];
}

export default function UpcomingBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [items, eventTypes] = await Promise.all([api.upcomingBookings(), api.adminListEventTypes()]);
        setBookings(items);
        setTypes(eventTypes);
      } catch (e) {
        setError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const typeMeta = useMemo(
    () => Object.fromEntries(types.map((t) => [t.id, t])),
    [types],
  );

  const groups: DayGroup[] = useMemo(() => {
    const buckets = new Map<string, Booking[]>();
    for (const b of bookings) {
      const date = formatDayQuery(b.startAt);
      const arr = buckets.get(date) ?? [];
      arr.push(b);
      buckets.set(date, arr);
    }
    const today = dayjs().startOf("day");
    return [...buckets.entries()]
      .sort()
      .map(([date, items]) => {
        const d = dayjs(date).startOf("day");
        const diff = d.diff(today, "day");
        const label =
          diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : diff === -1 ? "Вчера" : d.format("dddd, D MMMM");
        return { date, label, items };
      });
  }, [bookings]);

  return (
    <Container size="xl">
      <Stack gap="lg" maw={860} mx="auto">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={1} style={{ fontWeight: 700 }}>
              Встречи
            </Title>
            <Text c="dimmed" size="sm" mt={2}>
              Предстоящие бронирования всех типов событий
            </Text>
          </div>
          <Button component={Link} to="/admin" variant="default" size="sm">
            Типы событий
          </Button>
        </Group>

        <Group gap="xs">
          <Badge variant="filled" color="gray" size="lg" radius="sm" px="md">
            Предстоящие
          </Badge>
        </Group>

        {loading && <Loader mt="lg" />}
        {error && <Alert color="red">{error}</Alert>}
        {!loading && !error && bookings.length === 0 && (
          <Card withBorder radius="md" p="xl" ta="center" c="dimmed">
            Нет предстоящих встреч.
          </Card>
        )}

        {!loading &&
          !error &&
          groups.map((group) => (
            <Stack key={group.date} gap="sm">
              <Text size="xs" tt="uppercase" fw={700} c="gray.6">
                {group.label}, {dayjs(group.date).format("D MMMM")}
              </Text>
              <Stack gap="xs">
                {group.items.map((b) => {
                  const meta = typeMeta[b.eventTypeId];
                  return (
                    <Card
                      key={b.id}
                      radius="lg"
                      padding="md"
                      withBorder
                      style={{ background: "white" }}
                    >
                      <Group wrap="nowrap" align="center">
                        <Avatar
                          radius="xl"
                          color={AVATAR_COLORS[
                            b.guestName.length % AVATAR_COLORS.length
                          ]}
                        >
                          {initialsOf(b.guestName) || "Г"}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} lineClamp={1}>
                            {meta?.name ?? b.eventTypeId}
                          </Text>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {b.guestName}
                          </Text>
                        </div>
                        <Stack gap={2} align="flex-end" ta="right" style={{ flex: "0 0 auto" }}>
                          <Text fw={600} style={{ whiteSpace: "nowrap" }}>
                            {formatTime(b.startAt)} – {formatTime(b.endAt)}
                          </Text>
                          {meta && (
                            <Badge variant="light" color="blue" size="sm">
                              {meta.duration} мин
                            </Badge>
                          )}
                          <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                            {formatDateShort(b.startAt)}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            </Stack>
          ))}
      </Stack>
    </Container>
  );
}