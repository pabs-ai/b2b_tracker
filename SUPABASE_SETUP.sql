-- ============================================
-- Boots2Bytes Transition Tracker — Supabase SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- Members table
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  track text not null default 'regular', -- 'regular' or 'skillbridge'
  token text unique not null,
  cohort text,
  created_at timestamptz default now(),
  last_active timestamptz
);

-- Milestones (checklist items)
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  section text not null, -- 'career', 'va_benefits', 'job_placement', 'coaching'
  label text not null,
  completed boolean default false,
  completed_at timestamptz,
  due_date text,
  created_at timestamptz default now()
);

-- Section statuses (set by instructor)
create table if not exists section_statuses (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  section text not null,
  status text not null default 'not_started',
  updated_at timestamptz default now(),
  unique(member_id, section)
);

-- Journal entries (member responses + instructor notes)
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  section text not null,
  content text not null,
  is_instructor_note boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

alter table members enable row level security;
alter table milestones enable row level security;
alter table section_statuses enable row level security;
alter table journal_entries enable row level security;

-- Allow all reads and writes via anon key (token-based privacy)
-- Members are identified by their unique token, not a login

create policy "Allow all on members" on members for all using (true) with check (true);
create policy "Allow all on milestones" on milestones for all using (true) with check (true);
create policy "Allow all on section_statuses" on section_statuses for all using (true) with check (true);
create policy "Allow all on journal_entries" on journal_entries for all using (true) with check (true);
