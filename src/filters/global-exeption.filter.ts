import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    //const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    console.error(exception);

    let message = 'internal server error';

    if (exception instanceof HttpException) {
      message = exception.message;
      if (message === 'Bad Request Exception') {
        const exceptionResponse = exception.getResponse() as any;
        message = exceptionResponse.message[0] || 'Bad Request Exception';
      }
    }
    response.json({
      status,
      dtc: message,
    });
  }
}
