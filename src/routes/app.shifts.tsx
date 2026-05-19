import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/shifts")({
  component: () => <PlaceholderPage title="Shifts" description="Plan rotations, assign and resolve conflicts." icon={CalendarDays} />,
});
