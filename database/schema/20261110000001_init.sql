-- =====================================================================
-- CỘNG ĐỒNG VÉ SỐ — Lược đồ cơ sở dữ liệu (Supabase / PostgreSQL)
-- Phạm vi: thông tin cộng đồng, bản đồ, kết nối, tương trợ.
-- KHÔNG có bảng/chức năng mua bán, thanh toán, giao, phân phối vé số.
-- =====================================================================

-- ---------- 1. Cấu hình hệ thống (1 dòng duy nhất) ----------
create table if not exists public.app_config (
  id               int primary key default 1 check (id = 1),
  owner_email      text,                 -- email chủ sở hữu, nạp lúc triển khai
  bootstrap_locked boolean not null default false,
  bootstrapped_at  timestamptz,
  min_age          int not null default 18,
  android_version  text default '1.0.0',
  android_apk_url  text,
  announcement     text,
  registration_open boolean not null default true,
  updated_at       timestamptz not null default now()
);
insert into public.app_config (id) values (1) on conflict do nothing;

-- ---------- 2. Hồ sơ thành viên ----------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  display_name   text not null default 'Thành viên',
  avatar_url     text,
  phone          text,
  show_phone     boolean not null default false,
  province       text,
  district       text,
  ward           text,
  area_note      text,                  -- khu vực hoạt động
  bio            text check (char_length(bio) <= 500),
  roles          text[] not null default '{}',
  -- dai_ly_lon, dai_ly_cap_duoi, ban_dao, ban_co_dinh, nguoi_mua, ho_tro
  need_status    text not null default 'none' check (need_status in ('none','can_ho_tro','muon_ho_tro')),
  active_status  text not null default 'active' check (active_status in ('active','busy','away')),
  lat            double precision,
  lng            double precision,
  show_location  boolean not null default false,
  adult_confirmed boolean not null default false,
  admin_role     text not null default 'member' check (admin_role in ('member','moderator','admin','super_admin')),
  is_locked      boolean not null default false,
  lock_reason    text,
  notify_connections boolean not null default true,
  notify_replies     boolean not null default true,
  notify_support     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists profiles_province_idx on public.profiles(province);

-- Ảnh hưởng quyền riêng tư: bản xem công khai chỉ lộ SĐT / vị trí khi người dùng đồng ý,
-- và vị trí được làm tròn (~500 m).
create or replace view public.public_profiles
with (security_invoker = false) as
select id, display_name, avatar_url,
       case when show_phone then phone end as phone,
       province, district, ward, area_note, bio, roles, need_status, active_status,
       case when show_location then round(lat::numeric, 3)::float8 end as lat,
       case when show_location then round(lng::numeric, 3)::float8 end as lng,
       created_at
from public.profiles
where not is_locked and adult_confirmed;

-- ---------- 3. Điểm cộng đồng: đại lý / điểm bán cố định ----------
create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('dai_ly','diem_ban')),
  name        text not null check (char_length(name) between 2 and 120),
  address     text,
  province    text,
  district    text,
  lat         double precision,
  lng         double precision,
  phone       text,
  open_hours  text,
  note        text check (char_length(note) <= 500),
  status      text not null default 'visible' check (status in ('visible','hidden')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists places_province_idx on public.places(province);

-- ---------- 4. Bài đăng tương trợ ----------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('can_giup','muon_giup','kinh_nghiem','thong_tin')),
  title       text not null check (char_length(title) between 3 and 150),
  body        text not null check (char_length(body) between 3 and 3000),
  province    text,
  status      text not null default 'visible' check (status in ('visible','hidden','removed')),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  status      text not null default 'visible' check (status in ('visible','hidden','removed')),
  created_at  timestamptz not null default now()
);

-- ---------- 5. Kết nối ----------
create table if not exists public.connections (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references public.profiles(id) on delete cascade,
  to_id       uuid not null references public.profiles(id) on delete cascade,
  message     text check (char_length(message) <= 300),
  status      text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at  timestamptz not null default now(),
  responded_at timestamptz,
  unique (from_id, to_id),
  check (from_id <> to_id)
);

