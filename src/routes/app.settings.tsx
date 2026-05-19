import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/settings")({
  component: () => <PlaceholderPage title="Settings" description="Company, policies, security and theme." icon={Settings} />,
});
