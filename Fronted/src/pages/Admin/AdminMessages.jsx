import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, Spinner } from 'react-bootstrap';
import { FiMessageCircle, FiSend, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getChatSocket } from '../../services/chatSocket';
import './AdminMessages.css';

const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminMessages = () => {
  const { token } = useSelector((s) => s.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [threadUser, setThreadUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  const scrollBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const fetchConversations = useCallback(async () => {
    const res = await api.get('/admin/chat/conversations');
    const data = res.data?.data;
    const list = data?.conversations;
    setConversations(Array.isArray(list) ? list : []);
  }, []);

  const loadThread = useCallback(
    async (userId) => {
      if (!userId) return;
      setLoadingThread(true);
      try {
        const res = await api.get(`/admin/chat/users/${userId}/messages`, {
          params: { limit: 100 },
        });
        const data = res.data?.data;
        setThreadUser(data?.user || null);
        const list = data?.messages;
        setMessages(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Không tải được cuộc trò chuyện');
      } finally {
        setLoadingThread(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!token) return undefined;
    setLoadingList(true);
    fetchConversations()
      .catch(() => toast.error('Không tải danh sách hội thoại'))
      .finally(() => setLoadingList(false));

    const sock = getChatSocket(token);
    if (!sock) return undefined;

    const onMsg = (payload) => {
      if (!payload?.id || !payload.userId) return;
      const uid = payload.userId;
      setConversations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.userId === uid);
        const row = {
          userId: uid,
          lastMessageAt: payload.createdAt,
          lastBody: payload.body,
          lastSenderRole: payload.senderRole,
          user: idx >= 0 ? next[idx].user : null,
        };
        if (idx >= 0) next.splice(idx, 1);
        next.unshift(row);
        return next;
      });
      if (selectedIdRef.current === uid) {
        setMessages((m) => (m.some((x) => x.id === payload.id) ? m : [...m, payload]));
      }
    };
    sock.on('chat:message', onMsg);
    return () => {
      sock.off('chat:message', onMsg);
    };
  }, [token, fetchConversations]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  const selectConversation = (userId) => {
    setSelectedId(userId);
    loadThread(userId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/admin/chat/users/${selectedId}/messages`, { body });
      const msg = res.data?.data;
      if (msg?.id) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
      setText('');
      fetchConversations().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi không thành công');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-messages-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Tin nhắn hỗ trợ</h1>
        <p className="admin-page-desc text-muted">
          Hội thoại với khách — cập nhật realtime qua Socket.IO.
        </p>
      </div>

      <Card className="admin-msg-card">
        <Card.Body className="p-0">
        <div className="admin-msg-grid">
          <aside className="admin-msg-sidebar">
            <div className="admin-msg-sidebar-head">
              <FiMessageCircle /> Cuộc trò chuyện
            </div>
            {loadingList ? (
              <div className="admin-msg-loading">
                <Spinner animation="border" size="sm" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="admin-msg-empty">Chưa có tin nhắn nào.</div>
            ) : (
              <ul className="admin-msg-list">
                {conversations.map((c) => (
                  <li key={c.userId}>
                    <button
                      type="button"
                      className={`admin-msg-item ${selectedId === c.userId ? 'active' : ''}`}
                      onClick={() => selectConversation(c.userId)}
                    >
                      <span className="admin-msg-item-name">
                        <FiUser size={14} />
                        {c.user?.fullName || 'Khách'}
                      </span>
                      <span className="admin-msg-item-preview">{c.lastBody}</span>
                      <span className="admin-msg-item-time">{fmtTime(c.lastMessageAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="admin-msg-main">
            {!selectedId ? (
              <div className="admin-msg-placeholder">
                Chọn một cuộc trò chuyện bên trái để trả lời.
              </div>
            ) : loadingThread ? (
              <div className="admin-msg-loading">
                <Spinner animation="border" />
              </div>
            ) : (
              <>
                <div className="admin-msg-thread-head">
                  <strong>{threadUser?.fullName || 'Khách'}</strong>
                  <span className="text-muted small">{threadUser?.email}</span>
                </div>
                <div className="admin-msg-thread" ref={listRef}>
                  {messages.map((m) => {
                    const fromAdmin = m.senderRole === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`admin-msg-bubble ${fromAdmin ? 'from-admin' : 'from-user'}`}
                      >
                        <div className="admin-msg-bubble-meta">
                          {fromAdmin ? 'Admin' : 'Khách'} · {fmtTime(m.createdAt)}
                        </div>
                        <div>{m.body}</div>
                      </div>
                    );
                  })}
                </div>
                <form className="admin-msg-compose" onSubmit={handleSend}>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Trả lời khách..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || !text.trim()}
                  >
                    <FiSend size={16} /> Gửi
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminMessages;