-- ---------- 6. Báo cáo vi phạm ----------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','profile','place')),
  target_id   uuid not null,
  reason      text not null check (reason in ('lua_dao','mua_ban_ve','du_doan_so','xuc_pham','thong_tin_sai','khac')),
  detail      text check (char_length(detail) <= 1000),
  status      text not null default 'open' check (status in ('open','resolved','dismissed')),
  handled_by  uuid references public.profiles(id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- 7. Thông báo ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- ---------- 8. Từ khóa cấm & nhật ký quản trị ----------
create table if not exists public.banned_words (
  word text primary key
);
insert into public.banned_words(word) values
  ('soi cầu'),('soi cau'),('dự đoán xổ số'),('du doan xo so'),('bao lô'),('bao lo'),
  ('số đẹp hôm nay'),('chốt số'),('chot so'),('lô đề'),('lo de'),('đánh đề'),('danh de'),
  ('bán vé online'),('ban ve online'),('mua hộ vé'),('mua ho ve'),('chuyển khoản mua vé'),
  ('giao vé tận nhà'),('giao ve tan nha')
on conflict do nothing;

create table if not exists public.admin_audit (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  target     text,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- HÀM PHÂN QUYỀN (chạy phía server)
-- =====================================================================
create or replace function public.current_admin_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select admin_role from public.profiles where id = auth.uid() and not is_locked), 'none');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_admin_role() in ('moderator','admin','super_admin');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_admin_role() in ('admin','super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_admin_role() = 'super_admin';
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and not is_locked and adult_confirmed);
$$;

-- =====================================================================
-- KHỞI TẠO SUPER ADMIN AN TOÀN
-- Chỉ cấp khi: email trùng owner_email + email đã xác minh + chưa có
-- super_admin + chưa khóa bootstrap. Cấp xong khóa vĩnh viễn.
-- =====================================================================
create or replace function public.try_bootstrap_super_admin(p_user uuid, p_email text, p_confirmed timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare cfg public.app_config%rowtype;
begin
  if p_confirmed is null then return; end if;
  select * into cfg from public.app_config where id = 1 for update;
  if cfg.bootstrap_locked or cfg.owner_email is null then return; end if;
  if lower(trim(p_email)) <> lower(trim(cfg.owner_email)) then return; end if;
  if exists (select 1 from public.profiles where admin_role = 'super_admin') then
    update public.app_config set bootstrap_locked = true where id = 1;
    return;
  end if;
  update public.profiles set admin_role = 'super_admin', adult_confirmed = true where id = p_user;
  update public.app_config set bootstrap_locked = true, bootstrapped_at = now() where id = 1;
  insert into public.admin_audit(actor_id, action, target, detail)
    values (p_user, 'bootstrap_super_admin', p_user::text, jsonb_build_object('email', p_email));
end $$;
revoke all on function public.try_bootstrap_super_admin(uuid, text, timestamptz) from public, anon, authenticated;

-- Tạo hồ sơ khi có người dùng mới
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, adult_confirmed)
  values (
    new.id, new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
             nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
             split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'adult_confirmed')::boolean, false)
  ) on conflict (id) do nothing;
  perform public.try_bootstrap_super_admin(new.id, new.email, new.email_confirmed_at);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    perform public.try_bootstrap_super_admin(new.id, new.email, new.email_confirmed_at);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Chặn người dùng tự sửa các cột đặc quyền
