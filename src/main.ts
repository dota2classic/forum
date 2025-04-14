import { otelSDK } from './tracer';
import './util/promise-combine';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import configuration from './configuration';
import { ConfigService } from '@nestjs/config';
import { WinstonWrapper } from '@dota2classic/nest_logger';

async function bootstrap() {
  await otelSDK.start();

  const config = new ConfigService(configuration());

  const app = await NestFactory.create(AppModule, {
    logger: new WinstonWrapper(
      config.get('fluentbit.host'),
      config.get('fluentbit.port'),
      config.get('fluentbit.application'),
      config.get('fluentbit.disabled'),
    ),
  });

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      url: `redis://${config.get('redis.host')}:6379`,
      host: config.get('redis.host'),
      retryAttempts: Infinity,
      retryDelay: 5000,
      password: config.get('redis.password'),
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

  await app.listen(6009);

  await app.startAllMicroservices();
  console.log('Started');
}
bootstrap();
