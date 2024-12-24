import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, ofType } from '@nestjs/cqrs';
import { ClientProxy } from '@nestjs/microservices';
import { MessageCreatedEvent } from './gateway/events/message-created.event';
import { MessageUpdatedEvent } from './gateway/events/message-updated.event';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    @Inject('QueryCore') private readonly redisEventQueue: ClientProxy,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.redisEventQueue.connect();
    } catch (e) {}

    const publicEvents: any[] = [MessageCreatedEvent, MessageUpdatedEvent];

    this.ebus
      .pipe(ofType(...publicEvents))
      .subscribe((t) => this.redisEventQueue.emit(t.constructor.name, t));
  }
}