create or replace function public.protect_profile_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
  if new.email is distinct from old.email then
    raise exception 'Không được sửa email tại đây';
  end if;
  if new.admin_role is distinct from old.admin_role then
    if not public.is_super_admin() then raise exception 'Chỉ SUPER ADMIN được phân quyền'; end if;
    if old.admin_role = 'super_admin' or new.admin_role = 'super_admin' then
      raise exception 'Không thay đổi được quyền SUPER ADMIN';
    end if;
    if new.id = auth.uid() then raise exception 'Không tự đổi quyền của chính mình'; end if;
  end if;
  if new.is_locked is distinct from old.is_locked or new.lock_reason is distinct from old.lock_reason then
    if not public.is_admin() then raise exception 'Không có quyền khóa/mở tài khoản'; end if;
    if old.admin_role = 'super_admin' then raise exception 'Không thể khóa SUPER ADMIN'; end if;
    if new.id = auth.uid() then raise exception 'Không tự khóa chính mình'; end if;
  end if;
  -- đã xác nhận đủ tuổi thì không gỡ lại được bằng giao diện
  if old.adult_confirmed and not new.adult_confirmed then new.adult_confirmed := true; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Phân quyền: chỉ SUPER ADMIN
create or replace function public.set_admin_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Chỉ SUPER ADMIN được phân quyền'; end if;
  if p_role not in ('member','moderator','admin') then raise exception 'Vai trò không hợp lệ'; end if;
  if p_user = auth.uid() then raise exception 'Không tự đổi quyền của chính mình'; end if;
  if exists(select 1 from public.profiles where id = p_user and admin_role = 'super_admin') then
    raise exception 'Không đổi quyền SUPER ADMIN';
  end if;
  update public.profiles set admin_role = p_role where id = p_user;
  insert into public.admin_audit(actor_id, action, target, detail)
    values (auth.uid(), 'set_admin_role', p_user::text, jsonb_build_object('role', p_role));
end $$;
revoke all on function public.set_admin_role(uuid, text) from public, anon;
grant execute on function public.set_admin_role(uuid, text) to authenticated;

