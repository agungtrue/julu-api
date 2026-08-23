import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong!';
    let error = 'Internal Server Error';

    // Handling HTTP Exceptions NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      error = res.error || exception.name;
    }
    // Handling Error Database (TypeORM)
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Constraint Error';

      // duplicate key (i.e: invoice duplicate, email duplicate)
      if ((exception as any)?.code === '23505') {
        message = 'duplicate data, please check again!';
      } else {
        message = 'Something went wrong';
      }
    }

    // Format string if message like array (i.e from Class-Validator)
    const formattedMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${formattedMessage}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      message: formattedMessage,
      error,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'local' && { path: request.url }),
    });
  }
}
