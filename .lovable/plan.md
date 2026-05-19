
# Attendance & Workforce Management Admin Portal

A premium, enterprise-grade admin portal built on React + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion + Supabase. Visual direction: **Navy Trust** (Deel-like) with **Outfit/Figtree** typography, glassmorphism surfaces, soft shadows, rounded-2xl cards, dark + light mode.

This is a very large scope. To deliver real production quality, the build is split into 4 phases. Phase 1 ships a fully working foundation (auth, roles, dashboard, layout, theming, DB). Each subsequent phase ships a complete module wired end-to-end with Supabase.

---

## Phase 1 — Foundation, Auth, Roles & Dashboard

**Architecture & setup**
- Folder layout: `components/`, `pages/`, `layouts/`, `hooks/`, `lib/`, `services/`, `store/` (Zustand), `routes/`, `types/`, `utils/`, `context/`.
- Theme tokens in `index.css` + `tailwind.config.ts` using Navy Trust palette (`#0f1b3d`, `#1e3a5f`, `#3b6fa0`, `#e8edf3`) as HSL semantic tokens. Outfit (headings) + Figtree (body). Glass surface utility, gradient accents, soft elevation scale, 2xl radius.
- Dark/light mode toggle (Zustand-backed, persisted).
- App shell layout: animated collapsible sidebar, top bar (search, notifications bell, theme toggle, profile menu), breadcrumbs, page transitions via Framer Motion.

**Supabase schema (migration 1)**
- `app_role` enum: `super_admin`, `team_leader`, `employee`.
- `profiles` (user_id, full_name, avatar_url, phone, status).
- `user_roles` (user_id, role) + `has_role()` security definer function.
- `departments` (name, code, description, manager_id).
- `activity_logs` (user_id, action, entity, metadata, ip, user_agent).
- `settings` (company info, attendance policy JSON, notification prefs).
- `notifications` (user_id, type, title, body, read_at).
- Storage bucket: `avatars` (public read), `documents` (private).
- RLS policies on every table; `has_role` used to gate admin/team-leader access.
- Trigger to auto-create `profiles` row on signup; trigger to assign default `employee` role.

**Auth**
- Animated login page (glass card, gradient backdrop, subtle motion).
- Sign in, forgot password (Supabase reset email), `/reset-password` route.
- `onAuthStateChange` listener set up before `getSession()`; session persisted via Supabase client.
- `ProtectedRoute` + `RoleRoute` wrappers; role-based redirects (super admin → admin dashboard, team leader → team dashboard, employee → self portal).

**Super Admin Dashboard**
- KPI cards: total employees, present today, absent today, late today, on leave (animated counters).
- Live attendance widget (Supabase Realtime channel on `attendance_logs`).
- Weekly/monthly attendance line + bar charts (Recharts).
- Department breakdown donut.
- Recent activity feed (from `activity_logs`).
- Quick-action cards (add employee, mark attendance, create shift, approve leaves).

**Deliverable:** Working app with auth, roles, theming, navigation shell, dashboard with real (seed-able) data.

---

## Phase 2 — Employees & Departments

- `employees` table: employee_code (auto-generated), profile_id FK, department_id, designation, joining_date, employment_type, cnic/passport, emergency contacts, salary_base, work_schedule_id, status.
- Pages: Employees list (advanced table with search, multi-filter, bulk select, CSV export), Employee detail (tabs: Overview, Attendance, Leaves, Payroll, Documents), Add/Edit drawer.
- Avatar upload to `avatars` bucket.
- Departments CRUD with manager assignment.
- Designations management.
- RLS: super_admin full access; team_leader read within their department; employee read self only.

---

## Phase 3 — Attendance & Shifts

