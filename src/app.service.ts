import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, ofType } from '@nestjs/cqrs';
import { ClientProxy } from '@nestjs/microservices';
import { MessageUpdatedEvent } from './gateway/events/message-updated.event';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    @Inject('QueryCore') private readonly redisEventQueue: ClientProxy,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.redisEventQueue.connect();
    } catch (e) {}

    const publicEvents: any[] = [MessageUpdatedEvent];

    this.ebus
      .pipe(ofType(...publicEvents))
      .subscribe((t) => this.redisEventQueue.emit(t.constructor.name, t));

    this.ebus
      .pipe(ofType(MessageUpdatedEvent))
      .subscribe((msg) =>
        this.amqpConnection.publish(
          'app.events',
          MessageUpdatedEvent.name,
          msg,
        ),
      );
  }
}
