-- Kiểm thử nhắn tin riêng: chỉ người đã kết nối, chỉ 2 người xem được, chống trùng và spam
\set ON_ERROR_STOP on
set client_min_messages = warning;
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u::text,''), false); end $$;

-- 4 thành viên: A (đại lý), B (người bán dạo), C (người ngoài), D (đã kết nối với A nhưng không với B)
insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data) values
 ('11111111-0000-0000-0000-00000000000a','a@test.vn', now(), '{"adult_confirmed":true,"display_name":"Đại lý A"}'),
 ('11111111-0000-0000-0000-00000000000b','b@test.vn', now(), '{"adult_confirmed":true,"display_name":"Bán dạo B"}'),
 ('11111111-0000-0000-0000-00000000000c','c@test.vn', now(), '{"adult_confirmed":true,"display_name":"Người lạ C"}'),
 ('11111111-0000-0000-0000-00000000000d','d@test.vn', now(), '{"adult_confirmed":true,"display_name":"Đại lý D"}');
update public.profiles set adult_confirmed = true where email like '%@test.vn';
insert into public.connections(from_id, to_id, status) values
 ('11111111-0000-0000-0000-00000000000a','11111111-0000-0000-0000-00000000000b','accepted'),
 ('11111111-0000-0000-0000-00000000000d','11111111-0000-0000-0000-00000000000a','accepted'),
 ('11111111-0000-0000-0000-00000000000c','11111111-0000-0000-0000-00000000000b','pending');

set role authenticated;

-- M1: A mở trò chuyện với B (đã kết nối) -> được; mở lại -> cùng một cuộc, không trùng
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
do $$ declare c1 uuid; c2 uuid; begin
  c1 := public.open_conversation('11111111-0000-0000-0000-00000000000b');
  c2 := public.open_conversation('11111111-0000-0000-0000-00000000000b');
  assert c1 = c2, 'M1 FAIL: tạo trùng';
  perform set_config('t.conv', c1::text, false);
  raise notice 'M1 PASS: mở trò chuyện với người đã kết nối, không tạo trùng';
end $$;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000b');
do $$ begin
  assert public.open_conversation('11111111-0000-0000-0000-00000000000a') = current_setting('t.conv')::uuid, 'M1b FAIL: B mở ra cuộc khác';
end $$;

-- M2: C (chỉ mới gửi lời mời, chưa được đồng ý) không mở được trò chuyện với B
select pg_temp.as_user('11111111-0000-0000-0000-00000000000c');
do $$ begin
  begin perform public.open_conversation('11111111-0000-0000-0000-00000000000b');
    raise exception 'M2 FAIL';
  exception when others then if sqlerrm = 'M2 FAIL' then raise; end if; end;
  raise notice 'M2 PASS: chưa kết nối thì không nhắn tin được';
end $$;

-- M3: A gửi, B gửi; cả hai đọc được đúng 2 tin theo thứ tự thời gian
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
insert into public.messages(conversation_id, sender_id, body)
  values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000a', 'Chào em, mai đại lý mở cửa sớm nhé');
select pg_temp.as_user('11111111-0000-0000-0000-00000000000b');
insert into public.messages(conversation_id, sender_id, body)
  values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000b', 'Dạ em cảm ơn anh');
do $$ begin
  assert (select count(*) from public.messages where conversation_id = current_setting('t.conv')::uuid) = 2, 'M3 FAIL B';
  assert (select last_preview from public.conversations where id = current_setting('t.conv')::uuid) = 'Dạ em cảm ơn anh', 'M3 preview';
end $$;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
do $$ begin
  assert (select count(*) from public.messages where conversation_id = current_setting('t.conv')::uuid) = 2, 'M3 FAIL A';
  raise notice 'M3 PASS: hai bên gửi/nhận và xem lại được lịch sử';
end $$;

-- M4: người ngoài (C, D) không đọc được tin và cuộc trò chuyện
select pg_temp.as_user('11111111-0000-0000-0000-00000000000c');
do $$ begin
  assert (select count(*) from public.messages) = 0, 'M4 FAIL C đọc được tin';
  assert (select count(*) from public.conversations) = 0, 'M4 FAIL C thấy hội thoại';
end $$;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000d');
do $$ begin
  assert (select count(*) from public.messages) = 0, 'M4 FAIL D đọc được tin';
  raise notice 'M4 PASS: người không tham gia không xem được tin nhắn';
end $$;

-- M5: người ngoài không chèn tin vào cuộc trò chuyện của người khác, kể cả giả mạo người gửi
select pg_temp.as_user('11111111-0000-0000-0000-00000000000c');
do $$ begin
  begin insert into public.messages(conversation_id, sender_id, body)
      values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000c', 'xin chào');
    raise exception 'M5 FAIL';
  exception when others then if sqlerrm = 'M5 FAIL' then raise; end if; end;
  begin insert into public.messages(conversation_id, sender_id, body)
      values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000a', 'giả mạo');
    raise exception 'M5 FAIL giả mạo';
  exception when others then if sqlerrm like 'M5 FAIL%' then raise; end if; end;
  raise notice 'M5 PASS: không chèn hay giả mạo tin nhắn được';
