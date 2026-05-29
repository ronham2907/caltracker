-- CalTrack Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  age integer,
  weight_kg decimal(5,2),
  height_cm decimal(5,2),
  goal_type text check (goal_type in ('lose', 'maintain', 'gain')) default 'maintain',
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')) default 'moderate',
  daily_calorie_goal integer default 2000,
  daily_protein_goal integer default 150,
  daily_carb_goal integer default 250,
  daily_fat_goal integer default 65,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Food Logs ────────────────────────────────────────────────────────────────
create table public.food_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date default current_date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  food_name text not null,
  calories integer not null,
  protein_g decimal(6,2) default 0,
  carbs_g decimal(6,2) default 0,
  fat_g decimal(6,2) default 0,
  quantity decimal(6,2) default 1,
  unit text default 'serving',
  notes text,
  ai_analyzed boolean default false,
  created_at timestamptz default now()
);

-- ─── Workout Logs ─────────────────────────────────────────────────────────────
create table public.workout_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date default current_date not null,
  workout_name text not null,
  workout_type text not null,
  duration_minutes integer not null,
  calories_burned integer,
  intensity text check (intensity in ('low', 'medium', 'high')) default 'medium',
  notes text,
  created_at timestamptz default now()
);

-- ─── Goals ────────────────────────────────────────────────────────────────────
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  goal_type text check (goal_type in ('weight', 'calories', 'workout', 'water', 'custom')) not null,
  target_value decimal(8,2),
  current_value decimal(8,2) default 0,
  unit text,
  target_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- ─── Reminders ────────────────────────────────────────────────────────────────
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text,
  reminder_time time not null,
  days_of_week integer[] default '{1,2,3,4,5,6,7}',
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.goals enable row level security;
alter table public.reminders enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Food logs
create policy "Users can manage own food logs" on public.food_logs for all using (auth.uid() = user_id);

-- Workout logs
create policy "Users can manage own workout logs" on public.workout_logs for all using (auth.uid() = user_id);

-- Goals
create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);

-- Reminders
create policy "Users can manage own reminders" on public.reminders for all using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
