import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from './env';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: REDIS_HOST(),
      port: REDIS_PORT(),
      retryAttempts: Infinity,
      retryDelay: 5000,
      password: REDIS_PASSWORD(),
    },
  });

  const options = new DocumentBuilder()
    .setTitle('GameServer api')
    .setDescription('Matches, players, mmrs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(6003);

  await app.startAllMicroservices();
}
bootstrap();
