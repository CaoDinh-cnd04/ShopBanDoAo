import {
  Injectable,
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

    let googleRes: Awaited<ReturnType<typeof fetch>>;
    try {
      googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new BadRequestException(
        'Không kết nối được Google UserInfo (mạng server)',
      );
    }

    if (!googleRes.ok) {
      throw new UnauthorizedException(
        'Google access token không hợp lệ hoặc đã hết hạn',
      );
    }

    const profile = (await googleRes.json()) as {
      email?: string;
      name?: string;
      email_verified?: boolean;
      verified_email?: boolean;
    };

    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google không cung cấp email');
    }

    if (profile.email_verified === false || profile.verified_email === false) {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }

    let user = await this.authRepository.findByEmail(email);

    if (!user) {
      const fullName = profile.name?.trim() || email.split('@')[0];
      user = await this.authRepository.create({
        email,
        fullName,
        passwordHash: `GOOGLE_OAUTH_${Date.now()}`,
        role: 'User',
        isActive: true,
      } as any);
    }

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
