import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

function normalizeRole(raw: unknown): string {
  if (raw == null || raw === '') return 'User';
  if (typeof raw !== 'string') return 'User';
  const lower = raw.toLowerCase();
  if (lower === 'admin') return 'Admin';
  if (lower === 'user') return 'User';
  return raw;
}

export type ChatMessageSocketPayload = {
  id: string;
  userId: string;
  senderRole: 'user' | 'admin';
  body: string;
  createdAt: string;
};

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth as { token?: string } | undefined;
      const token =
        auth?.token ??
        this.extractBearer(client.handshake.headers?.authorization);
      if (!token) {
        client.disconnect();
        return;
      }
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'super-secret-key';
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role?: string;
      }>(token, { secret });
      const userId = payload.sub;
      const role = normalizeRole(payload.role);
      client.data.userId = userId;
      client.data.role = role;
      void client.join(`user:${userId}`);
      if (role === 'Admin') void client.join('admin');
      this.logger.debug(`chat connected ${userId} (${role})`);
    } catch (e) {
      this.logger.warn(
        `chat socket rejected: ${e instanceof Error ? e.message : String(e)}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    /* noop */
  }

  private extractBearer(auth: string | undefined): string | undefined {
    if (!auth || typeof auth !== 'string') return undefined;
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    return m?.[1];
  }

  emitNewMessage(payload: ChatMessageSocketPayload) {
    const uid = String(payload.userId);
    this.server.to('admin').emit('chat:message', payload);
    this.server.to(`user:${uid}`).emit('chat:message', payload);
  }
}
