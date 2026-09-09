import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    let code: string;
    let details: unknown;

    if (isHttpException) {
      const resp = exception.getResponse();
      code = exception.name;
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as Record<string, unknown>;
        const rawMsg = r.message as string | string[] | undefined;
        if (Array.isArray(rawMsg)) {
          message = rawMsg.join('; ');
        } else if (typeof rawMsg === 'string') {
          message = rawMsg;
        } else {
          message = 'Error de validación';
        }
        const codeFromResp = r.error as string | undefined;
        if (codeFromResp) code = codeFromResp;
        details = r.details;
      } else {
        message = 'Error desconocido';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error(`Error no controlado: ${exception.message}`, exception.stack);
    } else {
      message = 'Error interno del servidor';
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error('Error desconocido', String(exception));
    }

    const body: ErrorBody = {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}
