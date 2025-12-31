import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from './exceptions/message.decorator';

export interface Response<T> {
  data: T;
  message: string;
  status: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {

    const responseMessage = this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler());

    const message = responseMessage || 'عملیات موفقیت‌آمیز بود';

    return next.handle().pipe(
      map((data) => ({
        data: data ?? [], 
        message: message,
        status: true,
      })),
    );
  }
}