import { io } from 'socket.io-client';
import { getApiOrigin } from '../config/apiBase';

let socket = null;
let lastToken = null;

/**
 * Kết nối namespace /chat — JWT trong handshake.auth.token (khớp ChatGateway).
 */
export function getChatSocket(token) {
  if (!token) return null;
  const origin = getApiOrigin();
  if (!origin) return null;
  if (socket?.connected && lastToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastToken = token;
  socket = io(`${origin}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectChatSocket() {
  lastToken = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
