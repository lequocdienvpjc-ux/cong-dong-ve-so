// Nhắn tin riêng: dữ liệu được bảo vệ bằng RLS ở database (chỉ 2 người trong cuộc xem được)
import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

export const otherOf = (c, me) => (c.user_a === me ? c.user_b : c.user_a);
export const myReadAt = (c, me) => (c.user_a === me ? c.a_read_at : c.b_read_at);
export const isUnread = (c, me) =>
  !!c.last_message_at && c.last_sender !== me && (!myReadAt(c, me) || new Date(c.last_message_at) > new Date(myReadAt(c, me)));

// Mở (hoặc lấy lại) cuộc trò chuyện với thành viên đã kết nối, trả về id
export async function openConversation(otherId) {
  const { data, error } = await supabase.rpc('open_conversation', { p_other: otherId });
  if (error) throw error;
  return data;
}

// Số cuộc trò chuyện có tin chưa đọc — cập nhật tức thời + dự phòng mỗi 30 giây
export function useUnreadMessages(user) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!user) { setN(0); return; }
    let alive = true;
    const load = () => supabase.from('conversations').select('user_a,user_b,last_message_at,last_sender,a_read_at,b_read_at')
      .not('last_message_at', 'is', null)
      .then(({ data }) => alive && setN((data || []).filter((c) => isUnread(c, user.id)).length));
    load();
    const t = setInterval(load, 30000);
    const ch = supabase.channel('unread-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('tin-nhan-da-doc', onFocus);
    return () => { alive = false; clearInterval(t); supabase.removeChannel(ch);
      window.removeEventListener('focus', onFocus); window.removeEventListener('tin-nhan-da-doc', onFocus); };
  }, [user]);
  return n;
}
