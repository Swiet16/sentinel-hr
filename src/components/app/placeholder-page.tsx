import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-16 text-center shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Coming in the next phase</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          This module is wired into your Supabase backend in the next build phase. The foundation, auth, roles, and dashboard are live now.
        </p>
      </Card>
    </div>
  );
}