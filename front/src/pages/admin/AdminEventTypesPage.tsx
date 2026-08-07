import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { api, ApiError, type EventType } from "../../api/client";

export default function AdminEventTypesPage() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number | undefined>(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTypes(await api.adminListEventTypes());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !duration) return;
    setCreating(true);
    setCreateError(null);
    try {
      await api.createEventType({ name: name.trim(), description: description.trim(), duration });
      setName("");
      setDescription("");
      await load();
    } catch (e) {
      setCreateError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container size="md">
      <Title order={2} mb="sm">
        Типы событий
      </Title>
      <Group mb="lg">
        <Button component={Link} to="/admin/bookings" variant="light">
          Предстоящие встречи
        </Button>
      </Group>

      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && (
        <Card shadow="sm" padding="md" radius="md" withBorder mb="lg">
          <Title order={4} mb="sm">
            Создать тип события
          </Title>
          <Stack>
            <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
            <TextInput
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
            <NumberInput
              label="Длительность (минуты)"
              min={1}
              value={duration ?? undefined}
              onChange={(v) => setDuration(typeof v === "number" ? v : undefined)}
              required
            />
            {createError && <Alert color="red">{createError}</Alert>}
            <Button onClick={handleCreate} loading={creating} disabled={!name.trim() || !duration}>
              Создать
            </Button>
          </Stack>
        </Card>
      )}

      {!loading && !error && (
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Title order={4} mb="sm">
            Существующие типы
          </Title>
          {types.length === 0 ? (
            <Text c="dimmed">Типы событий пока не созданы.</Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Название</Table.Th>
                  <Table.Th>Описание</Table.Th>
                  <Table.Th>Длительность</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {types.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>{t.name}</Table.Td>
                    <Table.Td>{t.description || "—"}</Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">
                        {t.duration} мин
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      )}
    </Container>
  );
}