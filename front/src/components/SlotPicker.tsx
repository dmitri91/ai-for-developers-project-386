import { Button, Card, Stack, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import type { DayAvailability } from "../api/client";
import { formatTime } from "../datetime";

interface SlotPickerProps {
  days: DayAvailability[];
  selectedStartAt: string | null;
  onSelect: (startAt: string) => void;
}

export default function SlotPicker({ days, selectedStartAt, onSelect }: SlotPickerProps) {
  return (
    <Stack gap="md">
      {days.map((day) => (
        <Card key={day.date} shadow="sm" padding="md" radius="md" withBorder>
          <Title order={5} mb="xs">
            {dayjs(day.date).format("dddd, D MMMM")}
          </Title>
          {day.slots.length === 0 ? (
            <Text size="sm" c="dimmed">
              Нет свободных слотов
            </Text>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {day.slots.map((slot) => {
                const active = slot.startAt === selectedStartAt;
                return (
                  <Button
                    key={slot.startAt}
                    size="sm"
                    variant={active ? "filled" : "default"}
                    onClick={() => onSelect(slot.startAt)}
                  >
                    {formatTime(slot.startAt)}
                  </Button>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </Stack>
  );
}