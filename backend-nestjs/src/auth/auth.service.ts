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
        'GOOGLE_CLIENT_ID chưa cấu hình — POST /api/auth/google-id-token sẽ trả 400. Thêm biến trên Render (cùng Client ID với VITE_GOOGLE_CLIENT_ID).',
      );
    }
  }

  /** ConfigService hoặc process.env; bỏ dấu ngoặc thừa từ một số host (Render). */
  private getGoogleClientId(): string | undefined {
    const raw =
      this.configService.get<string>('GOOGLE_CLIENT_ID') ??
      process.env.GOOGLE_CLIENT_ID;
    if (raw == null || typeof raw !== 'string') return undefined;
    const v = raw.replace(/^["']|["']$/g, '').trim();
    return v || undefined;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone } = registerDto;

    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.authRepository.create({
      email,
      fullName,
      passwordHash: hashedPassword,
      phone: phone?.trim() || undefined,
    });

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

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
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
   * Đăng nhập Google qua OAuth2 access_token (frontend: @react-oauth/google useGoogleLogin).
   * Xác thực bằng Google UserInfo API — không dùng Firebase.
   */
  async googleLogin(accessToken: string) {
    const token = accessToken?.trim();
    if (!token) {
      throw new BadRequestException('Access token không được để trống');
    }

    let profile: {
      email?: string;
      name?: string;
      email_verified?: boolean;
      verified_email?: boolean;
    };

    try {
      profile = await this.fetchGoogleProfile(token);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Google UserInfo failed: ${msg}`);
      throw new UnauthorizedException(
        'Không xác thực được token Google. Thử đăng nhập lại.',
      );
    }

    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google không cung cấp email');
    }

    const ev = profile.email_verified ?? profile.verified_email;
    if (ev === false) {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }

    const fullName = profile.name?.trim() || email.split('@')[0];
    return this.findOrCreateGoogleUserAndReturnJwt(email, fullName);
  }

  /**
   * Đăng nhập qua JWT credential (Sign In With Google — nút GoogleLogin, không popup OAuth).
   */
  async googleLoginWithIdToken(idToken: string) {
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

  /** Gọi Google UserInfo (v3, fallback v2) — throw nếu không lấy được profile hợp lệ */
  private async fetchGoogleProfile(accessToken: string) {
    const tryFetch = async (url: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
      }
      let data: Record<string, unknown>;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        throw new Error('Invalid JSON from Google UserInfo');
      }
      return data;
    };

    try {
      const data = await tryFetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
      );
      return {
        email: data.email as string | undefined,
        name: data.name as string | undefined,
        email_verified: data.email_verified as boolean | undefined,
        verified_email: data.verified_email as boolean | undefined,
      };
    } catch (first) {
      this.logger.debug(`userinfo v3 failed, try v2: ${first}`);
      const data = await tryFetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
      );
      return {
        email: data.email as string | undefined,
        name: data.name as string | undefined,
        email_verified: undefined,
        verified_email: data.verified_email as boolean | undefined,
      };
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
