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
