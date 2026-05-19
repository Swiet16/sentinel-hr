import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/departments")({
  component: () => <PlaceholderPage title="Departments" description="Organize teams and assign managers." icon={Building2} />,
});
