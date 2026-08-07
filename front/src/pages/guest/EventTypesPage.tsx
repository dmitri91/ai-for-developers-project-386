import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Box, Card, Container, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { api, ApiError, type EventType } from "../../api/client";

export default function EventTypesPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listEventTypes()
      .then(setTypes)
      .catch((e) => setError(e instanceof ApiError ? `${e.code}: ${e.message}` : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container size="sm">
      <Stack gap="md" pt="md">
        <Box ta="left">
          <Title order={1}>Выберите тип события</Title>
          <Text c="dimmed">Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.</Text>
        </Box>

        {loading && <Loader mt="lg" />}
        {error && <Alert color="red">{error}</Alert>}
        {!loading && !error && types.length === 0 && (
          <Text c="dimmed">Пока нет доступных типов событий.</Text>
        )}

        <SimpleGrid cols={1} spacing="md">
          {types.map((t) => (
            <Card
              key={t.id}
              withBorder
              radius="lg"
              padding="lg"
              style={{ background: "white", cursor: "pointer" }}
              onClick={() => navigate(`/book/${t.id}`)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Box>
                  <Text fw={600} size="lg">
                    {t.name}
                  </Text>
                  <Text size="sm" c="dimmed" mt={2}>
                    {t.description || "Без описания"}
                  </Text>
                </Box>
                <Badge color="blue" variant="light" size="lg">
                  {t.duration} мин
                </Badge>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}