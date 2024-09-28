import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../gateway/events/message-created.event';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ForumService implements OnModuleInit {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    private readonly ebus: EventBus,
    @Inject('QueryCore') private readonly redisEventQueue: ClientProxy,
  ) {}

  async onModuleInit() {
    let t = new ThreadEntity();
    t.external_id = 'test1';
    t.id = 'a2a88589-3293-4090-8652-2e4d16aa6882';
    t = await this.threadEntityRepository.save(t);

    console.log(t.id);

    await this.postMessage(t.id, 'Hey msg', '175751439');
  }

  async postMessage(
    threadId: string,
    content: string,
    authorId: string,
  ): Promise<MessageEntity> {
    const thread = await this.threadEntityRepository.findOneOrFail({
      where: { id: threadId },
    });

    let msg = new MessageEntity();
    msg.thread_id = threadId;
    msg.content = content;
    msg.author = authorId;

    msg = await this.messageEntityRepository.save(msg);

    this.redisEventQueue.emit(
      MessageCreatedEvent.name,
      new MessageCreatedEvent(
        msg.thread_id,
        msg.id,
        msg.author,
        msg.createdAt.toUTCString(),
        msg.content,
      ),
    );

    return msg;
  }

  async getMessages(
    thread_id: string,
    after: number,
    limit: number,
  ): Promise<MessageEntity[]> {
    return this.messageEntityRepository.find({
      where: {
        thread_id,
        createdAt: MoreThan(new Date(after)),
      },
      take: limit,
    });
  }
}
