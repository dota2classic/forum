import { Inject, Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../gateway/events/message-created.event';
import { ClientProxy } from '@nestjs/microservices';
import { ThreadType } from '../gateway/shared-types/thread-type';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    private readonly ebus: EventBus,
    @Inject('QueryCore') private readonly redisEventQueue: ClientProxy,
  ) {}

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
    msg.created_at = new Date();
    msg.index = idx;

    msg = await this.messageEntityRepository.save(msg);

    this.redisEventQueue.emit(
      MessageCreatedEvent.name,
      new MessageCreatedEvent(
        msg.thread_id,
        thread.external_id,
        msg.id,
        msg.author,
        msg.created_at.toUTCString(),
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
      .where('thread.id = :thread_id', { thread_id });

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
    const q = this.getThreadBaseQuery().where({
      thread_type: threadType,
      external_id: externalId,
    });

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

  public async getThreadPage(
    page: number,
    perPage: number,
    threadType?: ThreadType,
  ): Promise<[ThreadEntity[], number]> {
    const q = this.getThreadBaseQuery()
      .orderBy('lm.created_at', 'DESC')
      .where(threadType ? { thread_type: threadType } : {})
      .having('COUNT(me) > 0')
      .skip(perPage * page)
      .take(perPage);

    return q.getManyAndCount();
  }

  getThread(id: string): Promise<ThreadEntity> {
    return this.getThreadBaseQuery()
      .where({
        id,
      })
      .getOneOrFail();
  }

  public async threadView(id: string) {
    await this.threadEntityRepository
      .createQueryBuilder()
      .update(ThreadEntity)
      .set({
        views: () => 'views + 1',
      })
      .where({ id })
      .execute();
  }

  private getThreadBaseQuery() {
    return this.threadEntityRepository
      .createQueryBuilder('te')
      .leftJoin(MessageEntity, 'me', 'te.id = me.thread_id')
      .leftJoin(MessageEntity, 'op', 'te.id = op.thread_id and op.index = 0')
      .leftJoinAndMapOne(
        'te.lastMessage',
        MessageEntity,
        'lm',
        `lm.thread_id = te.id and ` +
          `lm.index = (
    SELECT ilm.index
    FROM message_entity ilm
    WHERE ilm.thread_id = te.id
    ORDER BY index DESC
    limit 1
)`,
      )
      .addSelect('count(me)', 'messageCount')
      .addSelect(
        `sum((me.created_at >= NOW() - '8 hours'::interval)::int)`,
        'newMessageCount',
      )
      .addSelect('op.author', 'originalPoster')
      .groupBy(
        'te.id, te.external_id, te.thread_type, te.title, op.author, op.id, lm.id, lm.author, lm.index, lm.content, lm.created_at, lm.thread_id',
      );
  }
}