-- Khóa / mở khóa tài khoản: admin trở lên
create or replace function public.set_user_lock(p_user uuid, p_locked boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Không có quyền'; end if;
  if exists(select 1 from public.profiles where id = p_user and admin_role = 'super_admin') then
    raise exception 'Không thể khóa SUPER ADMIN';
  end if;
  if p_user = auth.uid() then raise exception 'Không tự khóa chính mình'; end if;
  update public.profiles set is_locked = p_locked, lock_reason = case when p_locked then p_reason end
   where id = p_user;
  insert into public.admin_audit(actor_id, action, target, detail)
    values (auth.uid(), case when p_locked then 'lock_user' else 'unlock_user' end, p_user::text,
            jsonb_build_object('reason', p_reason));
end $$;
revoke all on function public.set_user_lock(uuid, boolean, text) from public, anon;
grant execute on function public.set_user_lock(uuid, boolean, text) to authenticated;

-- Ghi nhật ký thao tác kiểm duyệt
create or replace function public.log_admin(p_action text, p_target text, p_detail jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Không có quyền'; end if;
  insert into public.admin_audit(actor_id, action, target, detail) values (auth.uid(), p_action, p_target, p_detail);
end $$;
grant execute on function public.log_admin(text, text, jsonb) to authenticated;

-- =====================================================================
-- LỌC NỘI DUNG CẤM (dự đoán số, mua bán vé)
-- =====================================================================
create or replace function public.check_banned_words()
returns trigger language plpgsql security definer set search_path = public as $$
declare txt text; w text;
begin
  txt := lower(coalesce(case when tg_table_name = 'posts' then new.title || ' ' || new.body else new.body end, ''));
  for w in select word from public.banned_words loop
    if position(lower(w) in txt) > 0 then
      raise exception 'Nội dung có cụm từ không được phép: "%". Ứng dụng không cho phép dự đoán kết quả hoặc mua bán vé.', w;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists posts_banned on public.posts;
create trigger posts_banned before insert or update of title, body on public.posts
  for each row execute function public.check_banned_words();
drop trigger if exists comments_banned on public.comments;
create trigger comments_banned before insert or update of body on public.comments
  for each row execute function public.check_banned_words();

-- =====================================================================
-- TÌM GẦN TÔI (haversine, km)
-- =====================================================================
create or replace function public.distance_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

-- Trả về cả điểm (đại lý/điểm bán) và thành viên công khai vị trí
create or replace function public.nearby(p_lat float8, p_lng float8, p_radius_km float8 default 10,
                                         p_kind text default null, p_province text default null, p_limit int default 200)
returns table (item_type text, id uuid, owner_id uuid, kind text, name text, phone text, address text,
               province text, lat float8, lng float8, distance_km float8, note text)
language sql stable security definer set search_path = public as $$
  with pts as (
    select 'place'::text as item_type, p.id, p.owner_id, p.kind, p.name,
           p.phone, p.address, p.province, p.lat, p.lng, p.note
    from public.places p join public.profiles o on o.id = p.owner_id
    where p.status = 'visible' and not o.is_locked and p.lat is not null
    union all
    select 'member', pp.id, pp.id,
           case when pp.need_status = 'can_ho_tro' then 'can_ho_tro'
                when pp.need_status = 'muon_ho_tro' then 'muon_ho_tro'
                when 'ban_dao' = any(pp.roles) then 'ban_dao'
                when 'ban_co_dinh' = any(pp.roles) then 'ban_co_dinh'
                when 'dai_ly_lon' = any(pp.roles) or 'dai_ly_cap_duoi' = any(pp.roles) then 'dai_ly'
                else 'thanh_vien' end,
           pp.display_name, pp.phone, coalesce(pp.ward || ', ', '') || coalesce(pp.district, ''),
           pp.province, pp.lat, pp.lng, pp.bio
    from public.public_profiles pp where pp.lat is not null
  )
  select item_type, id, owner_id, kind, name, phone, address, province, lat, lng,
         case when p_lat is null then null else public.distance_km(p_lat, p_lng, lat, lng) end as distance_km, note
  from pts
  where (p_kind is null or kind = p_kind)
    and (p_province is null or province = p_province)
    and (p_lat is null or public.distance_km(p_lat, p_lng, lat, lng) <= p_radius_km)
  order by distance_km nulls last, name
  limit least(p_limit, 500);
$$;
grant execute on function public.nearby(float8, float8, float8, text, text, int) to anon, authenticated;

-- =====================================================================
-- THÔNG BÁO TỰ ĐỘNG
-- =====================================================================
create or replace function public.notify_on_connection()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if tg_op = 'INSERT' then
    select display_name into n from public.profiles where id = new.from_id;
    insert into public.notifications(user_id, type, title, body, link)
    select new.to_id, 'connection', n || ' muốn kết nối với bạn', new.message, '/ket-noi'
    where exists(select 1 from public.profiles where id = new.to_id and notify_connections);
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    select display_name into n from public.profiles where id = new.to_id;
    insert into public.notifications(user_id, type, title, body, link)
    select new.from_id, 'connection', n || ' đã đồng ý kết nối', null, '/thanh-vien/' || new.to_id
    where exists(select 1 from public.profiles where id = new.from_id and notify_connections);
  end if;
  return new;
end $$;
drop trigger if exists connections_notify on public.connections;
create trigger connections_notify after insert or update of status on public.connections
  for each row execute function public.notify_on_connection();

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; n text;
begin
  select * into p from public.posts where id = new.post_id;
  if p.author_id <> new.author_id then
    select display_name into n from public.profiles where id = new.author_id;
    insert into public.notifications(user_id, type, title, body, link)
    select p.author_id, 'reply', n || ' đã phản hồi bài: ' || left(p.title, 60), left(new.body, 120), '/bai/' || p.id
    where exists(select 1 from public.profiles where id = p.author_id and notify_replies);
  end if;
  return new;
end $$;
drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Bài "cần giúp" mới → báo cho người "muốn hỗ trợ" cùng tỉnh
create or replace function public.notify_on_help_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'can_giup' and new.province is not null then
    insert into public.notifications(user_id, type, title, body, link)
    select pr.id, 'support', 'Có người cần hỗ trợ ở ' || new.province, left(new.title, 120), '/bai/' || new.id
    from public.profiles pr
    where pr.id <> new.author_id and pr.province = new.province and pr.notify_support
      and (pr.need_status = 'muon_ho_tro' or 'ho_tro' = any(pr.roles)) and not pr.is_locked
    limit 500;
  end if;
  return new;
end $$;
drop trigger if exists posts_notify on public.posts;
create trigger posts_notify after insert on public.posts
  for each row execute function public.notify_on_help_post();

-- =====================================================================
-- THỐNG KÊ CHO QUẢN TRỊ
-- =====================================================================
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Không có quyền'; end if;
  return jsonb_build_object(
    'members', (select count(*) from profiles),
    'locked', (select count(*) from profiles where is_locked),
    'new_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'dai_ly', (select count(*) from profiles where roles && array['dai_ly_lon','dai_ly_cap_duoi']),
    'ban_dao', (select count(*) from profiles where 'ban_dao' = any(roles)),
    'ban_co_dinh', (select count(*) from profiles where 'ban_co_dinh' = any(roles)),
    'nguoi_mua', (select count(*) from profiles where 'nguoi_mua' = any(roles)),
    'ho_tro', (select count(*) from profiles where 'ho_tro' = any(roles) or need_status = 'muon_ho_tro'),
    'can_ho_tro', (select count(*) from profiles where need_status = 'can_ho_tro'),
    'places', (select count(*) from places),
    'posts', (select count(*) from posts),
    'posts_7d', (select count(*) from posts where created_at > now() - interval '7 days'),
    'help_open', (select count(*) from posts where kind = 'can_giup' and not resolved and status = 'visible'),
    'comments', (select count(*) from comments),
    'connections', (select count(*) from connections where status = 'accepted'),
    'reports_open', (select count(*) from reports where status = 'open'),
    'by_province', (select coalesce(jsonb_object_agg(coalesce(province,'(chưa ghi)'), c), '{}'::jsonb)
                    from (select province, count(*) c from profiles group by province order by c desc limit 20) t),
    'signups_by_day', (select coalesce(jsonb_object_agg(d, c), '{}'::jsonb)
                    from (select to_char(created_at::date,'YYYY-MM-DD') d, count(*) c from profiles
                          where created_at > now() - interval '30 days' group by 1 order by 1) t)
  );
end $$;
grant execute on function public.admin_stats() to authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.app_config     enable row level security;
alter table public.profiles       enable row level security;
alter table public.places         enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.connections    enable row level security;
alter table public.reports        enable row level security;
alter table public.notifications  enable row level security;
alter table public.banned_words   enable row level security;
alter table public.admin_audit    enable row level security;

-- app_config: ai cũng đọc phần công khai qua view; chỉ admin sửa
drop policy if exists cfg_admin_read on public.app_config;
create policy cfg_admin_read on public.app_config for select using (public.is_staff());
drop policy if exists cfg_admin_write on public.app_config;
create policy cfg_admin_write on public.app_config for update using (public.is_admin())
  with check (public.is_admin());
create or replace view public.public_config as
  select android_version, android_apk_url, announcement, registration_open, min_age from public.app_config;
grant select on public.public_config to anon, authenticated;

-- Không cho admin thường đổi owner_email / cờ bootstrap
create or replace function public.protect_config()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
  if new.owner_email is distinct from old.owner_email
     or new.bootstrap_locked is distinct from old.bootstrap_locked
     or new.bootstrapped_at is distinct from old.bootstrapped_at then
    raise exception 'Không được sửa cấu hình khởi tạo quản trị';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists config_protect on public.app_config;
create trigger config_protect before update on public.app_config
  for each row execute function public.protect_config();

-- profiles
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
grant select on public.public_profiles to anon, authenticated;

-- places
drop policy if exists places_read on public.places;
create policy places_read on public.places for select
  using (status = 'visible' or owner_id = auth.uid() or public.is_staff());
drop policy if exists places_insert on public.places;
create policy places_insert on public.places for insert with check (owner_id = auth.uid() and public.is_active_member());
drop policy if exists places_update on public.places;
create policy places_update on public.places for update
  using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());
drop policy if exists places_delete on public.places;
create policy places_delete on public.places for delete using (owner_id = auth.uid() or public.is_admin());

-- posts
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select
  using (status = 'visible' or author_id = auth.uid() or public.is_staff());
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (author_id = auth.uid() and public.is_active_member());
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update
  using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (author_id = auth.uid() or public.is_admin());

-- comments
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select
  using (status = 'visible' or author_id = auth.uid() or public.is_staff());
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (author_id = auth.uid() and public.is_active_member());
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update
  using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete using (author_id = auth.uid() or public.is_admin());

-- connections
drop policy if exists conn_read on public.connections;
create policy conn_read on public.connections for select
  using (from_id = auth.uid() or to_id = auth.uid() or public.is_staff());
drop policy if exists conn_insert on public.connections;
create policy conn_insert on public.connections for insert with check (from_id = auth.uid() and public.is_active_member());
drop policy if exists conn_update on public.connections;
create policy conn_update on public.connections for update using (to_id = auth.uid()) with check (to_id = auth.uid());
drop policy if exists conn_delete on public.connections;
create policy conn_delete on public.connections for delete using (from_id = auth.uid() or to_id = auth.uid());

-- Chỉ thấy SĐT người đã kết nối (kể cả khi họ không công khai) — qua hàm riêng
create or replace function public.contact_of(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select phone from public.profiles pr
  where pr.id = p_user and (pr.show_phone or exists(
    select 1 from public.connections c where c.status = 'accepted'
      and ((c.from_id = auth.uid() and c.to_id = p_user) or (c.to_id = auth.uid() and c.from_id = p_user))));
$$;
grant execute on function public.contact_of(uuid) to authenticated;

-- reports
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select using (reporter_id = auth.uid() or public.is_staff());
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update using (public.is_staff()) with check (public.is_staff());

-- notifications
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete using (user_id = auth.uid());
drop policy if exists notif_admin_insert on public.notifications;
create policy notif_admin_insert on public.notifications for insert with check (public.is_admin());

-- Thông báo hệ thống gửi toàn bộ thành viên (admin)
create or replace function public.broadcast(p_title text, p_body text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Không có quyền'; end if;
  insert into public.notifications(user_id, type, title, body)
    select id, 'system', p_title, p_body from public.profiles where not is_locked;
  get diagnostics n = row_count;
  insert into public.admin_audit(actor_id, action, detail) values (auth.uid(), 'broadcast', jsonb_build_object('title', p_title, 'count', n));
  return n;
end $$;
grant execute on function public.broadcast(text, text) to authenticated;

-- banned_words / audit
drop policy if exists bw_read on public.banned_words;
create policy bw_read on public.banned_words for select using (public.is_staff());
drop policy if exists bw_write on public.banned_words;
create policy bw_write on public.banned_words for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists audit_read on public.admin_audit;
create policy audit_read on public.admin_audit for select using (public.is_admin());

-- =====================================================================
-- LƯU TRỮ ẢNH ĐẠI DIỆN
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists avatars_write on storage.objects;
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- QUYỀN TRUY CẬP API (khai báo rõ, không phụ thuộc cấu hình mặc định)
-- RLS ở trên quyết định từng dòng dữ liệu được đọc/ghi.
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.public_profiles, public.public_config to anon, authenticated;
grant select on public.places, public.posts, public.comments to anon;
grant select, insert, update, delete on public.profiles, public.places, public.posts, public.comments,
  public.connections, public.reports, public.notifications, public.banned_words to authenticated;
grant select, update on public.app_config to authenticated;
grant select on public.admin_audit to authenticated;
revoke insert, delete on public.profiles from authenticated;

-- Quyền xóa dữ liệu cá nhân (Luật BVDLCN 2025): người dùng tự xóa tài khoản
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if exists(select 1 from public.profiles where id = auth.uid() and admin_role = 'super_admin') then
    raise exception 'SUPER ADMIN không thể tự xóa tài khoản';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
