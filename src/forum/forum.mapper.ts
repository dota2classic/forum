import { Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { ForumUserDTO, ThreadDTO } from './dto/forum.dto';
import { ThreadEntity } from './model/thread.entity';
import { ForumUserEntity } from './model/forum-user.entity';
import { EmoticonDto, MessageDTO, ReactionEntry } from './dto/message.dto';
import { ReactionEntity } from './model/reaction.entity';
import { EmoticonService } from './emoticon.service';
import { EmoticonEntity } from './model/emoticon.entity';

@Injectable()
export class ForumMapper {
  constructor(private readonly emoticonService: EmoticonService) {}

  public mapEmoticon = (emoticon: EmoticonEntity): EmoticonDto => ({
    bucket: emoticon.bucket,
    key: emoticon.key,
    code: emoticon.code,
    id: emoticon.id,
  });

  public mapReactions = (
    reactions: ReactionEntity[] | undefined,
  ): ReactionEntry[] => {
    if (!reactions) return [];
    const m: Record<number, number> = {};
    for (let reaction of reactions) {
      m[reaction.emoticonId] = (m[reaction.emoticonId] || 0) + 1;
    }
    return Object.entries(m).map(([key, value]) => ({
      emoticon: this.mapEmoticon(this.emoticonService.resolve(parseInt(key))),
      count: value,
    }));
  };

  public mapMessage = (msg: MessageEntity): MessageDTO => ({
    id: msg.id,
    threadId: msg.thread_id,
    content: msg.content,
    author: msg.author,
    deleted: msg.deleted,
    createdAt: msg.created_at.toISOString(),
    reactions: this.mapReactions(msg.reactions),
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
