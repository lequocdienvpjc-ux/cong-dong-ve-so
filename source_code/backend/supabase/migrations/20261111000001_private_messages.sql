-- =====================================================================
-- NHẮN TIN RIÊNG GIỮA THÀNH VIÊN ĐÃ KẾT NỐI
-- Chỉ THÊM bảng/hàm mới, không sửa hay xóa dữ liệu hiện có.
-- Khôi phục (gỡ bỏ): xem 20261111000001_private_messages_rollback.sql
-- =====================================================================

-- Hai người có đang kết nối (đã đồng ý) với nhau không
create or replace function public.are_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.connections c where c.status = 'accepted'
    and ((c.from_id = a and c.to_id = b) or (c.from_id = b and c.to_id = a)));
$$;
revoke all on function public.are_connected(uuid, uuid) from public, anon;
grant execute on function public.are_connected(uuid, uuid) to authenticated;

-- ---------- Cuộc trò chuyện: mỗi cặp thành viên chỉ có MỘT ----------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz,
  last_preview    text,
  last_sender     uuid,
  a_read_at       timestamptz,
  b_read_at       timestamptz,
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists conversations_a_idx on public.conversations(user_a, last_message_at desc);
create index if not exists conversations_b_idx on public.conversations(user_b, last_message_at desc);

-- ---------- Tin nhắn ----------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages(sender_id, created_at desc);

-- Người dùng có thuộc cuộc trò chuyện không
create or replace function public.is_participant(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversations c
    where c.id = p_conv and auth.uid() in (c.user_a, c.user_b));
$$;
revoke all on function public.is_participant(uuid) from public, anon;
grant execute on function public.is_participant(uuid) to authenticated;

