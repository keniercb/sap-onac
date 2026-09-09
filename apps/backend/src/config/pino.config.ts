import type { Params } from 'nestjs-pino';

export const pinoLoggerFactory = (): Params => ({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: false,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname,req,res,responseTime',
              messageFormat: '{msg}',
            },
          },
    customProps: (req) => ({
      context: 'HTTP',
      user: (req as { user?: { id?: string } })?.user?.id ?? 'anonymous',
    }),
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
      ignore: (req) => Boolean(req.url?.includes('/health')),
    },
  },
});
