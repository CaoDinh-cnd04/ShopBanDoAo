import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const req = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
    const p = req?.path ?? req?.url ?? '';
    /** VNPay redirect / IPN: không bọc { success, data } — IPN cần JSON phẳng */
    if (typeof p === 'string' && p.includes('/vnpay/')) {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => {
        // Handle case where custom message is provided from service
        const message = data?.message;

        // Return structured format
        return {
          success: true,
          message: message || 'Thành công',
          data: data,
        };
      }),
    );
  }
}
