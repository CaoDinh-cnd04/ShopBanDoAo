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
  GoogleLoginDto,
  GoogleIdTokenDto,
  GoogleAuthCodeDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google-login')
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.accessToken);
  }

  /** Đăng nhập qua JWT credential (legacy) */
  @HttpCode(HttpStatus.OK)
  @Post('google-id-token')
  async googleIdToken(@Body() dto: GoogleIdTokenDto) {
    return this.authService.googleLoginWithIdToken(dto.idToken);
  }

  /** OAuth2 redirect: đổi code → session — khuyến nghị (không iframe GSI / COOP) */
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
