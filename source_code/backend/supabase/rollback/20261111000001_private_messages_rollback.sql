-- GỠ BỎ chức năng nhắn tin riêng (chỉ dùng khi cần khôi phục về trước nâng cấp).
-- CẢNH BÁO: lệnh này XÓA toàn bộ tin nhắn. Sao lưu trước bằng:
--   select * from public.conversations;  select * from public.messages;
-- Không ảnh hưởng bảng thành viên, kết nối, bản đồ.
drop trigger if exists messages_after on public.messages;
drop trigger if exists messages_banned on public.messages;
drop trigger if exists messages_check on public.messages;
drop table if exists public.messages;
drop table if exists public.conversations;
drop function if exists public.messages_after_insert();
drop function if exists public.messages_before_insert();
drop function if exists public.check_banned_words_message();
drop function if exists public.mark_conversation_read(uuid);
drop function if exists public.open_conversation(uuid);
drop function if exists public.is_participant(uuid);
drop function if exists public.are_connected(uuid, uuid);
delete from public.notifications where type = 'message';
