import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { isAdminUser } from '../../store/slices/authSlice';
import { FiMessageCircle, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getChatSocket } from '../../services/chatSocket';
import './ProfileMessages.css';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProfileMessages = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((s) => s.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const scrollBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await api.get('/chat/messages', { params: { limit: 80 } });
    const data = res.data?.data;
    const list = data?.messages;
    setMessages(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    if (user && isAdminUser(user)) {
      navigate('/admin/messages', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!token) return undefined;
    if (user && isAdminUser(user)) return undefined;
    loadHistory().catch(() => toast.error('Không tải được tin nhắn'));
    const sock = getChatSocket(token);
    if (!sock) return undefined;
    const onMsg = (payload) => {
      if (!payload?.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, payload];
      });
    };
    sock.on('chat:message', onMsg);
    return () => {
      sock.off('chat:message', onMsg);
    };
  }, [token, user, loadHistory]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await api.post('/chat/messages', { body });
      const msg = res.data?.data;
      if (msg?.id) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi không thành công');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="profile-section-card profile-messages">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiMessageCircle size={20} />
          <h2 className="profile-section-title">Chat hỗ trợ</h2>
        </div>
        <p className="profile-section-sub">
          Tin nhắn tới đội ngũ quản trị — cập nhật realtime khi có phản hồi.
        </p>
      </div>

      <div className="pm-chat-wrap">
        <div className="pm-messages" ref={listRef} role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="pm-empty">
              <FiMessageCircle size={40} />
              <p>Chưa có tin nhắn. Hãy gửi câu hỏi — admin sẽ trả lời tại đây.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderRole === 'user';
              return (
                <div
                  key={m.id}
                  className={`pm-bubble ${mine ? 'pm-bubble--mine' : 'pm-bubble--admin'}`}
                >
                  <div className="pm-bubble-meta">
                    {mine ? 'Bạn' : 'Quản trị'} · {fmtTime(m.createdAt)}
                  </div>
                  <div className="pm-bubble-body">{m.body}</div>
                </div>
              );
            })
          )}
        </div>
        <form className="pm-compose" onSubmit={handleSend}>
          <textarea
            className="pm-input"
            rows={2}
            placeholder="Nhập tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" className="pm-send" disabled={sending || !text.trim()}>
            <FiSend size={18} /> Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileMessages;
