import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './model/message.entity';
import { Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import {
  CreateMessageDTO,
  CreateThreadDTO,
  MessageDTO,
  SortOrder,
  ThreadDTO,
  ThreadPageDto,
} from './dto/forum.dto';
import { ForumService } from './forum.service';
import { ForumMapper } from './forum.mapper';
import { NullableIntPipe } from '../util/pipes';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ThreadType } from '../gateway/shared-types/thread-type';

@Controller('forum')
@ApiTags('forum')
export class ForumController {
  private readonly logger = new Logger(ForumController.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    private readonly fs: ForumService,
    private readonly mapper: ForumMapper,
  ) {}

  @ApiQuery({
    name: 'page',
    required: true,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
  })
  @ApiQuery({
    name: 'threadType',
    required: false,
    enum: ThreadType,
    enumName: 'ThreadType',
  })
  @Get('threads')
  async threads(
    @Query('page', NullableIntPipe) page: number,
    @Query('perPage', NullableIntPipe) perPage: number = 25,
    @Query('threadType') threadType?: ThreadType,
  ): Promise<ThreadPageDto> {
    const [threads, pages] = await this.fs.getThreadPage(
      page,
      perPage,
      threadType,
    );

    return {
      data: threads.map(this.mapper.mapThread),
      page,
      perPage,
      pages,
    };
  }

  @Get('thread/:id')
  async getThread(@Param('id') id: string): Promise<ThreadDTO> {
    this.threadView(id);
    return this.fs.getThread(id).then(this.mapper.mapThread);
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
    if (threadDto.opMessage) {
      await this.fs.postMessage(
        thread.id,
        threadDto.opMessage.content,
        threadDto.opMessage.author,
      );
    }
    this.threadView(thread.id);

    return this.mapper.mapThread(
      await this.fs.getOrCreateThread(
        threadDto.threadType,
        threadDto.externalId,
        threadDto.title,
      ),
    );
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
  @ApiQuery({
    name: 'order',
    enum: SortOrder,
    enumName: 'SortOrder',
    required: false,
  })
  @Get('thread/:id/messages')
  async messages(
    @Param('id') id: string,
    @Query('after', NullableIntPipe) after?: number,
    @Query('limit', NullableIntPipe) limit: number = 10,
    @Query('order') order: SortOrder = SortOrder.ASC,
  ): Promise<MessageDTO[]> {
    this.threadView(id);
    return this.fs
      .getMessages(id, after, limit, order)
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

  @Delete('message/:id')
  async deleteMessage(@Param('id') id: string): Promise<MessageDTO> {
    return this.fs.deleteMessage(id).then(this.mapper.mapMessage);
  }

  @Get('healthcheck')
  async healthcheck() {
    return 'Yes im alive';
  }

  private threadView(id: string) {
    this.fs
      .threadView(id)
      .then(() => this.logger.log('Thread view registered'));
  }
}
