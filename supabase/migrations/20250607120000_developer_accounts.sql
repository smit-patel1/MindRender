/*
  # Developer accounts table and access policy

  1. New Tables
    - developer_accounts
      - email text primary key
      - created_at timestamptz default now()

  2. Security
    - Enable RLS
    - Policy for authenticated users to read their own row
*/

create table if not exists developer_accounts (
  email text primary key,
  created_at timestamptz default now()
);

alter table developer_accounts enable row level security;

create policy "Users can read own developer account"
  on developer_accounts for select
  to authenticated
  using (auth.jwt() ->> 'email' = email);
