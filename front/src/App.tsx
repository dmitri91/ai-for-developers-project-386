import { Routes, Route, NavLink } from "react-router-dom";
import { AppShell, Group, Title, Button } from "@mantine/core";
import LandingPage from "./pages/LandingPage";
import EventTypesPage from "./pages/guest/EventTypesPage";
import BookingPage from "./pages/guest/BookingPage";
import ConfirmBookingPage from "./pages/guest/ConfirmBookingPage";
import AdminEventTypesPage from "./pages/admin/AdminEventTypesPage";
import UpcomingBookingsPage from "./pages/admin/UpcomingBookingsPage";

const NAV_ITEMS = [
  { to: "/book", label: "Записаться" },
  { to: "/admin", label: "Админка" },
];

export default function App() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header style={{ background: "white" }}>
        <Group h="100%" px="lg" justify="space-between">
          <Title order={2} size="h3">
            <NavLink to="/" style={{ textDecoration: "none", color: "inherit" }}>
              Calendar
            </NavLink>
          </Title>
          <Group gap={8}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                size="sm"
                variant="subtle"
                styles={(theme) => ({
                  root: {
                    borderRadius: theme.radius.md,
                    "&.active": {
                      backgroundColor: theme.colors.gray[1],
                      color: theme.colors.dark[6],
                    },
                  },
                })}
              >
                {item.label}
              </Button>
            ))}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<EventTypesPage />} />
          <Route path="/book/:eventTypeId" element={<BookingPage />} />
          <Route path="/book/:eventTypeId/confirm" element={<ConfirmBookingPage />} />
          <Route path="/admin" element={<AdminEventTypesPage />} />
          <Route path="/admin/bookings" element={<UpcomingBookingsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}