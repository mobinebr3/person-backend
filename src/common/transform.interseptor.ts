import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MESSAGE_CODE_KEY } from './message-code.decorator';

export interface Response<T> {
  data: T;
  message: number;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // خواندن کد از دکوراتور
    const decoratorCode = this.reflector.get<number>(MESSAGE_CODE_KEY, context.getHandler());

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        // ۱. مدیریت کد: اولویت با کدی است که سرویس می‌فرستد، اگر نبود دکوراتور
        const finalMessageCode = data?.notification_code || decoratorCode || null;

        // ۲. تمیز کردن دیتا: حذف فیلدهای سیستمی از بدنه دیتا
        let cleanData = data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const { notification_code, ...rest } = data;
            cleanData = rest;
        }

        return {
          // ۳. اگر دیتا خالی بود null برگردان، در غیر این صورت خود دیتا
          data: (cleanData && (Array.isArray(cleanData) ? cleanData.length > 0 : Object.keys(cleanData).length > 0)) 
                ? cleanData 
                : (Array.isArray(cleanData) ? [] : null),
          message: finalMessageCode,
          success: response.statusCode >= 200 && response.statusCode < 300,
        };
      }),
    );
  }
}