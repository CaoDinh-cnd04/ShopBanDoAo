import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  ) {}

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

    let user = await this.authRepository.findByEmail(email);

    if (!user) {
      const fullName = profile.name?.trim() || email.split('@')[0];
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
          this.logger.error(
            `googleLogin create user failed: ${createErr instanceof Error ? createErr.message : createErr}`,
          );
          throw new BadRequestException(
            'Không tạo được tài khoản. Thử lại sau.',
          );
        }
      }
    }

    try {
      const userId = String(user!._id);
      const payload = {
        sub: userId,
        email: user!.email,
        role: user!.role || 'User',
      };
      const jwt = await this.jwtService.signAsync(payload);

      return {
        token: jwt,
        user: {
          id: userId,
          email: user!.email,
          fullName: user!.fullName,
          phone: user!.phone ?? null,
          role: user!.role || 'User',
        },
      };
    } catch (e: unknown) {
      this.logger.error(
        `googleLogin JWT failed: ${e instanceof Error ? e.message : e}`,
      );
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