- `shifts` (name, start_time, end_time, break_minutes, type: morning/evening/night/custom, color).
- `shift_assignments` (employee_id, shift_id, date_from, date_to, rotation_pattern).
- `attendance_logs` (employee_id, date, check_in_at, check_out_at, status: present/absent/late/half_day/leave, hours_worked, overtime_minutes, source: manual/qr/gps, device_info, ip_address, location_lat/lng, approved_by, notes).
- Realtime channel subscription for live attendance board.
- Manual admin controls: mark/edit/approve/reject attendance, bulk mark.
- Late + half-day + overtime calculation via Postgres function based on shift policy.
- Attendance calendar (month view per employee, color-coded statuses).
- QR-ready and GPS-ready columns wired (UI scaffolding, no AI).
- Shift calendar with drag-to-assign UX, conflict detection.

---

## Phase 4 — Leaves, Payroll, Reports, Notifications, Settings

- `leave_types`, `leave_balances`, `leave_requests` (type, from, to, days, reason, status, approver_id, approver_notes).
- Leave workflow: employee submits → team leader/super admin approves/rejects → balances updated via trigger → notification fired.
- Leave calendar (org-wide).
- `payroll_periods`, `payroll_runs`, `payslips` (gross, attendance deductions, overtime, bonuses, custom deductions, net).
- Attendance-based payroll calculation function; payslip PDF export (jsPDF + html2canvas).
- Reports: attendance, department, employee, shift, work-hours, monthly summary; heatmap (attendance density); CSV + PDF export.
- Notifications: realtime bell + toasts via Supabase Realtime on `notifications` table.
- Settings panel: company profile, attendance policy (grace minutes, half-day threshold, overtime rules), role permissions, theme, notification prefs, security (session timeout, password policy).
- Audit logs page (super admin only) with filters.

---

## Technical Details

**Stack & libraries**
- React 18 + Vite + TypeScript, React Router DOM, Tailwind, shadcn/ui, Framer Motion, Recharts, Zustand, Lucide React, `@supabase/supabase-js`, `date-fns`, `react-hook-form` + `zod`, `@tanstack/react-query`, jsPDF, papaparse.

**Security**
- Roles in a separate `user_roles` table (never on profiles).
- `public.has_role(_user_id uuid, _role app_role)` security-definer function used in all RLS policies to prevent recursion.
- Service role key never used in frontend; all privileged ops via edge functions if needed (none required for Phase 1).
- Storage policies scoped by `auth.uid()` folder convention.

**State & data flow**
- Zustand stores: `useAuthStore`, `useThemeStore`, `useUIStore` (sidebar, modals).
- React Query for server state (employees, attendance, etc.) with realtime cache invalidation from Supabase channels.

**Design tokens (semantic HSL)**
- `--background`, `--foreground`, `--primary` (navy `#0f1b3d`), `--accent` (azure `#3b6fa0`), `--surface-glass`, gradient `--gradient-primary` (navy → azure), shadow `--shadow-elevated`, radius base `1rem`/`1.5rem`.
- All component variants reference tokens; no hard-coded colors in components.

**Motion**
- Page transitions (fade + 8px y-slide), sidebar item hover scale, KPI counter spring, chart mount stagger, modal scale-in. Restrained, enterprise-tasteful.

**ASCII layout**
```text
+--------------------------------------------------------+
|  Sidebar  |  Topbar (search • bell • theme • profile)  |
|  (glass)  +--------------------------------------------+
|  • Dash   |  Breadcrumb                                |
|  • Emp    |  +------+ +------+ +------+ +------+       |
|  • Att    |  | KPI  | | KPI  | | KPI  | | KPI  |       |
|  • Shift  |  +------+ +------+ +------+ +------+       |
|  • Leave  |  +------------------+ +-----------------+  |
|  • Pay    |  | Attendance chart | | Live attendance |  |
|  • Report |  +------------------+ +-----------------+  |
|  • Set.   |  +------------------+ +-----------------+  |
|           |  | Dept donut       | | Recent activity |  |
+-----------+--+------------------+-+-----------------+--+
```

---

## What I'll build now (on approval)

Phase 1 only — foundation, theme, auth (all 3 roles), Supabase schema for users/roles/profiles/departments/activity/settings/notifications + storage, app shell, and the Super Admin dashboard with real data and realtime widgets. After it's working, I'll move to Phase 2.

This phased approach is required: attempting all modules in one pass produces shallow, broken code. Each phase ends in a fully usable product.