end $$;

-- M6: không sửa/xóa trực tiếp hội thoại, không tự tạo hội thoại bỏ qua kiểm tra
select pg_temp.as_user('11111111-0000-0000-0000-00000000000c');
do $$ begin
  begin insert into public.conversations(user_a, user_b)
      values ('11111111-0000-0000-0000-00000000000b','11111111-0000-0000-0000-00000000000c');
    raise exception 'M6 FAIL';
  exception when others then if sqlerrm = 'M6 FAIL' then raise; end if; end;
  raise notice 'M6 PASS: không tự tạo hội thoại trái phép';
end $$;

-- M7: lọc nội dung cấm (mua bán vé, dự đoán số) trong tin nhắn
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
do $$ begin
  begin insert into public.messages(conversation_id, sender_id, body)
      values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000a', 'Có ai cần mua hộ vé không');
    raise exception 'M7 FAIL';
  exception when others then if sqlerrm = 'M7 FAIL' then raise; end if; end;
  raise notice 'M7 PASS: chặn nội dung không được phép';
end $$;

-- M8: chống spam — quá 15 tin/phút bị chặn; gửi cùng nội dung cho người khác bị chặn
do $$ declare i int; blocked boolean := false; begin
  for i in 1..20 loop
    begin insert into public.messages(conversation_id, sender_id, body)
        values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000a', 'tin số ' || i);
    exception when others then blocked := true; exit; end;
  end loop;
  assert blocked, 'M8 FAIL không chặn gửi nhanh';
  raise notice 'M8 PASS: chặn gửi tin dồn dập';
end $$;
reset role;
delete from public.messages where sender_id = '11111111-0000-0000-0000-00000000000a' and body like 'tin số %';
set role authenticated;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
do $$ declare c2 uuid; begin
  c2 := public.open_conversation('11111111-0000-0000-0000-00000000000d');
  begin insert into public.messages(conversation_id, sender_id, body)
      values (c2, '11111111-0000-0000-0000-00000000000a', 'Chào em, mai đại lý mở cửa sớm nhé');
    raise exception 'M8b FAIL';
  exception when others then if sqlerrm = 'M8b FAIL' then raise; end if; end;
  raise notice 'M8b PASS: không gửi cùng một nội dung cho nhiều người';
end $$;

-- M9: thông báo tin mới cho người nhận, không dồn nhiều thông báo cho cùng cuộc trò chuyện
select pg_temp.as_user('11111111-0000-0000-0000-00000000000b');
do $$ begin
  assert (select count(*) from public.notifications where type = 'message') = 1, 'M9 FAIL';
  raise notice 'M9 PASS: có thông báo tin nhắn mới';
end $$;

-- M10: hủy kết nối -> không gửi tin mới được, nhưng 2 người vẫn xem lại lịch sử
reset role;
delete from public.connections where from_id = '11111111-0000-0000-0000-00000000000a' and to_id = '11111111-0000-0000-0000-00000000000b';
set role authenticated;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000b');
do $$ begin
  begin insert into public.messages(conversation_id, sender_id, body)
      values (current_setting('t.conv')::uuid, '11111111-0000-0000-0000-00000000000b', 'còn đó không');
    raise exception 'M10 FAIL';
  exception when others then if sqlerrm = 'M10 FAIL' then raise; end if; end;
  assert (select count(*) from public.messages where conversation_id = current_setting('t.conv')::uuid) = 2, 'M10 lịch sử';
  raise notice 'M10 PASS: hết kết nối thì không gửi được tin mới';
end $$;

-- M11: khách chưa đăng nhập không đọc được gì
reset role;
set role anon;
do $$ begin
  begin perform count(*) from public.messages; raise exception 'M11 FAIL';
  exception when others then if sqlerrm = 'M11 FAIL' then raise; end if; end;
  raise notice 'M11 PASS: API công khai không lộ tin nhắn';
end $$;
reset role;

-- C1: gửi phản hồi (bình luận) vào bài đăng được; phản hồi có từ cấm bị chặn
set role authenticated;
select pg_temp.as_user('11111111-0000-0000-0000-00000000000a');
insert into public.posts(id, author_id, kind, title, body)
  values ('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-00000000000a','can_giup','Cần giúp chở hàng','Ai rảnh giúp tôi với');
select pg_temp.as_user('11111111-0000-0000-0000-00000000000b');
insert into public.comments(post_id, author_id, body)
  values ('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-00000000000b','alo, tôi giúp được');
do $$ begin
  assert (select count(*) from public.comments where post_id = '44444444-0000-0000-0000-000000000001') = 1, 'C1 FAIL';
  begin insert into public.comments(post_id, author_id, body)
      values ('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-00000000000b','ai mua hộ vé không');
    raise exception 'C1 FAIL từ cấm';
  exception when others then if sqlerrm like 'C1 FAIL%' then raise; end if; end;
  raise notice 'C1 PASS: gửi phản hồi được, phản hồi vi phạm bị chặn';
end $$;
reset role;
select 'MESSAGES TESTS PASSED' as result;
