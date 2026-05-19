
-- ========== ATTENDANCE ==========
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'present',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_attendance_user_date on public.attendance_records(user_id, date desc);
alter table public.attendance_records enable row level security;

create policy "attendance_select_own_or_admin" on public.attendance_records
  for select to authenticated using (auth.uid() = user_id or has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));
create policy "attendance_insert_own_or_admin" on public.attendance_records
  for insert to authenticated with check (auth.uid() = user_id or has_role(auth.uid(),'super_admin'));
create policy "attendance_update_own_or_admin" on public.attendance_records
  for update to authenticated using (auth.uid() = user_id or has_role(auth.uid(),'super_admin'));
create policy "attendance_delete_admin" on public.attendance_records
  for delete to authenticated using (has_role(auth.uid(),'super_admin'));

create trigger attendance_set_updated_at before update on public.attendance_records
  for each row execute function public.tg_set_updated_at();

-- ========== SHIFTS ==========
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  days int[] not null default '{1,2,3,4,5}',
  color text default '#3b82f6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shifts enable row level security;
create policy "shifts_select_all" on public.shifts for select to authenticated using (true);
create policy "shifts_manage_admin" on public.shifts for all to authenticated
  using (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'))
  with check (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));
create trigger shifts_set_updated_at before update on public.shifts for each row execute function public.tg_set_updated_at();

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_shift_assignments_user on public.shift_assignments(user_id);
alter table public.shift_assignments enable row level security;
create policy "shift_assign_select" on public.shift_assignments for select to authenticated
  using (auth.uid() = user_id or has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));
create policy "shift_assign_manage" on public.shift_assignments for all to authenticated
  using (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'))
  with check (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));

-- ========== LEAVES ==========
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_balance int not null default 0,
  color text default '#22c55e'
);
alter table public.leave_types enable row level security;
create policy "leave_types_select" on public.leave_types for select to authenticated using (true);
create policy "leave_types_manage" on public.leave_types for all to authenticated
  using (has_role(auth.uid(),'super_admin')) with check (has_role(auth.uid(),'super_admin'));

insert into public.leave_types (name, default_balance, color) values
  ('Annual', 20, '#22c55e'),
  ('Sick', 10, '#f59e0b'),
  ('Unpaid', 0, '#94a3b8')
on conflict (name) do nothing;

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leave_requests enable row level security;
create policy "leave_req_select" on public.leave_requests for select to authenticated
  using (auth.uid() = user_id or has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));
create policy "leave_req_insert_own" on public.leave_requests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "leave_req_update" on public.leave_requests for update to authenticated
  using (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader') or (auth.uid() = user_id and status = 'pending'));
create policy "leave_req_delete_own_pending" on public.leave_requests for delete to authenticated
  using (auth.uid() = user_id and status = 'pending');
create trigger leave_req_set_updated_at before update on public.leave_requests for each row execute function public.tg_set_updated_at();

-- ========== PAYROLL ==========
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.payroll_runs enable row level security;
create policy "payroll_runs_select" on public.payroll_runs for select to authenticated
  using (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'team_leader'));
create policy "payroll_runs_manage" on public.payroll_runs for all to authenticated
  using (has_role(auth.uid(),'super_admin')) with check (has_role(auth.uid(),'super_admin'));

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.payroll_runs(id) on delete cascade,
  user_id uuid not null,
  period_start date not null,
  period_end date not null,
  base_salary numeric(12,2) not null default 0,
  overtime numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_payslips_user on public.payslips(user_id, period_end desc);
alter table public.payslips enable row level security;
create policy "payslips_select_own_or_admin" on public.payslips for select to authenticated
  using (auth.uid() = user_id or has_role(auth.uid(),'super_admin'));
create policy "payslips_manage_admin" on public.payslips for all to authenticated
  using (has_role(auth.uid(),'super_admin')) with check (has_role(auth.uid(),'super_admin'));

-- ========== PROFILES: department_id + salary ==========
alter table public.profiles add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.profiles add column if not exists base_salary numeric(12,2) default 0;
alter table public.profiles add column if not exists job_title text;
