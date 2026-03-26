import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, FirebaseLoginDto } from './dto/auth.dto';
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
  @Post('firebase-login')
  async firebaseLogin(@Body() fbDto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(fbDto.idToken);
  }

  // Example Protected Route
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
