import { Transform } from 'class-transformer';
import { normalizeOAuthRedirectUri } from '../oauth-redirect.util';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;

  /** Rỗng / chỉ khoảng trắng → bỏ qua; số từ autofill → chuỗi */
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const raw =
      typeof value === 'number'
        ? String(value)
        : typeof value === 'string'
          ? value.trim()
          : value;
    if (typeof raw !== 'string') return value;
    return raw === '' ? undefined : raw;
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

/** OAuth2 authorization code sau redirect — đổi lấy id_token trên server */
export class GoogleAuthCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Code không được để trống' })
  code: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeOAuthRedirectUri(value) : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'redirectUri không được để trống' })
  redirectUri: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên' })
  newPassword: string;
}
