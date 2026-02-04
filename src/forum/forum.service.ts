import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, DataSource, Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import { EventBus } from '@nestjs/cqrs';
import { ThreadType } from '../gateway/shared-types/thread-type';
import { SortOrder, UpdateThreadDTO } from './dto/forum.dto';
import { ForumUserEntity } from './model/forum-user.entity';
import { didExpire } from '../gateway/util/expired';
import { UserMutedException } from './exception/UserMutedException';
import { Role } from '../gateway/shared-types/roles';
import { LastMessageView } from './model/last-message.view';
import { ForumSqlFactory } from './forum-sql.factory';
import { ThreadStatsView } from './model/thread-stats.view';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ForumMapper } from './forum.mapper';

@Injectable()
export class ForumService {
  private logger = new Logger(ForumService.name);

  private threadViewMap = new Map<string, number>();

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
    private readonly mapper: ForumMapper,
    @InjectRepository(ThreadStatsView)
    private readonly threadStatsViewRepository: Repository<ThreadStatsView>,
  ) {}

  async postMessage(
    threadId: string,
    content: string,
    replyMessageId: string | undefined,
    authorSteamId: string,
    authorRoles: Role[],
  ): Promise<MessageEntity> {
    await this.checkUserForWrite(authorSteamId);

    let thread: ThreadEntity = await this.threadEntityRepository.findOne({
      where: {
        id: threadId,
      },
    });

    if (thread.admin_only && !authorRoles.includes(Role.ADMIN))
      throw new ForbiddenException();

    let repliedMessage: MessageEntity | undefined;

    if (replyMessageId) {
      repliedMessage = await this.messageEntityRepository.findOne({
        where: {
          id: replyMessageId,
          deleted: false,
          thread_id: threadId,
        },
      });

      if (!repliedMessage) {
        throw new ConflictException('Bad reply message');
      }
    }

    let msg = new MessageEntity();
    msg.thread_id = thread.id;
    msg.content = content.trim();
    msg.author = authorSteamId;
    msg.created_at = new Date();
    msg.updated_at = new Date();
    msg.reply_message_id = repliedMessage?.id;

    return this.messageEntityRepository.save(msg).then((saved) => {
      saved.reply = repliedMessage;
      return saved;
    });
  }

  public async getMessagesNew(
    threadId: string,
    limit: number,
    cursor: string | undefined,
    order: SortOrder,
  ) {
    cursor = cursor || new Date().toISOString();
    let query = this.messageEntityRepository
      .createQueryBuilder('me')
      .innerJoinAndSelect('me.thread', 'thread')
      .leftJoinAndSelect('me.reactions', 'reactions', 'reactions.active')
      .leftJoinAndSelect('me.reply', 'reply', 'not reply.deleted')
      .where('thread.id = :thread_id', { thread_id: threadId })
      .andWhere('me.deleted = false');

    if (order === SortOrder.ASC) {
      // we want to load newer messages
      query = query
        .andWhere('me.created_at > :cursor', { cursor })
        .orderBy('me.created_at', 'ASC');
    } else {
      query = query
        .andWhere('me.created_at < :cursor', { cursor })
        .orderBy('me.created_at', 'DESC');
    }

    return query.take(limit).getMany();
  }

  public async getLatestPage(
    thread_id: string,
    perPage: number,
  ): Promise<[MessageEntity[], number, string]> {
    return this.getMessagesPage(
      thread_id,
      -1,
      perPage,
      undefined,
      SortOrder.ASC,
    );
  }

  async getMessagesPage(
    thread_id: string,
    page: number,
    perPage: number,
    cursor: string | undefined,
    order: SortOrder = SortOrder.ASC,
  ): Promise<[MessageEntity[], number, string]> {
    // Quick lookup
    let count = await this.threadStatsViewRepository
      .findOne({
        where: {
          threadId: thread_id,
        },
      })
      .then((t) => (t ? { count: t.messageCount } : undefined));

    if (!count) {
      // Total message count
      count = await this.dataSource
        .query<
          {
            count: number;
          }[]
        >(ForumSqlFactory.getThreadMessageCountRequest(), [thread_id])
        .then((t) => t[0]);
    }

    if (page === -1) {
      page = Math.max(0, Math.ceil(count.count / perPage) - 1);
    }

    let messageIds: string[];

    if (cursor) {
      messageIds = await this.dataSource
        .query<
          { id: string }[]
        >(ForumSqlFactory.getThreadMessagePageCursorIds(order), [thread_id, cursor, perPage])
        .then((it) => it.map((z) => z.id));
    } else {
      messageIds = await this.dataSource
        .query<
          { id: string }[]
        >(ForumSqlFactory.getThreadMessagePageIds(), [thread_id, page * perPage, perPage])
        .then((it) => it.map((z) => z.id));
    }

    if (messageIds.length === 0) {
      return [[], count.count, cursor];
    }

    let items = await this.messageEntityRepository
      .createQueryBuilder('me')
      .innerJoinAndSelect('me.thread', 'thread')
      .leftJoinAndSelect('me.reply', 'reply', 'not reply.deleted')
      .leftJoinAndSelect('me.reactions', 'reactions', 'reactions.active')
      .orderBy('me.created_at', order === SortOrder.ASC ? 'ASC' : 'DESC')
      .where('me.id in (:...ids)', { ids: messageIds })
      .getMany();

    return [items, count.count, cursor];
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
    } else {
      return t;
    }

    return q.getOne();
  }

  getThread(id: string): Promise<ThreadEntity> {
    const thread = this.getThreadBaseQuery(false)
      .where({
        id,
      })
      .getOne();
    if (!thread) {
      throw new HttpException('Thread not found', 404);
    }
    return thread;
  }

  public async getThreadPage(
    page: number,
    perPage: number,
    opSteamId?: string,
    threadType?: ThreadType,
  ): Promise<[ThreadEntity[], number]> {
    const count: { cnt: number }[] = await this.threadEntityRepository.query(
      `
SELECT COUNT(DISTINCT te.id)::int AS "cnt"
from thread_entity te
${opSteamId === undefined ? '' : 'inner join last_message_view_materialized op on op.thread_id = te.id and op.is_last = false and op.author = $2'}
where te.thread_type = $1`,
      [threadType, ...(opSteamId ? [opSteamId] : [])],
    );

    const ids: { id: string; pinned: boolean; created_at: string }[] =
      await this.messageEntityRepository.query(
        `
    SELECT DISTINCT thread_seq.id,
                thread_seq.pinned,
                thread_seq.created_at
FROM
  (WITH last_messages AS
     (SELECT me.thread_id AS thread_id,
             max(me.created_at) AS created_at
      FROM message_entity me
      WHERE me.deleted = FALSE
      GROUP BY 1) SELECT te.id,
                         te.pinned,
                         lm.created_at
   FROM thread_entity te
   LEFT JOIN last_messages lm ON lm.thread_id = te.id
   ${opSteamId === undefined ? '' : 'inner join last_message_view_materialized op on op.thread_id = te.id and op.is_last = false and op.author = $4'}
   WHERE te.thread_type = $1) thread_seq
ORDER BY thread_seq.pinned DESC,
         thread_seq.created_at DESC
OFFSET $2
LIMIT $3
    `,
        [
          threadType,
          perPage * page,
          perPage,
          ...(opSteamId ? [opSteamId] : []),
        ],
      );

    const realThreads =
      ids.length === 0
        ? []
        : await this.getThreadBaseQuery()
            .orderBy('te.pinned', 'DESC')
            .addOrderBy('lm.created_at', 'DESC')
            .where('te.id in (:...ids)', { ids: ids.map((it) => it.id) })
            .getMany();

    return [realThreads, count[0].cnt];
  }

  public threadView(id: string) {
    this.threadViewMap.set(id, (this.threadViewMap.get(id) || 0) + 1);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  public async saveThreadViews() {
    const jobs = Array.from(this.threadViewMap.entries()).map(
      ([threadId, views]) =>
        this.threadEntityRepository
          .createQueryBuilder()
          .update(ThreadEntity)
          .set({
            views: () => `views + ${views}`,
          })
          .where({ id: threadId })
          .execute(),
    );
    await Promise.all(jobs)
      .catch((e) => {
        this.logger.error('There was an issue saving thread views!', e);
      })
      .then(() => {
        this.logger.log(
          `ThreadViews updated for ${Array.from(this.threadViewMap.keys()).length}`,
        );
        this.threadViewMap.clear();
      });
  }

  public async pinMessage(id: string) {
    const msg = await this.messageEntityRepository.findOneBy({
      id,
    });
    if (!msg) {
      throw new NotFoundException();
    }

    await this.threadEntityRepository.update(
      {
        id: msg.thread_id,
      },
      {
        pinnedMessageId: msg.id,
      },
    );
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

    this.ebus.publish(
      this.mapper.mapMessageToEvent(this.mapper.mapMessage(some[0])),
    );

    return some[0];
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

  public async updateUser(steamId: string, muteUntil: string) {
    return this.forumUserEntityRepository.upsert(
      {
        muted_until: new Date(muteUntil),
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

  public async getUser(steam_id: string) {
    const user = (await this.forumUserEntityRepository.findOne({
      where: { steam_id },
    })) || {
      steam_id: steam_id,
      muted_until: new Date(new Date().getTime() - 10000000),
    };

    return {
      ...user,
      messages: await this.messageEntityRepository.count({
        where: { author: steam_id },
      }),
    };
  }

  private getThreadBaseQuery(withLastMessage: boolean = true) {
    let baseQuery = this.threadEntityRepository
      .createQueryBuilder('te')
      .leftJoinAndSelect('te.pinned_message', 'pm')
      .leftJoin(ThreadStatsView, 'ts', 'ts.thread_id = te.id')
      .addSelect('ts.message_count', 'messageCount')
      .addSelect(`ts.new_message_count`, 'newMessageCount')

      .groupBy(
        'te.id, te.external_id, te.thread_type, te.title, ts.message_count, ts.new_message_count',
      );

    baseQuery = baseQuery
      .leftJoin(
        LastMessageView,
        'op',
        `op.thread_id = te.id and op.is_last = false`,
      )
      .addSelect('op.author', 'originalPoster')
      .addGroupBy('op.author');

    if (withLastMessage)
      return baseQuery
        .leftJoinAndMapOne(
          'te.lastMessage',
          LastMessageView,
          'lm',
          `lm.thread_id = te.id and lm.is_last = true`,
        )
        .addGroupBy(
          'lm.id, lm.author, lm.deleted, lm.content, lm.updated_at, lm.created_at, lm.thread_id, lm.is_last',
        );

    return baseQuery;
  }
}
