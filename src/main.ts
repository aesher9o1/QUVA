/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createBullBoard } from 'bull-board';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { router } = createBullBoard([]);
  app.use('/queues', router);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
