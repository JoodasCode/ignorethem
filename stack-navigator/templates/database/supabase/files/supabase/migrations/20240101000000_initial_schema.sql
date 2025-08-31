-- Initial database schema
-- This is an example migration file. Customize it for your application needs.

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Example: Users table (if not using Supabase Auth)
-- create table public.users (
--   id uuid default uuid_generate_v4() primary key,
--   email text unique not null,
--   name text,
--   avatar_url text,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- Example: Posts table
-- create table public.posts (
--   id uuid default uuid_generate_v4() primary key,
--   title text not null,
--   content text,
--   author_id uuid references public.users(id) on delete cascade,
--   published boolean default false,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- Example: Comments table
-- create table public.comments (
--   id uuid default uuid_generate_v4() primary key,
--   content text not null,
--   post_id uuid references public.posts(id) on delete cascade,
--   author_id uuid references public.users(id) on delete cascade,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- Enable Row Level Security (RLS)
-- alter table public.users enable row level security;
-- alter table public.posts enable row level security;
-- alter table public.comments enable row level security;

-- Example RLS policies
-- Users can view their own profile
-- create policy "Users can view own profile" on public.users
--   for select using (auth.uid() = id);

-- Users can update their own profile
-- create policy "Users can update own profile" on public.users
--   for update using (auth.uid() = id);

-- Anyone can view published posts
-- create policy "Anyone can view published posts" on public.posts
--   for select using (published = true);

-- Authors can manage their own posts
-- create policy "Authors can manage own posts" on public.posts
--   for all using (auth.uid() = author_id);

-- Anyone can view comments on published posts
-- create policy "Anyone can view comments" on public.comments
--   for select using (
--     exists (
--       select 1 from public.posts
--       where posts.id = comments.post_id
--       and posts.published = true
--     )
--   );

-- Comment authors can manage their own comments
-- create policy "Authors can manage own comments" on public.comments
--   for all using (auth.uid() = author_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Example: Apply updated_at trigger to tables
-- create trigger handle_updated_at before update on public.users
--   for each row execute procedure public.handle_updated_at();

-- create trigger handle_updated_at before update on public.posts
--   for each row execute procedure public.handle_updated_at();

-- create trigger handle_updated_at before update on public.comments
--   for each row execute procedure public.handle_updated_at();