import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;
    
    // 1. Business Logic: Check existing user
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save via Database Repository
    const user = await this.authRepository.create({
      email,
      fullName,
      passwordHash: hashedPassword,
    });

    return { message: 'Đăng ký thành công', userId: user._id };
  }

  async login(loginDto: LoginDto) {
    // 1. Logic kiểm tra user
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    // 2. Sign JWT
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return { 
      message: 'Đăng nhập thành công',
      accessToken, 
      user: { email: user.email, fullName: user.fullName, role: user.role } 
    };
  }

  async firebaseLogin(idToken: string) {
    try {
      const admin = require('firebase-admin');
      const path = require('path');
      
      // Initialize Firebase Admin SDK lazily
      if (!admin.apps.length) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json';
        const serviceAccount = require(path.resolve(process.cwd(), serviceAccountPath));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      // Verify the token provided by the client (Facebook/Google)
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Link to local MongoDB user
      let user = await this.authRepository.findByEmail(decodedToken.email);
      if (!user) {
        user = await this.authRepository.create({
          email: decodedToken.email,
          fullName: decodedToken.name || decodedToken.email.split('@')[0],
          passwordHash: 'firebase_auth_no_password',
        });
      }

      // Assign local JWT
      const payload = { sub: user._id, email: user.email };
      const accessToken = await this.jwtService.signAsync(payload);

      return { 
        message: 'Đăng nhập MXH thành công',
        accessToken, 
        user: { email: user.email, fullName: user.fullName } 
      };
    } catch (error: any) {
      throw new UnauthorizedException('Xác thực Firebase thất bại: ' + error.message);
    }
  }
}
