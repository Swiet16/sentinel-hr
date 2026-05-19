import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock4,
  Users,
  BarChart3,
  Shield,
  Sparkles,
  CalendarCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Clock4, title: "Realtime attendance", desc: "Track every check-in across teams as it happens." },
  { icon: CalendarCheck, title: "Shifts & leaves", desc: "Plan rotations, approve leaves, resolve conflicts." },
  { icon: Wallet, title: "Smart payroll", desc: "Attendance-based salary, overtime, deductions." },
  { icon: BarChart3, title: "Deep analytics", desc: "Heatmaps, productivity, department insights." },
  { icon: Users, title: "Role-based access", desc: "Super Admin, Team Leader and Employee portals." },
  { icon: Shield, title: "Enterprise security", desc: "RLS, audit logs, device & IP tracking." },
];

function Landing() {
  const session = useAuthStore((s) => s.session);
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-80" />
      <div className="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Pulse</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#roles" className="hover:text-foreground">Roles</a>
          <a href="#stats" className="hover:text-foreground">Why Pulse</a>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <Button asChild>
              <Link to="/app">Open dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-primary shadow-elegant hover:opacity-95">
                <Link to="/auth/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Now in private beta — built for enterprise teams
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            The workforce OS for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">modern teams</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Pulse unifies attendance, shifts, leaves and payroll into one beautifully designed admin portal — with realtime monitoring and full manual control.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="bg-gradient-primary shadow-elegant hover:opacity-95">
              <Link to={session ? "/app" : "/auth/signup"}>
                {session ? "Open dashboard" : "Start free"} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth/login">I have an account</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="glass rounded-3xl p-2 shadow-elegant">
            <div className="rounded-[20px] bg-gradient-to-br from-card to-secondary/60 p-8 text-left">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { k: "Present", v: "248", c: "text-success" },
                  { k: "Late", v: "12", c: "text-warning" },
                  { k: "On leave", v: "8", c: "text-accent" },
                  { k: "Absent", v: "4", c: "text-destructive" },
                ].map((kpi) => (
                  <div key={kpi.k} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{kpi.k}</div>
                    <div className={`mt-2 text-3xl font-semibold ${kpi.c}`}>{kpi.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {["Engineering", "Design", "Operations"].map((d, i) => (
                  <div key={d} className="rounded-2xl border border-border/60 bg-card p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d}</span>
                      <span className="text-muted-foreground">{[92, 87, 95][i]}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${[92, 87, 95][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Everything to run your workforce</h2>
          <p className="mt-3 text-muted-foreground">Admin-controlled, manually verifiable, beautifully presented.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition hover:shadow-elegant"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Pulse Workforce. Built with love.
      </footer>
    </div>
  );
}
