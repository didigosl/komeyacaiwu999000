create table if not exists users(
  id serial primary key,
  name text unique not null,
  password_hash text not null,
  role text not null
);
create table if not exists ledger(
  id serial primary key,
  type text not null,
  category text not null,
  doc text not null,
  client text not null,
  amount numeric(18,2) not null,
  method text not null,
  file text,
  notes text,
  date text,
  date_time text,
  created_at bigint not null,
  created_by text
);
create table if not exists contacts(
  id serial primary key,
  type text not null,
  name text not null,
  company text,
  code text,
  contact text,
  phone text,
  city text,
  country text,
  address text,
  sales text,
  created text
);
create table if not exists payables(
  id serial primary key,
  type text not null,
  partner text not null,
  doc text not null,
  amount numeric(18,2) not null,
  paid numeric(18,2) default 0,
  settled boolean default false,
  trust_days int default 30,
  notes text,
  invoice_no text,
  invoice_date text,
  invoice_amount numeric(18,2),
  created_at bigint not null,
  history jsonb default '[]'::jsonb
);
