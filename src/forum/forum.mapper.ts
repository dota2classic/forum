import { Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { ForumUserDTO, MessageDTO, ThreadDTO } from './dto/forum.dto';
import { ThreadEntity } from './model/thread.entity';
import { ForumUserEntity } from './model/forum-user.entity';

@Injectable()
export class ForumMapper {
  public mapMessage = (msg: MessageEntity): MessageDTO => ({
    id: msg.id,
    threadId: msg.thread_id,
    content: msg.content,
    author: msg.author,
    deleted: msg.deleted,
    createdAt: msg.created_at.toISOString(),
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
  public mapUser = async (
    value: ForumUserEntity & { messages: number },
  ): Promise<ForumUserDTO> =>
    ({
      muteUntil: value.muted_until.toISOString(),
      steamId: value.steam_id,
      messages: value.messages,
    }) satisfies ForumUserDTO;
}
