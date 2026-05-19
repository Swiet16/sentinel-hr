import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/attendance")({
  component: () => <PlaceholderPage title="Attendance" description="Realtime check-ins, approvals and history." icon={Clock} />,
});
