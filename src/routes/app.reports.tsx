import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/reports")({
  component: () => <PlaceholderPage title="Reports" description="Heatmaps, exports and deep analytics." icon={BarChart3} />,
});
