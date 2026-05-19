import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/notifications")({
  component: () => <PlaceholderPage title="Notifications" description="Realtime alerts across your workspace." icon={Bell} />,
});
