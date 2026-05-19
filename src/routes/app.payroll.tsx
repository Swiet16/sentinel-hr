import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";
export const Route = createFileRoute("/app/payroll")({
  component: () => <PlaceholderPage title="Payroll" description="Attendance-based salary, overtime and payslips." icon={Wallet} />,
});
