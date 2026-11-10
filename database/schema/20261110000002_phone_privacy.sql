-- V2: Số điện thoại CHỈ hiển thị khi thành viên chủ động bật "Cho mọi người thấy số điện thoại"
-- (đúng Quy định cộng đồng & Quyền riêng tư V01, mục 4.3). Không thay đổi cấu trúc bảng.
create or replace function public.contact_of(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select phone from public.profiles pr
  where pr.id = p_user and pr.show_phone and not pr.is_locked;
$$;
grant execute on function public.contact_of(uuid) to authenticated;
