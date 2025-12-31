import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() 
      : 'Internal server error';

    const message =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message || JSON.stringify(exceptionResponse)
        : exceptionResponse;

    response.status(status).json({
      data: null,      
      message: message,
      status: false,  
    });
  }
}