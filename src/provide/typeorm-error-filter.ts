import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter');
  constructor() {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
    };

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(httpStatus).json(responseBody);
  }
}
