begin;

alter table public.sponsors
  add column if not exists "offsetX" numeric(5,2) not null default 0 check ("offsetX" between -30 and 30),
  add column if not exists "offsetY" numeric(5,2) not null default 0 check ("offsetY" between -30 and 30),
  add column if not exists "fitMode" varchar(16) not null default 'cover' check ("fitMode" in ('cover', 'contain'));

commit;
