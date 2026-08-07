import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import dayjs from "dayjs";
import { api, ApiError, type EventType } from "../../api/client";

export default function ConfirmBookingPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startAt = searchParams.get("ts");

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "conflict" | "error" | null>(null);

  useEffect(() => {
    if (!eventTypeId) return;
    const load = async () => {
      try {
        const types = await api.listEventTypes();
        setEventType(types.find((t) => t.id === eventTypeId) ?? null);
        if (!types.find((t) => t.id === eventTypeId)) setError("Тип события не найден");
      } catch (e) {
        setError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [eventTypeId]);

  const handleSubmit = async () => {
    if (!startAt || !guestName.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      await api.createBooking({ eventTypeId: eventTypeId!, guestName: guestName.trim(), startAt });
      setResult("success");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setResult("conflict");
      else setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader mt="xl" />;
  if (error) return <Alert color="red" mt="xl">{error}</Alert>;

  const dateLabel = startAt ? dayjs(startAt).format("dddd, D MMMM") : "";
  const timeLabel = startAt ? dayjs(startAt).format("HH:mm") : "";

  return (
    <Container size="sm" pt="md">
      <Card withBorder radius="lg" padding="lg" style={{ background: "white" }}>
        <Stack gap="md">
          <div>
            <Title order={2}>{eventType?.name ?? "Бронирование"}</Title>
            <Text c="dimmed" size="sm">
              {eventType?.description || "Без описания"}
            </Text>
          </div>

          <Group gap="xs">
            <Badge color="blue" variant="light">
              {eventType?.duration ?? 0} мин
            </Badge>
            <Badge color="gray" variant="light">
              {dateLabel} · {timeLabel}
            </Badge>
          </Group>

          <Divider />

          {result === "success" ? (
            <>
              <Alert color="green">
                Забронировано! {timeLabel} · {dateLabel}
              </Alert>
              <Group>
                <Button
                  variant="default"
                  onClick={() => navigate(`/book/${eventTypeId}`, { state: { date: dayjs(startAt).format("YYYY-MM-DD") } })}
                >
                  Назад к слотам
                </Button>
              </Group>
            </>
          ) : (
            <>
              {result === "conflict" && (
                <Alert color="red" title="Слот уже занят">
                  Это время только что забронировали. Вернитесь и выберите другой слот.
                </Alert>
              )}
              {result === "error" && (
                <Alert color="red">Не удалось создать бронирование. Попробуйте ещё раз.</Alert>
              )}
              <TextInput
                label="Ваше имя"
                placeholder="Как вас представить"
                value={guestName}
                onChange={(e) => setGuestName(e.currentTarget.value)}
                required
              />
              <Group>
                <Button
                  variant="default"
                  onClick={() => navigate(`/book/${eventTypeId}`, { state: { date: dayjs(startAt).format("YYYY-MM-DD") } })}
                  disabled={submitting}
                >
                  Назад
                </Button>
                <Button onClick={handleSubmit} loading={submitting} disabled={!guestName.trim()}>
                  Подтвердить бронь
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}