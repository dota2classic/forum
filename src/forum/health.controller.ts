import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../env';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('health')
@ApiExcludeController()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @Inject('QueryCore') private readonly redisEventQueue: ClientProxy,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: REDIS_HOST(),
            port: REDIS_PORT(),
            password: REDIS_PASSWORD(),
          },
        }),
    ]);
  }
}
