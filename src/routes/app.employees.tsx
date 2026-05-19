import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/employees")({
  component: () => <PlaceholderPage title="Employees" description="Manage your workforce, profiles and assignments." icon={Users} />,
});