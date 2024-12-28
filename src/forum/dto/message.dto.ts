import { MessageUpdatedEvent } from '../../gateway/events/message-updated.event';

export class UpdateMessageReactionDto {
  author: string;
  emoticonId: number;
}

export class EmoticonDto {
  id: number;
  code: string;

  bucket: string;
  key: string;
}

export class ReactionEntry {
  emoticon: EmoticonDto;
  count: number;
}

export class MessageDTO extends MessageUpdatedEvent {
  threadId: string;
  id: string;
  content: string;
  author: string;
  createdAt: string;
  deleted: boolean;

  reactions: ReactionEntry[];
}
