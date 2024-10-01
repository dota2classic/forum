import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../gateway/events/message-created.event';
import { ClientProxy } from '@nestjs/microservices';
import { ThreadType } from '../gateway/shared-types/thread-type';

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
    return;
    let t = new ThreadEntity();
    t.external_id = 'test1';
    t.id = 'a2a88589-3293-4090-8652-2e4d16aa6882';
    t = await this.threadEntityRepository.save(t);

    console.log(t.id);

    await this.postMessage(
      t.id,
      `ПИСЮН ФРИ ИГРУ ВЫЕБАЛ!!! https://dotaclassic.ru/matches/15703 
        На кунке пес сосун!!!! лени ПЫДОР https://dotaclassic.ru/players/116514945 и ЕБЛАНЧИ ТОЖЕ!!
        








Cras euismod dui turpis, id eleifend magna luctus quis. Vestibulum imperdiet at justo id ultrices. Vivamus bibendum ornare nunc. Ut volutpat lectus ac pellentesque ultrices. Praesent scelerisque suscipit orci vel mollis. Cras tempus rhoncus dui quis ullamcorper. In pretium laoreet nunc, placerat pellentesque turpis sollicitudin in.

`,
      '175751439',
    );
  }

  async postMessage(
    threadId: string,
    content: string,
    authorId: string,
  ): Promise<MessageEntity> {
    let thread = await this.threadEntityRepository.findOneOrFail({
      where: {
        id: threadId,
      },
    });

    const idx = await this.messageEntityRepository.count({
      where: {
        thread_id: thread.id,
      },
    });

    let msg = new MessageEntity();
    msg.thread_id = thread.id;
    msg.content = content;
    msg.author = authorId;
    msg.createdAt = new Date();
    msg.index = idx;

    msg = await this.messageEntityRepository.save(msg);

    this.redisEventQueue.emit(
      MessageCreatedEvent.name,
      new MessageCreatedEvent(
        msg.thread_id,
        thread.external_id,
        msg.id,
        msg.author,
        msg.createdAt.toUTCString(),
        msg.content,
        msg.index,
      ),
    );

    return msg;
  }

  async getMessages(
    thread_id: string,
    after: number | undefined,
    limit: number,
  ): Promise<MessageEntity[]> {
    let query = this.messageEntityRepository
      .createQueryBuilder('me')
      .innerJoinAndSelect('me.thread', 'thread')
      .where('thread.external_id = :thread_id', { thread_id });

    if (after)
      query = query.andWhere('me.created_at >= :after', {
        after: new Date(after),
      });

    return query.take(limit).getMany();
  }

  async getOrCreateThread(
    threadType: ThreadType,
    externalId: string,
    title: string,
  ): Promise<ThreadEntity> {
    const q = this.threadEntityRepository
      .createQueryBuilder('te')
      .leftJoin(MessageEntity, 'me', 'te.id = me.thread_id')
      .addSelect('count(me)', 'messageCount')
      .addSelect(
        `sum((me.created_at <= NOW() - '24 hours'::interval)::int)`,
        'newMessageCount',
      )
      .where({ thread_type: threadType, external_id: externalId })
      .groupBy('te.id, te.external_id, te.thread_type, te.title');

    const t = await q.getOne();

    if (!t) {
      const t = new ThreadEntity();
      t.external_id = externalId;
      t.thread_type = threadType;
      t.title = title;
      await this.threadEntityRepository.save(t);
    }

    return q.getOneOrFail();
  }
}
