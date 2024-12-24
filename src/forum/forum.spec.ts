import { ThreadEntity } from './model/thread.entity';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { MessageEntity } from './model/message.entity';
import { ForumController } from './forum.controller';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ForumUserEntity } from './model/forum-user.entity';
import { NestApplication } from '@nestjs/core';
import { ForumMapper } from './forum.mapper';
import { withPostgres, withRedis } from '../@test/containers';
import { CqrsModule } from '@nestjs/cqrs';
import { AppService } from '../app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { StartedRedisContainer } from '@testcontainers/redis';
import { ThreadType } from '../gateway/shared-types/thread-type';
import { LastMessageView } from './model/last-message.view';

describe('somethin', () => {
  jest.setTimeout(60000);
  let mrep: Repository<MessageEntity>;
  let trep: Repository<ThreadEntity>;
  let fc: ForumController;

  let postgres: StartedPostgreSqlContainer;
  let redis: StartedRedisContainer;

  let module: TestingModule;
  let app: NestApplication;

  let controller: ForumController;
  let mapper: ForumMapper;

  beforeAll(async () => {
    const Entities = [
      MessageEntity,
      ThreadEntity,
      ForumUserEntity,
      LastMessageView,
    ];

    const [_container, imports] = await withPostgres(Entities);
    postgres = _container;
    redis = await withRedis();

    module = await Test.createTestingModule({
      imports: [
        ...imports,
        CqrsModule.forRoot(),
        ClientsModule.register([
          {
            name: 'QueryCore',
            transport: Transport.REDIS,
            options: {
              host: redis.getHost(),
              port: redis.getPort(),
              retryAttempts: Infinity,
              password: redis.getPassword(),
              retryDelay: 5000,
            },
          },
        ]),
      ],
      controllers: [ForumController],
      providers: [ForumService, ForumMapper, AppService],
    }).compile();

    controller = module.get(ForumController);
    mapper = module.get(ForumMapper);
    app = module.createNestApplication();
    await app.init();
  });

  it('should spin up', () => {});

  it('should do pagination', async () => {
    const thread = await controller.getThreadForKey({
      externalId: 'ext1',
      threadType: ThreadType.FORUM,
      title: 'Thread1',
    });

    expect(thread).toBeDefined();

    const fs = app.get(ForumService);
    const messages = await Promise.all(
      new Array(500)
        .fill(null)
        .map((_, index) =>
          fs.postMessage(
            thread.id,
            `Message #${index}`,
            `1000000${index % 10}`,
            [],
          ),
        ),
    );

    // Should have 500 unique indexes
    // const res = await request(app.getHttpServer())
    //   .get(`/forum/thread/${thread.id}`)
    //   .expect(200);
    // expect(res.body).toMatchObject({
    //   lastMessage: mapper.mapMessage(
    //     messages.sort(
    //       (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    //     )[0],
    //   ),
    // } satisfies Partial<ThreadDTO>);
  });
});
