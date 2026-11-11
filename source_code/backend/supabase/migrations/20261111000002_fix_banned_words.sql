-- SỬA LỖI: gửi phản hồi (bình luận) báo 'record "new" has no field "title"'.
-- Nguyên nhân: hàm lọc từ cấm đọc cột title, nhưng bảng comments không có cột này.
-- Cách sửa: đọc title/body qua jsonb nên dùng được cho mọi bảng. Không đổi dữ liệu.
create or replace function public.check_banned_words()
returns trigger language plpgsql security definer set search_path = public as $$
declare txt text; w text; j jsonb := to_jsonb(new);
begin
  txt := lower(coalesce(j->>'title', '') || ' ' || coalesce(j->>'body', ''));
  for w in select word from public.banned_words loop
    if position(lower(w) in txt) > 0 then
      raise exception 'Nội dung có cụm từ không được phép: "%". Ứng dụng không cho phép dự đoán kết quả hoặc mua bán vé.', w;
    end if;
  end loop;
  return new;
end $$;
