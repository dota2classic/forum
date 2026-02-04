import { Injectable } from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { ForumUserDTO, ThreadDTO } from './dto/forum.dto';
import { ThreadEntity } from './model/thread.entity';
import { ForumUserEntity } from './model/forum-user.entity';
import { ReactionEntity } from './model/reaction.entity';
import { EmoticonService } from './emoticon.service';
import { EmoticonEntity } from './model/emoticon.entity';
import { MessageDTO } from './dto/message.dto';
import {
  EmoticonDto,
  MessageUpdatedEvent,
  ReactionEntry,
} from '../gateway/events/message-updated.event';

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
    const m: Record<number, string[]> = {};
    for (let reaction of reactions) {
      m[reaction.emoticonId] = (m[reaction.emoticonId] || []).concat([
        reaction.author,
      ]);
    }
    return Object.entries(m).map(([key, reacted]) => ({
      emoticon: this.mapEmoticon(this.emoticonService.resolve(parseInt(key))),
      reacted,
    }));
  };

  public mapMessage = (msg: MessageEntity): MessageDTO => ({
    id: msg.id,
    threadId: msg.thread_id,
    content: msg.content,
    author: msg.author,
    deleted: msg.deleted,
    edited: msg.edited,
    createdAt: msg.created_at.toISOString(),
    updatedAt: msg.updated_at.toISOString(),
    repliedMessage: msg.reply ? this.mapMessage(msg.reply) : undefined,
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
      pinnedMessage:
        existing.pinned_message && this.mapMessage(existing.pinned_message),
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

  mapMessageToEvent = (msg: MessageDTO): MessageUpdatedEvent =>
    new MessageUpdatedEvent(
      msg.threadId,
      msg.id,
      msg.author,
      msg.createdAt,
      msg.updatedAt,
      msg.content,
      msg.deleted,
      msg.edited,
      msg.repliedMessage
        ? this.mapMessageToEvent(msg.repliedMessage)
        : undefined,
      msg.reactions,
    );
}
