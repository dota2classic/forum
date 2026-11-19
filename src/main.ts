import './util/promise-combine';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisOptions } from '@nestjs/microservices';
import { getRedisTransportOptions } from './config/redis.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import configuration from './configuration';
import { ConfigService } from '@nestjs/config';
import { CatchEverythingFilter } from './provide/typeorm-error-filter';

require('dotenv').config();

async function bootstrap() {
  const config = new ConfigService(configuration());

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new CatchEverythingFilter());

  app.connectMicroservice<RedisOptions>(getRedisTransportOptions(config));

  const options = new DocumentBuilder()
    .setTitle('GameServer api')
    .setDescription('Matches, players, mmrs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(6009);

  await app.startAllMicroservices();
}
bootstrap();
