import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/** Minimal shape of a Prisma known-request error (duck-typed to avoid coupling). */
interface PrismaKnownError {
  code: string;
  clientVersion: string;
  meta?: Record<string, unknown>;
}

const isPrismaKnownError = (err: unknown): err is PrismaKnownError =>
  typeof err === 'object' &&
  err !== null &&
  typeof (err as PrismaKnownError).code === 'string' &&
  (err as PrismaKnownError).code.startsWith('P') &&
  'clientVersion' in err;

/**
 * Single global error boundary. Normalises HttpExceptions, Prisma errors, and
 * anything unexpected into one consistent JSON shape, and logs 5xx.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            exception.message);
      return { status: exception.getStatus(), message, error: exception.name };
    }

    if (isPrismaKnownError(exception)) {
      return this.mapPrisma(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }

  private mapPrisma(err: PrismaKnownError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (err.code) {
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'NotFound',
        };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint failed${
            err.meta?.target ? ` on ${String(err.meta.target)}` : ''
          }`,
          error: 'Conflict',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record does not exist',
          error: 'BadRequest',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Database error (${err.code})`,
          error: 'DatabaseError',
        };
    }
  }
}