-- Mở (hoặc lấy lại) cuộc trò chuyện với một thành viên ĐÃ KẾT NỐI
create or replace function public.open_conversation(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a uuid; b uuid; cid uuid;
begin
  if me is null then raise exception 'Bạn cần đăng nhập để nhắn tin'; end if;
  if p_other is null or p_other = me then raise exception 'Không thể nhắn tin cho chính mình'; end if;
  a := least(me, p_other); b := greatest(me, p_other);
  select id into cid from public.conversations where user_a = a and user_b = b;
  if cid is not null then return cid; end if;           -- đã có thì dùng lại, không tạo trùng
  if not public.is_active_member() then raise exception 'Tài khoản của bạn đang bị khóa hoặc chưa hoàn tất'; end if;
  if not public.are_connected(me, p_other) then
    raise exception 'Chỉ nhắn tin được với người đã kết nối. Hãy gửi yêu cầu kết nối trước.';
  end if;
  insert into public.conversations(user_a, user_b) values (a, b)
    on conflict (user_a, user_b) do nothing returning id into cid;
  if cid is null then select id into cid from public.conversations where user_a = a and user_b = b; end if;
  return cid;
end $$;
revoke all on function public.open_conversation(uuid) from public, anon;
grant execute on function public.open_conversation(uuid) to authenticated;

-- Đánh dấu đã đọc
create or replace function public.mark_conversation_read(p_conv uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversations
     set a_read_at = case when user_a = auth.uid() then now() else a_read_at end,
         b_read_at = case when user_b = auth.uid() then now() else b_read_at end
   where id = p_conv and auth.uid() in (user_a, user_b);
$$;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Kiểm tra trước khi gửi: còn kết nối, chống spam, lọc nội dung cấm
create or replace function public.messages_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record; other uuid; n_min int; n_hour int; n_conv int;
begin
  select * into c from public.conversations where id = new.conversation_id;
  if c.id is null or new.sender_id not in (c.user_a, c.user_b) then
    raise exception 'Bạn không thuộc cuộc trò chuyện này';
  end if;
  other := case when new.sender_id = c.user_a then c.user_b else c.user_a end;
  if not public.are_connected(new.sender_id, other) then
    raise exception 'Hai bạn không còn kết nối nên không gửi được tin nhắn mới.';
  end if;
  new.body := btrim(new.body);
  new.created_at := now();
  -- Chống spam: tối đa 15 tin/phút, 200 tin/giờ, nhắn tới tối đa 20 người khác nhau/giờ
  select count(*) into n_min from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute';
  if n_min >= 15 then raise exception 'Bạn gửi quá nhanh. Vui lòng chờ một chút rồi gửi tiếp.'; end if;
  select count(*), count(distinct conversation_id) into n_hour, n_conv
    from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 hour';
  if n_hour >= 200 then raise exception 'Bạn đã gửi quá nhiều tin nhắn trong 1 giờ. Vui lòng thử lại sau.'; end if;
  if n_conv >= 20 and not exists(select 1 from public.messages m where m.sender_id = new.sender_id
       and m.conversation_id = new.conversation_id and m.created_at > now() - interval '1 hour') then
    raise exception 'Bạn đã nhắn cho quá nhiều người trong 1 giờ. Ứng dụng không cho phép gửi tin hàng loạt.';
  end if;
  -- Tin giống hệt tin vừa gửi trong 1 phút ở cuộc trò chuyện khác → nghi gửi hàng loạt
  if exists(select 1 from public.messages m where m.sender_id = new.sender_id and m.body = new.body
       and m.conversation_id <> new.conversation_id and m.created_at > now() - interval '10 minutes') then
    raise exception 'Không gửi cùng một nội dung cho nhiều người. Ứng dụng không cho phép gửi tin hàng loạt.';
  end if;
  return new;
end $$;
drop trigger if exists messages_check on public.messages;
create trigger messages_check before insert on public.messages
  for each row execute function public.messages_before_insert();
-- Lọc nội dung cấm (dùng chung danh sách từ khóa với bài đăng)
create or replace function public.check_banned_words_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare w text;
begin
  for w in select word from public.banned_words loop
    if position(lower(w) in lower(new.body)) > 0 then
      raise exception 'Nội dung có cụm từ không được phép: "%". Ứng dụng không cho phép dự đoán kết quả hoặc mua bán vé.', w;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists messages_banned on public.messages;
create trigger messages_banned before insert on public.messages
  for each row execute function public.check_banned_words_message();

-- Sau khi gửi: cập nhật tin gần nhất + thông báo cho người nhận (không dồn nhiều thông báo)
create or replace function public.messages_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record; other uuid; n text; lnk text;
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_preview = left(new.body, 120),
         last_sender = new.sender_id,
         a_read_at = case when user_a = new.sender_id then new.created_at else a_read_at end,
         b_read_at = case when user_b = new.sender_id then new.created_at else b_read_at end
   where id = new.conversation_id
  returning * into c;
  other := case when new.sender_id = c.user_a then c.user_b else c.user_a end;
  lnk := '/tin-nhan/' || new.conversation_id;
  if not exists(select 1 from public.notifications where user_id = other and link = lnk and read_at is null) then
    select display_name into n from public.profiles where id = new.sender_id;
    insert into public.notifications(user_id, type, title, body, link)
    values (other, 'message', 'Tin nhắn mới từ ' || coalesce(n, 'thành viên'), left(new.body, 120), lnk);
  end if;
  return new;
end $$;
drop trigger if exists messages_after on public.messages;
create trigger messages_after after insert on public.messages
  for each row execute function public.messages_after_insert();

-- ---------- Bảo mật theo dòng: CHỈ hai người trong cuộc trò chuyện ----------
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists conv_read on public.conversations;
create policy conv_read on public.conversations for select to authenticated
  using (auth.uid() in (user_a, user_b));
-- Không có policy insert/update/delete: chỉ tạo/cập nhật qua hàm kiểm soát ở trên

drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select to authenticated
  using (public.is_participant(conversation_id));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_active_member() and public.is_participant(conversation_id));

revoke all on public.conversations, public.messages from anon, authenticated, public;
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- Cập nhật tức thời (realtime) — vẫn tuân theo RLS ở trên
do $$ begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table public.messages';
    exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.conversations';
    exception when duplicate_object then null; end;
  end if;
end $$;
