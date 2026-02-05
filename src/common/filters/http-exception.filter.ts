import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    
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

    // Log the error with details
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception)
    );

    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled Exception:', exception);
    }

    response.status(status).json({
      data: null,      
      message: message,
      status: false,  
    });
  }
}