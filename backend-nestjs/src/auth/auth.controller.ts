import {
  Controller,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthCodeDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Trình duyệt mở URL trên thanh địa chỉ = GET → không có route POST.
   * Trả JSON rõ ràng để tránh hiểu nhầm "API hỏng".
   */
  @Get('register')
  registerGetHint() {
    return {
      message:
        'Đây là API POST, không dùng bằng cách gõ URL trên trình duyệt. Hãy đăng ký qua form trên website (POST /api/auth/register với JSON: email, password, fullName, phone).',
    };
  }

  @Get('login')
  loginGetHint() {
    return {
      message:
        'Đây là API POST. Đăng nhập qua trang /login trên website (POST /api/auth/login với JSON: email, password).',
    };
  }

  @Get('google-auth-code')
  googleAuthCodeGetHint() {
    return {
      message:
        'Đây là API POST sau khi Google redirect về SPA. Không mở trực tiếp URL này. Luồng đúng: bấm «Đăng nhập Google» → POST /api/auth/google-auth-code với code + redirectUri.',
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** OAuth2 redirect: đổi code → JWT (SPA + GOOGLE_CLIENT_SECRET trên server) */
  @HttpCode(HttpStatus.OK)
  @Post('google-auth-code')
  async googleAuthCode(@Body() dto: GoogleAuthCodeDto) {
    return this.authService.exchangeGoogleAuthCode(dto.code, dto.redirectUri);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(
      req.user.sub || req.user.userId || req.user._id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(
      req.user.sub || req.user.userId || req.user._id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.sub || req.user.userId || req.user._id,
      dto,
    );
  }
}
