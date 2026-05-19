import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive" | "accent";
  delay?: number;
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  primary: "from-primary/20 to-primary/0 text-primary",
  success: "from-success/25 to-success/0 text-success",
  warning: "from-warning/25 to-warning/0 text-warning",
  destructive: "from-destructive/25 to-destructive/0 text-destructive",
  accent: "from-accent/25 to-accent/0 text-accent",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden p-5 shadow-soft transition hover:shadow-elegant">
        <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${toneMap[tone]} opacity-60 blur-2xl transition group-hover:opacity-80`} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
            {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card shadow-soft ${toneMap[tone].split(" ").pop()}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}