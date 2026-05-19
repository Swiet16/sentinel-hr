## Build out all remaining modules (Phase 2 → Phase 4)

Right now only Auth + Dashboard are live. Every other sidebar page shows the "Coming in the next phase" placeholder. I'll replace all of them with real, Supabase-wired functionality, scoped by role (Super Admin / Team Leader / Employee).

### Modules to ship

**1. Employees** (`/app/employees`)
- Table with search, status filter, department filter, pagination
- Super Admin: create / edit / deactivate employees, assign role + department
- Team Leader: view employees in their department (read-only)
- Employee: view own profile only
- Drawer for create/edit; avatar upload to `avatars` bucket

**2. Departments** (`/app/departments`)
- Grid of department cards (name, code, manager, headcount)
- Super Admin: full CRUD, assign manager from employee list
- Others: read-only

**3. Attendance** (`/app/attendance`)
- New tables: `attendance_records` (check_in, check_out, status, notes, location), with RLS
- Today view: live check-in/out button for current user + manual entry for admins
- History tab: filterable table by date range, employee, status
- Approval queue for Team Leaders / Super Admin (approve/reject edits)

**4. Shifts** (`/app/shifts`)
- New tables: `shifts` (name, start/end, days), `shift_assignments` (user_id, shift_id, date range)
- Weekly calendar view with assignments
- Super Admin / Team Leader: create shifts, assign to employees, resolve conflicts

**5. Leaves** (`/app/leaves`)
- New tables: `leave_types`, `leave_requests` (type, start, end, reason, status), `leave_balances`
- Employee: request leave, see balance + history
- Team Leader / Super Admin: approval queue with approve/reject + comment

**6. Payroll** (`/app/payroll`)
- New tables: `payroll_runs`, `payslips` (user_id, period, base, overtime, deductions, net)
- Computed from attendance + shifts (manual trigger by Super Admin)
- Employee: view own payslips, download
- Super Admin: run payroll for a period, edit individual payslips

**7. Reports** (`/app/reports`)
- KPI cards + charts: attendance trends, department breakdown, leave usage, overtime
- Date range picker, department filter
- CSV export for each report (Super Admin / Team Leader)

**8. Notifications** (`/app/notifications`)
- List of `notifications` rows for current user
- Mark read / mark all read, filter by type
- Realtime subscription via Supabase channels

**9. Settings** (`/app/settings`)
- Tabs: Company (name, logo, timezone), Attendance Policy, Notifications, Roles
- Super Admin: edit `company_settings`, manage user roles
- Others: profile tab only (own name, phone, avatar, password)

### Cross-cutting work

- **Role gating helpers**: `useRole()` hook + `<RoleGate roles={[...]}>` wrapper component
- **Shared UI**: data-table primitive (sort/filter/pagination), drawer-form pattern, empty-state, confirmation dialog
- **Server functions**: each module gets `*.functions.ts` files using `requireSupabaseAuth` for writes that need role checks
- **RLS**: every new table gets enable + policies (own-row for employees, department-scope for team leaders via a `dept_members` helper, super_admin full access via `has_role`)
- **Realtime**: notifications + attendance "currently checked in" widget
- **Activity logs**: write to `activity_logs` on every create/update/delete
- **Animations**: framer-motion page transitions already in place; add staggered row entrances + skeleton loaders

### Technical details

- New migrations (one per module group): attendance, shifts, leaves, payroll. Each includes tables + indexes + `tg_set_updated_at` triggers + RLS policies using existing `has_role()` security-definer function.
- `lib/server/<module>.functions.ts` for any mutation that needs cross-row validation (e.g., shift conflict check, payroll calc, leave balance decrement).
- Client reads use the browser supabase client + TanStack Query for caching + invalidation on mutations.
- Charts: Recharts (already installed), reuse `KpiCard`.
- CSV export: simple client-side blob from query results.
- File downloads (payslip PDF): defer to a later iteration — start with HTML/print view.

### Order of execution

1. Shared primitives (data-table, role gate, drawer-form) + migrations for attendance/shifts/leaves/payroll
2. Employees + Departments (uses existing tables)
3. Attendance + Shifts
4. Leaves + Payroll
5. Reports + Notifications + Settings
6. Polish pass: animations, empty states, loading skeletons, mobile layout

### Scope notes

- This is a multi-step build that will span several turns. I'll work through it module-by-module and post progress as I go.
- No AI features, no external integrations — everything manual per the original brief.
- PDF generation for payslips and complex shift-conflict resolution are kept minimal in v1; can be expanded later.
