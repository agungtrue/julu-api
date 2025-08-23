import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const test = process.env.PORT
  console.log({ test })
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3006);
}
bootstrap();
