import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '../src/common/errors/filters/global-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3007;

  // app.enableCors({
  //   origin: ['http://localhost:3000', 'https://admin.julucoffee.com'],
  //   credentials: true,
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: 'Content-Type, Accept, Authorization',
  // });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return callback(null, true);
      }

      // 2. Regex untuk mencocokkan:
      //    - http://localhost:3000
      //    - http://*.localhost:3000 (julu-pos.localhost, admin.localhost, dll)
      //    - https://*.julucoffee.com (Production)
      const allowedOriginPattern =
        /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?(localhost:\d+|julucoffee\.com)$/;

      if (allowedOriginPattern.test(origin)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, true);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(new Error(`CORS Error: Origin ${origin} tidak diizinkan.`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-forwarded-host',
    ],
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // dto check
      // whitelist: true,
    }),
  );

  await app.listen(port);
}
bootstrap();
