import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'super-secret-key',
    });
  }

  async validate(payload: any) {
    const raw = payload.role;
    let role: string;
    if (raw == null || raw === '') {
      role = 'User';
    } else if (typeof raw !== 'string') {
      role = 'User';
    } else {
      role = raw;
      const lower = role.toLowerCase();
      if (lower === 'admin') role = 'Admin';
      else if (lower === 'user') role = 'User';
    }
    return { userId: payload.sub, email: payload.email, role };
  }
}
