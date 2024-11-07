import { Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { MessageDTO, ThreadDTO } from './dto/forum.dto';
import { ThreadEntity } from './model/thread.entity';

@Injectable()
export class ForumMapper {
  public mapMessage = (msg: MessageEntity): MessageDTO => ({
    id: msg.id,
    threadId: msg.thread_id,
    content: msg.content,
    author: msg.author,
    index: msg.index,
    deleted: msg.deleted,
    createdAt: msg.created_at.toUTCString(),
  });

  public mapThread = (existing: ThreadEntity): ThreadDTO => {
    return {
      id: existing.id,
      externalId: existing.external_id,
      threadType: existing.thread_type,
      title: existing.title,
      messageCount: existing.messageCount,
      views: existing.views,
      pinned: existing.pinned,
      adminOnly: existing.admin_only,
      newMessageCount: existing.newMessageCount,
      originalPoster: existing.originalPoster,
      lastMessage:
        existing.lastMessage && this.mapMessage(existing.lastMessage),
    };
  };
}
