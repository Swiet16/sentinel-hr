import { createFileRoute } from "@tanstack/react-router";
import { PalmtreeIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/leaves")({
  component: () => <PlaceholderPage title="Leaves" description="Requests, balances and approvals." icon={PalmtreeIcon} />,
});
