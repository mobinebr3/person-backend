import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      map((data) => {
          const message = data?.message || "عملیات با موفقیت انجام شد";

          const cleanData = data;
          if (data && typeof data === 'object' && 'message' in data) {
              delete cleanData.message;
          }

          return {
            data: (cleanData && Object.keys(cleanData).length > 0) ? cleanData : null,
            message: message,
            success: response.statusCode >= 200 && response.statusCode < 300,
          };
      }),
    );
  }
}