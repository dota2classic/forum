import { Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { MessageDTO } from './dto/forum.dto';

@Injectable()
export class ForumMapper {
  public mapMessage = (msg: MessageEntity): MessageDTO => ({
    id: msg.id,
    threadId: msg.thread_id,
    content: msg.content,
    author: msg.author,
    index: msg.index,
    createdAt: msg.createdAt.toUTCString(),
  });
}
