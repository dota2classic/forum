import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, DataSource, Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../gateway/events/message-created.event';
import { ThreadType } from '../gateway/shared-types/thread-type';
import { MessageUpdatedEvent } from '../gateway/events/message-updated.event';
import { SortOrder, UpdateThreadDTO } from './dto/forum.dto';
import { ForumUserEntity } from './model/forum-user.entity';
import { didExpire } from '../gateway/util/expired';
import { UserMutedException } from './exception/UserMutedException';
import { Role } from '../gateway/shared-types/roles';

@Injectable()
export class ForumService {
  private logger = new Logger(ForumService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    @InjectRepository(ForumUserEntity)
    private readonly forumUserEntityRepository: Repository<ForumUserEntity>,
    private dataSource: DataSource,
    private connection: Connection,
    private readonly ebus: EventBus,
  ) {}

  async postMessage(
    threadId: string,
    content: string,
    authorSteamId: string,
    authorRoles: Role[],
  ): Promise<MessageEntity> {
    await this.checkUserForWrite(authorSteamId);

    let thread: ThreadEntity = await this.threadEntityRepository.findOneOrFail({
      where: {
        id: threadId,
      },
    });

    if (thread.admin_only && !authorRoles.includes(Role.ADMIN))
      throw new ForbiddenException();

    const msg = await this.dataSource.transaction(async (transacManager) => {
      const idx = await transacManager.count(MessageEntity, {
        where: {
          thread_id: thread.id,
        },
      });

      let msg = new MessageEntity();
      msg.thread_id = thread.id;
      msg.content = content.trim();
      msg.author = authorSteamId;
      msg.created_at = new Date();

      return transacManager.save(msg);
    });

    this.ebus.publish(
      new MessageCreatedEvent(
        msg.thread_id,
        thread.external_id,
        msg.id,
        msg.author,
        msg.created_at.toUTCString(),
        msg.content,
      ),
    );

    return msg;
  }

  async getMessages(
    thread_id: string,
    after: number | undefined,
    limit: number,
    order: SortOrder,
  ): Promise<MessageEntity[]> {
    let query = this.messageEntityRepository
      .createQueryBuilder('me')
      .innerJoinAndSelect('me.thread', 'thread')
      .where('thread.id = :thread_id', { thread_id })
      .andWhere('me.deleted = false')
      .orderBy('me.created_at', order);

    if (after)
      query = query.andWhere('me.created_at >= :after', {
        after: new Date(after),
      });

    return query.take(limit).getMany();
  }

  async getMessagesPage(thread_id: string, page: number, perPage: number) {
    return this.messageEntityRepository
      .createQueryBuilder('me')
      .innerJoinAndSelect('me.thread', 'thread')
      .where('thread.id = :thread_id', { thread_id })
      .andWhere('me.deleted = false')
      .orderBy('me.created_at', 'ASC')
      .take(perPage)
      .skip(page * perPage)
      .getManyAndCount();
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
      .orderBy('te.pinned', 'DESC')
      .addOrderBy('lm.created_at', 'DESC')
      .where(threadType ? { thread_type: threadType } : {})
      .having('COUNT(me) > 0')
      .skip(perPage * page)
      .take(perPage);

    return q.getManyAndCount();
  }

  getThread(id: string): Promise<ThreadEntity> {
    return this.getThreadBaseQuery(false)
      .where({
        id,
      })
      .getOneOrFail();
  }

  // Probably very bad cause constant locking. Need to implement via stacking queue or something.
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

  private getThreadBaseQuery(withLastMessage: boolean = true) {
    const baseQuery = this.threadEntityRepository
      .createQueryBuilder('te')
      .leftJoin(MessageEntity, 'me', 'te.id = me.thread_id')
      .leftJoin(MessageEntity, 'op', 'te.id = op.thread_id and op.index = 0')
      .addSelect('count(me)', 'messageCount')
      .addSelect(
        `sum((me.created_at >= NOW() - '8 hours'::interval)::int)`,
        'newMessageCount',
      )
      .addSelect('op.author', 'originalPoster')
      .groupBy(
        'te.id, te.external_id, te.thread_type, te.title, op.author, op.id',
      );

    if (withLastMessage)
      return baseQuery
        .leftJoinAndMapOne(
          'te.lastMessage',
          'last_message_view',
          'lm',
          `lm.thread_id = te.id and lm.deleted = false`,
        )
        .addGroupBy(
          'lm.id, lm.author, lm.index, lm.deleted, lm.content, lm.created_at, lm.thread_id',
        );

    return baseQuery;
  }

  public async deleteMessage(id: string) {
    const some: MessageEntity[] = (
      await this.messageEntityRepository
        .createQueryBuilder()
        .update(MessageEntity)
        .set({
          deleted: true,
        })
        .returning('*')
        .where({ id })
        .execute()
    ).raw;

    const msg = some[0];
    this.ebus.publish(
      new MessageUpdatedEvent(
        msg.thread_id,
        msg.id,
        msg.author,
        msg.created_at.toUTCString(),
        msg.content,
        msg.deleted,
      ),
    );

    return msg;
  }

  public async updateThread(id: string, dto: UpdateThreadDTO) {
    const result = await this.threadEntityRepository
      .createQueryBuilder('te')
      .update()
      .set({
        pinned: dto.pinned,
      })
      .where({ id })
      .execute();

    return this.getThreadBaseQuery().where({ id }).getOne();
  }

  public async updateUser(steamId: string, muteUntil: string | undefined) {
    return this.forumUserEntityRepository.upsert(
      {
        muted_until: muteUntil ? new Date(muteUntil) : undefined,
        steam_id: steamId,
      },
      ['steam_id'],
    );
  }

  public async checkUserForWrite(steamId: string | undefined) {
    if (!steamId) return;

    const author = await this.forumUserEntityRepository.findOne({
      where: { steam_id: steamId },
    });
    if (!author) return;

    const muteExpired =
      author.muted_until === undefined || didExpire(author.muted_until);

    if (!muteExpired) throw new UserMutedException(author.muted_until);
  }
}
