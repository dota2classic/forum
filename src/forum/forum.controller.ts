import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './model/message.entity';
import { Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import {
  CreateMessageDTO,
  CreateThreadDTO,
  MessageDTO,
  ThreadDTO,
} from './dto/forum.dto';
import { ForumService } from './forum.service';
import { ForumMapper } from './forum.mapper';
import { NullableIntPipe } from '../util/pipes';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('forum')
@ApiTags('forum')
export class ForumController {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    private readonly fs: ForumService,
    private readonly mapper: ForumMapper,
  ) {}

  @Get('thread/:id')
  async getThread(@Param('id') id: string): Promise<ThreadDTO> {
    return this.threadEntityRepository
      .findOneOrFail({
        where: {
          id,
        },
      })
      .then(this.mapper.mapThread);
  }

  @Post('thread')
  async getThreadForKey(
    @Body() threadDto: CreateThreadDTO,
  ): Promise<ThreadDTO> {
    const thread = await this.fs.getOrCreateThread(
      threadDto.threadType,
      threadDto.externalId,
      threadDto.title,
    );
    return this.mapper.mapThread(thread);
  }

  @ApiParam({
    name: 'id',
    required: true,
  })
  @ApiQuery({
    name: 'after',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  @Get('thread/:id/messages')
  async messages(
    @Param('id') id: string,
    @Query('after', NullableIntPipe) after?: number,
    @Query('limit', NullableIntPipe) limit: number = 10,
  ): Promise<MessageDTO[]> {
    return this.fs
      .getMessages(id, after, limit)
      .then((it) => it.map(this.mapper.mapMessage));
  }

  @Post('thread/:id/message')
  async postMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDTO,
  ): Promise<MessageDTO> {
    return this.fs
      .postMessage(id, dto.content, dto.author)
      .then(this.mapper.mapMessage);
  }
}
