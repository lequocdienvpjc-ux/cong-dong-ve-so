-- Kiểm thử bảo mật: khởi tạo SUPER ADMIN, chiếm quyền, RLS, lọc nội dung
\set ON_ERROR_STOP on
set client_min_messages = warning;
update public.app_config set owner_email = 'dienlq779@gmail.com' where id = 1;

-- Hàm trợ giúp: chạy với tư cách người dùng
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u::text,''), false); end $$;

-- T1: kẻ gian đăng ký TRƯỚC, đã xác minh -> không được quyền
insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-00000000000a','hacker@evil.com', now(), '{"adult_confirmed":true}');
do $$ begin
  assert (select admin_role from public.profiles where email='hacker@evil.com') = 'member', 'T1 FAIL';
  assert not (select bootstrap_locked from public.app_config), 'T1 lock should still be open';
  raise notice 'T1 PASS: đăng ký trước không chiếm được quyền';
end $$;

-- T2: email chủ sở hữu nhưng CHƯA xác minh -> chưa cấp
insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000b1','DienLQ779@gmail.com', null, '{"adult_confirmed":true,"display_name":"Diễn"}');
do $$ begin
  assert (select admin_role from public.profiles where id='00000000-0000-0000-0000-0000000000b1') = 'member', 'T2 FAIL';
  raise notice 'T2 PASS: chưa xác minh email thì chưa cấp quyền';
end $$;

-- T3: chủ sở hữu xác minh email -> SUPER ADMIN, khóa bootstrap
update auth.users set email_confirmed_at = now() where id='00000000-0000-0000-0000-0000000000b1';
do $$ begin
  assert (select admin_role from public.profiles where id='00000000-0000-0000-0000-0000000000b1') = 'super_admin', 'T3 FAIL';
  assert (select bootstrap_locked from public.app_config), 'T3 lock FAIL';
  raise notice 'T3 PASS: chủ sở hữu thành SUPER ADMIN, cơ chế khởi tạo đã khóa';
end $$;

-- T4: tài khoản thứ 2 cùng email (giả lập) sau khi khóa -> không được quyền
insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000c1','dienlq779@gmail.com', now(), '{"adult_confirmed":true}');
do $$ begin
  assert (select admin_role from public.profiles where id='00000000-0000-0000-0000-0000000000c1') = 'member', 'T4 FAIL';
  raise notice 'T4 PASS: sau khi khóa không ai được tự động cấp quyền';
end $$;

-- T5..T9 chạy với vai trò authenticated
set role authenticated;

-- T5: thành viên tự nâng quyền -> bị chặn
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  begin
    update public.profiles set admin_role='super_admin' where id = auth.uid();
    raise exception 'T5 FAIL: tự nâng quyền được';
  exception when others then
    if sqlerrm like 'T5 FAIL%' then raise; end if;
    raise notice 'T5 PASS: thành viên không tự nâng quyền (%)', sqlerrm;
  end;
end $$;

-- T6: thành viên gọi hàm phân quyền -> bị chặn
do $$ begin
  begin
    perform public.set_admin_role('00000000-0000-0000-0000-00000000000a','admin');
    raise exception 'T6 FAIL';
  exception when others then
    if sqlerrm like 'T6 FAIL%' then raise; end if;
    raise notice 'T6 PASS: chỉ SUPER ADMIN được phân quyền';
  end;
end $$;

-- T7: thành viên sửa app_config (owner_email) -> bị chặn (RLS: 0 dòng)
do $$ declare n int; begin
  update public.app_config set owner_email='hacker@evil.com', bootstrap_locked=false where id=1;
  get diagnostics n = row_count;
  assert n = 0, 'T7 FAIL';
  raise notice 'T7 PASS: thành viên không sửa được cấu hình';
end $$;

-- T8: bài đăng dự đoán số -> bị chặn; bài hợp lệ -> được
do $$ begin
  begin
    insert into public.posts(author_id, kind, title, body) values (auth.uid(), 'thong_tin', 'Soi cầu hôm nay', 'chốt số đẹp');
    raise exception 'T8 FAIL';
  exception when others then
    if sqlerrm like 'T8 FAIL%' then raise; end if;
    raise notice 'T8 PASS: chặn nội dung dự đoán số';
  end;
  insert into public.posts(author_id, kind, title, body, province) values (auth.uid(), 'can_giup', 'Cần người giúp sửa xe lăn', 'Xe lăn bị hỏng bánh', 'Bình Dương');
  raise notice 'T8b PASS: bài hợp lệ đăng được';
end $$;

-- T9: SUPER ADMIN phân quyền, khóa tài khoản; không tự khóa mình
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  perform public.set_admin_role('00000000-0000-0000-0000-00000000000a','moderator');
  assert (select admin_role from public.profiles where id='00000000-0000-0000-0000-00000000000a')='moderator', 'T9 FAIL role';
  perform public.set_user_lock('00000000-0000-0000-0000-00000000000a', true, 'thử nghiệm');
  assert (select is_locked from public.profiles where id='00000000-0000-0000-0000-00000000000a'), 'T9 FAIL lock';
  perform public.set_user_lock('00000000-0000-0000-0000-00000000000a', false, null);
  begin
    perform public.set_user_lock('00000000-0000-0000-0000-0000000000b1', true, 'x');
    raise exception 'T9 FAIL self-lock';
  exception when others then
    if sqlerrm like 'T9 FAIL%' then raise; end if;
  end;
  perform public.admin_stats();
  raise notice 'T9 PASS: SUPER ADMIN phân quyền, khóa/mở tài khoản, xem thống kê';
end $$;

-- T10: moderator không phân quyền, không khóa SUPER ADMIN
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  begin
    perform public.set_user_lock('00000000-0000-0000-0000-0000000000b1', true, 'x');
    raise exception 'T10 FAIL';
  exception when others then
    if sqlerrm like 'T10 FAIL%' then raise; end if;
    raise notice 'T10 PASS: kiểm duyệt viên không khóa được SUPER ADMIN';
  end;
end $$;

-- T11: quyền riêng tư — xem hồ sơ công khai không lộ SĐT khi chưa đồng ý
reset role;
update public.profiles set phone='0900000000', show_phone=false, lat=10.98765, lng=106.65432, show_location=true
 where id='00000000-0000-0000-0000-00000000000a';
set role anon;
select pg_temp.as_user(null);
do $$ declare r record; begin
  select * into r from public.public_profiles where id='00000000-0000-0000-0000-00000000000a';
  assert r.phone is null, 'T11 FAIL phone';
  assert r.lat = 10.988, 'T11 FAIL rounding';
  perform count(*) from public.nearby(10.99, 106.65, 5, null, null, 50);
  raise notice 'T11 PASS: ẩn SĐT, làm tròn vị trí, tìm gần tôi hoạt động';
end $$;
reset role;
select 'ALL TESTS PASSED' as result;
