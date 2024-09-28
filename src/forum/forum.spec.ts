import { ThreadEntity } from './model/thread.entity';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { MessageEntity } from './model/message.entity';
import { ForumController } from './forum.controller';

describe('somethin', () => {
  let module: TestingModule;
  let mrep: Repository<MessageEntity>;
  let trep: Repository<ThreadEntity>;
  let fc: ForumController;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // TypeOrmModule.forRoot(testDbConfig),
        // TypeOrmModule.forFeature(Entities),
      ],
      providers: [ForumService],
      controllers: [ForumController],
    }).compile();

    // trep = module.get<Repository<ThreadEntity>>(
    //   getRepositoryToken(ThreadEntity),
    // ) as any;
    //
    // mrep = module.get<Repository<MessageEntity>>(
    //   getRepositoryToken(MessageEntity),
    // ) as any;
  });

  it('should say hello', () => {
    // expect(fc.getThread("fsdf")).rejects.toBeTruthy()
  });
});
