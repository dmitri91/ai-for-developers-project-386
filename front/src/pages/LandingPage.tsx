import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Grid, Stack, Text, Title } from "@mantine/core";

const FEATURES = [
  "Выбор типа события и удобного времени для встречи.",
  "Быстрое бронирование с подтверждением и дополнительными заметками.",
  "Управление типами встреч и просмотр предстоящих записей в админке.",
];

export default function LandingPage() {
  return (
    <Container size="md" pt="xl">
      <Stack gap="xl">
        <Card withBorder radius="lg" padding="xl" style={{ background: "white" }}>
          <Stack gap="sm" align="center" ta="center">
            <Badge size="lg" color="blue" variant="light">
              БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
            </Badge>
            <Title order={1} style={{ maxWidth: 640 }}>
              Забронируйте встречу за минуту: выберите тип события и удобное время.
            </Title>
            <Button component={Link} to="/book" size="lg" mt="md">
              Записаться →
            </Button>
          </Stack>
        </Card>

        <Card withBorder radius="lg" padding="xl" style={{ background: "white" }}>
          <Title order={2} size="h3" mb="md">
            Возможности
          </Title>
          <Grid>
            {FEATURES.map((f) => (
              <Grid.Col key={f} span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" padding="md">
                  <Text size="sm">{f}</Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Card>
      </Stack>
    </Container>
  );
}