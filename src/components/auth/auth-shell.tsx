import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: brand */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="absolute -top-24 -right-16 h-[380px] w-[380px] rounded-full bg-accent/40 blur-3xl" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Pulse</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
              Run your workforce with calm, total control.
            </h2>
            <p className="mt-4 text-base text-white/75">
              Attendance, shifts, leaves and payroll — unified into one beautifully designed admin OS.
            </p>
            <div className="mt-10 space-y-3">
              {["Realtime attendance monitoring", "Role-based admin & team-leader access", "Audit-trailed and RLS-secured"].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> {t}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-xs text-white/60">© {new Date().getFullYear()} Pulse Workforce</div>
        </div>
      </div>

      {/* Right: form */}
      <div className="relative flex items-center justify-center bg-background p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-60 lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Pulse</span>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}