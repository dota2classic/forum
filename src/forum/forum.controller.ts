import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './model/message.entity';
import { Repository } from 'typeorm';
import { ThreadEntity } from './model/thread.entity';
import {
  CreateMessageDTO,
  CreateThreadDTO,
  ForumUserDTO,
  MessageDTO,
  MessagePageDTO,
  SortOrder,
  ThreadDTO,
  ThreadPageDto,
  UpdateThreadDTO,
  UpdateUserDTO,
} from './dto/forum.dto';
import { ForumService } from './forum.service';
import { ForumMapper } from './forum.mapper';
import { NullableIntPipe } from '../util/pipes';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ThreadType } from '../gateway/shared-types/thread-type';
import { makePage } from '../gateway/util/make-page';

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
    @Req() req: any,
    @Query('page', NullableIntPipe) page: number,
    @Query('perPage', NullableIntPipe) perPage: number = 25,
    @Query('threadType') threadType?: ThreadType,
  ): Promise<ThreadPageDto> {
    const [threads, cnt] = await this.fs.getThreadPage(
      page,
      perPage,
      threadType,
    );

    return makePage(threads, cnt, page, perPage, this.mapper.mapThread);
  }

  @Get('thread/:id')
  async getThread(@Param('id') id: string): Promise<ThreadDTO> {
    this.threadView(id);
    return this.fs.getThread(id).then(this.mapper.mapThread);
  }

  @ApiBearerAuth()
  @Post('thread')
  async getThreadForKey(
    @Body() threadDto: CreateThreadDTO,
  ): Promise<ThreadDTO> {
    await this.fs.checkUserForWrite(threadDto.op);

    const thread = await this.fs.getOrCreateThread(
      threadDto.threadType,
      threadDto.externalId,
      threadDto.title,
    );
    this.threadView(thread.id);
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

  @ApiParam({
    name: 'id',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    required: true,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
  })
  @Get('thread/:id/page')
  async messagesPage(
    @Param('id') id: string,
    @Query('page', NullableIntPipe) page: number,
    @Query('perPage', NullableIntPipe) perPage: number = 15,
  ): Promise<MessagePageDTO> {
    this.threadView(id);
    const [msgs, cnt] = await this.fs.getMessagesPage(id, page, perPage);
    return makePage(msgs, cnt, page, perPage, this.mapper.mapMessage);
  }

  @Post('thread/:id/message')
  async postMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDTO,
  ): Promise<MessageDTO> {
    return this.fs
      .postMessage(id, dto.content, dto.author.steam_id, dto.author.roles)
      .then(this.mapper.mapMessage);
  }

  @Delete('message/:id')
  async deleteMessage(@Param('id') id: string): Promise<MessageDTO> {
    return this.fs.deleteMessage(id).then(this.mapper.mapMessage);
  }

  @Patch('thread/:id')
  async updateThread(
    @Param('id') id: string,
    @Body() dto: UpdateThreadDTO,
  ): Promise<ThreadDTO> {
    return this.fs.updateThread(id, dto).then(this.mapper.mapThread);
  }

  @Get('healthcheck')
  async healthcheck() {
    return 'Yes im alive';
  }

  @Post('/user/:id')
  public async updateUser(
    @Param('id') steam_id: string,
    @Body() dto: UpdateUserDTO,
  ) {
    await this.fs.updateUser(steam_id, dto.muteUntil);
  }

  @Get('/user/:id')
  public async getUser(@Param('id') steam_id: string): Promise<ForumUserDTO> {
    return this.fs.getUser(steam_id).then(this.mapper.mapUser);
  }

  private threadView(id: string) {
    this.fs
      .threadView(id)
      .then(() => this.logger.log('Thread view registered'));
  }
}
