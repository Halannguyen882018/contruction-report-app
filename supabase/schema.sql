-- ============================================
-- Construction Daily Report App - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Projects (Dự án)
-- ============================================
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- ============================================
-- 2. Project Members (Thành viên dự án)
-- ============================================
create table project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'contractor')),
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

-- ============================================
-- 3. Categories / Work Items (Hạng mục)
-- ============================================
create table categories (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============================================
-- 4. Daily Reports (Báo cáo hàng ngày)
-- ============================================
create table daily_reports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  reported_by uuid references auth.users(id) on delete cascade not null,
  report_date date not null default current_date,
  worker_count int not null default 0,
  work_description text not null,
  progress_note text,
  status text default 'in_progress' check (status in ('not_started', 'in_progress', 'completed', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 5. Report Attachments (Hình ảnh / File đính kèm)
-- ============================================
create table report_attachments (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references daily_reports(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text,
  created_at timestamptz default now()
);

-- ============================================
-- 6. User Profiles
-- ============================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  role text default 'contractor' check (role in ('owner', 'contractor')),
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table projects enable row level security;
alter table project_members enable row level security;
alter table categories enable row level security;
alter table daily_reports enable row level security;
alter table report_attachments enable row level security;
alter table profiles enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Projects: members can view their projects
create policy "Members can view projects" on projects for select
  using (id in (select project_id from project_members where user_id = auth.uid()));
create policy "Owners can create projects" on projects for insert
  with check (owner_id = auth.uid());
create policy "Owners can update projects" on projects for update
  using (owner_id = auth.uid());

-- Project Members: members can view other members
create policy "Members can view members" on project_members for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()));
create policy "Owners can add members" on project_members for insert
  with check (project_id in (select id from projects where owner_id = auth.uid()));
create policy "Owners can remove members" on project_members for delete
  using (project_id in (select id from projects where owner_id = auth.uid()));

-- Categories: project members can view
create policy "Members can view categories" on categories for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()));
create policy "Members can create categories" on categories for insert
  with check (project_id in (select project_id from project_members where user_id = auth.uid()));
create policy "Members can update categories" on categories for update
  using (project_id in (select project_id from project_members where user_id = auth.uid()));

-- Daily Reports: project members can view, contractors can create
create policy "Members can view reports" on daily_reports for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()));
create policy "Contractors can create reports" on daily_reports for insert
  with check (reported_by = auth.uid());
create policy "Contractors can update own reports" on daily_reports for update
  using (reported_by = auth.uid());

-- Report Attachments
create policy "Members can view attachments" on report_attachments for select
  using (report_id in (
    select id from daily_reports where project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  ));
create policy "Contractors can add attachments" on report_attachments for insert
  with check (report_id in (select id from daily_reports where reported_by = auth.uid()));

-- ============================================
-- Storage Bucket for report photos
-- ============================================
insert into storage.buckets (id, name, public) values ('report-photos', 'report-photos', true);

create policy "Authenticated users can upload" on storage.objects for insert
  with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');
create policy "Anyone can view report photos" on storage.objects for select
  using (bucket_id = 'report-photos');

-- ============================================
-- Function: auto-create profile on signup
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'contractor'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- Function: auto-add owner as project member
-- ============================================
create or replace function handle_new_project()
returns trigger as $$
begin
  insert into project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on projects
  for each row execute function handle_new_project();
