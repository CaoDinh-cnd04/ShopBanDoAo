import {
  Injectable,
  Logger,
  HttpException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { normalizeOAuthRedirectUri } from './oauth-redirect.util';
import type { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    if (!this.getGoogleClientId()) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID chưa cấu hình — đăng nhập Google sẽ lỗi. Thêm trên Render (cùng VITE_GOOGLE_CLIENT_ID).',
      );
    }
    if (!this.getGoogleClientSecret()) {
      this.logger.warn(
        'GOOGLE_CLIENT_SECRET chưa cấu hình — POST /api/auth/google-auth-code (redirect) sẽ trả 400.',
      );
    }
  }

  /** ConfigService hoặc process.env; bỏ dấu ngoặc thừa từ một số host (Render). */
  private getGoogleClientId(): string | undefined {
    const raw =
      this.configService.get<string>('GOOGLE_CLIENT_ID') ??
      process.env.GOOGLE_CLIENT_ID;
    if (raw == null || typeof raw !== 'string') return undefined;
    const v = raw
      .replace(/^["']|["']$/g, '')
      .trim()
      .replace(/[\r\n\t]/g, '');
    return v || undefined;
  }

  /** Client secret của OAuth Web — chỉ trên server (Render). */
  private getGoogleClientSecret(): string | undefined {
    const raw =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') ??
      process.env.GOOGLE_CLIENT_SECRET;
    if (raw == null || typeof raw !== 'string') return undefined;
    const v = raw
      .replace(/^["']|["']$/g, '')
      .trim()
      .replace(/[\r\n\t]/g, '');
    return v || undefined;
  }

  /** Tài khoản chỉ tạo qua Google (chưa đặt mật khẩu app). */
  private isGoogleOnlyUser(user: UserDocument | null | undefined): boolean {
    const h = user?.passwordHash;
    return typeof h === 'string' && h.startsWith('GOOGLE_OAUTH_');
  }

  private duplicateRegisterMessage(existing: UserDocument): string {
    if (this.isGoogleOnlyUser(existing)) {
      return (
        'Email này đã được tạo khi đăng nhập Google trước đó. Không cần đăng ký lại — ' +
        'hãy dùng nút «Đăng nhập với Google». (Nếu muốn có mật khẩu riêng: đăng nhập Google rồi vào Hồ sơ → Đổi mật khẩu.)'
      );
    }
    return 'Email đã có trong hệ thống. Hãy đăng nhập bằng mật khẩu hoặc Đăng nhập Google nếu bạn đã liên kết.';
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    );
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone } = registerDto;

    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await this.authRepository.create({
        email,
        fullName: fullName.trim(),
        passwordHash: hashedPassword,
        phone: phone?.trim() ? phone.trim() : undefined,
      });
    } catch (err: unknown) {
      if (this.isDuplicateKeyError(err)) {
        const again = await this.authRepository.findByEmail(email);
        throw new BadRequestException(
          again
            ? this.duplicateRegisterMessage(again)
            : 'Email đã được sử dụng. Thử đăng nhập hoặc Đăng nhập Google.',
        );
      }
      this.logger.error(
        `register save failed: ${err instanceof Error ? err.stack : String(err)}`,
      );
      throw err;
    }

    const userId = String(user._id);
    const payload = {
      sub: userId,
      email: user.email,
      role: user.role || 'User',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      token: accessToken,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || null,
        role: user.role || 'User',
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (user.passwordHash?.startsWith('GOOGLE_OAUTH_')) {
      throw new UnauthorizedException(
        'Tài khoản đăng ký qua Google — vui lòng đăng nhập bằng Google.',
      );
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    } catch {
      this.logger.warn(`bcrypt.compare failed for user ${String(user._id)}`);
      throw new UnauthorizedException('Không đăng nhập được bằng mật khẩu này');
    }
    if (!isMatch) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    const userId = String(user._id);
    const payload = {
      sub: userId,
      email: user.email,
      role: user.role || 'User',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      token: accessToken,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || null,
        role: user.role || 'User',
      },
    };
  }

  /**
   * Xác thực id_token Google (OAuth2 redirect → getToken) rồi cấp JWT app.
   */
  private async verifyGoogleIdTokenAndIssueSession(idToken: string) {
    const raw = idToken?.trim();
    if (!raw) {
      throw new BadRequestException('ID token không được để trống');
    }

    const clientId = this.getGoogleClientId();
    if (!clientId) {
      this.logger.error('GOOGLE_CLIENT_ID is not set');
      throw new BadRequestException(
        'Server chưa cấu hình Google OAuth (GOOGLE_CLIENT_ID trên Render phải trùng VITE_GOOGLE_CLIENT_ID).',
      );
    }

    const client = new OAuth2Client(clientId);
    try {
      const ticket = await client.verifyIdToken({
        idToken: raw,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException(
          'Google không cung cấp thông tin tài khoản',
        );
      }

      const email = payload.email?.trim().toLowerCase();
      if (!email) {
        throw new UnauthorizedException('Google không cung cấp email');
      }

      if (payload.email_verified === false) {
        throw new UnauthorizedException('Email Google chưa được xác minh');
      }

      const fullName = payload.name?.trim() || email.split('@')[0];
      return this.findOrCreateGoogleUserAndReturnJwt(email, fullName);
    } catch (e: unknown) {
      if (e instanceof HttpException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`verifyIdToken failed: ${msg}`);
      throw new UnauthorizedException(
        'Token Google không hợp lệ hoặc đã hết hạn. Thử đăng nhập lại.',
      );
    }
  }

  /**
   * OAuth2 redirect: đổi authorization code → id_token (cần GOOGLE_CLIENT_SECRET).
   */
  async exchangeGoogleAuthCode(code: string, redirectUri: string) {
    const clientId = this.getGoogleClientId();
    const clientSecret = this.getGoogleClientSecret();
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET (OAuth Web Client trên Google Cloud + Render).',
      );
    }
    const rawCode = code?.trim();
    if (!rawCode) {
      throw new BadRequestException('Code không được để trống');
    }
    const rawRedirect = normalizeOAuthRedirectUri(redirectUri ?? '');
    if (!rawRedirect) {
      throw new BadRequestException('redirectUri không được để trống');
    }

    const client = new OAuth2Client(clientId, clientSecret, rawRedirect);
    try {
      const r = await client.getToken(rawCode);
      const tokens = r.tokens;
      if (tokens?.id_token) {
        return this.verifyGoogleIdTokenAndIssueSession(tokens.id_token);
      }
      if (tokens?.access_token) {
        this.logger.warn(
          'Google trả access_token nhưng không có id_token — dùng UserInfo API',
        );
        return this.issueSessionFromGoogleAccessToken(tokens.access_token);
      }
      throw new BadRequestException(
        'Google không trả id_token hoặc access_token. Kiểm tra scope openid trong URL đăng nhập Google.',
      );
    } catch (e: unknown) {
      if (e instanceof HttpException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      const lower = msg.toLowerCase();
      this.logger.warn(`exchangeGoogleAuthCode getToken failed: ${msg}`);
      if (
        lower.includes('redirect_uri') ||
        lower.includes('redirect uri') ||
        lower.includes('redirecturi')
      ) {
        throw new BadRequestException(
          'redirect_uri không khớp Google Console. Thêm CHÍNH XÁC URL callback của trang đang mở (http/https, www, và path /auth/google/callback hoặc /base/auth/google/callback).',
        );
      }
      if (
        lower.includes('invalid_grant') ||
        lower.includes('already redeemed') ||
        lower.includes('code was already')
      ) {
        throw new BadRequestException(
          'Mã đăng nhập Google đã hết hạn hoặc đã dùng. Vui lòng bấm đăng nhập Google lại.',
        );
      }
      if (
        lower.includes('invalid_client') ||
        lower.includes('unauthorized_client') ||
        lower.includes('client_secret')
      ) {
        throw new BadRequestException(
          'GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trên Render không khớp OAuth client trong Google Cloud.',
        );
      }
      throw new UnauthorizedException(
        'Không đổi được mã Google. Kiểm tra Authorized redirect URIs và GOOGLE_CLIENT_SECRET.',
      );
    }
  }

  /**
   * Khi Google không trả id_token nhưng có access_token — lấy profile qua UserInfo.
   */
  private async issueSessionFromGoogleAccessToken(accessToken: string) {
    const token = accessToken?.trim();
    if (!token) {
      throw new BadRequestException('Access token Google rỗng');
    }
    let profile: {
      email?: string;
      name?: string;
      email_verified?: boolean;
    };
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`userinfo ${res.status} ${text.slice(0, 120)}`);
      }
      const data = (await res.json()) as Record<string, unknown>;
      profile = {
        email: data.email as string | undefined,
        name: data.name as string | undefined,
        email_verified: data.email_verified as boolean | undefined,
      };
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Google UserInfo failed: ${m}`);
      throw new UnauthorizedException(
        'Không lấy được thông tin tài khoản Google. Thử đăng nhập lại.',
      );
    }
    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google không cung cấp email');
    }
    if (profile.email_verified === false) {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }
    const fullName = profile.name?.trim() || email.split('@')[0];
    return this.findOrCreateGoogleUserAndReturnJwt(email, fullName);
  }

  private async findOrCreateGoogleUserAndReturnJwt(
    email: string,
    fullName: string,
  ) {
    let user = await this.authRepository.findByEmail(email);

    if (!user) {
      try {
        user = await this.authRepository.create({
          email,
          fullName,
          passwordHash: `GOOGLE_OAUTH_${Date.now()}`,
          role: 'User',
          isActive: true,
        } as any);
      } catch (createErr: unknown) {
        const code = (createErr as { code?: number })?.code;
        if (code === 11000) {
          user = await this.authRepository.findByEmail(email);
        }
        if (!user) {
          const errMsg =
            createErr instanceof Error ? createErr.message : String(createErr);
          this.logger.error(`Google create user failed: ${errMsg}`);
          throw new BadRequestException(
            'Không tạo được tài khoản. Thử lại sau.',
          );
        }
      }
    }

    if (!user) {
      throw new BadRequestException(
        'Không tìm thấy tài khoản sau khi xác thực Google.',
      );
    }

    try {
      const userId = String(user._id);
      const payload = {
        sub: userId,
        email: user.email,
        role: user.role || 'User',
      };
      const jwt = await this.jwtService.signAsync(payload);

      return {
        token: jwt,
        user: {
          id: userId,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone ?? null,
          role: user.role || 'User',
        },
      };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Google JWT failed: ${errMsg}`);
      throw new BadRequestException('Không tạo được phiên đăng nhập. Thử lại.');
    }
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      role: user.role || 'User',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.phone !== undefined)
      user.phone = (dto.phone.trim() || undefined) as any;
    await (user as any).save();

    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      role: user.role || 'User',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Google OAuth users may have placeholder password
    const isPlaceholder = user.passwordHash?.startsWith('GOOGLE_OAUTH_');
    if (!isPlaceholder) {
      const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
      if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await (user as any).save();
    return { message: 'Đổi mật khẩu thành công' };
  }
}
