import {
  EmoticonDto as EmoticonDtoInner,
  MessageUpdatedEvent,
  ReactionEntry as ReactionEntryInner,
} from '../../gateway/events/message-updated.event';

export class UpdateMessageReactionDto {
  author: string;
  emoticonId: number;
}

export class EmoticonDto extends EmoticonDtoInner {
  id: number;
  code: string;

  bucket: string;
  key: string;
}

export class ReactionEntry extends ReactionEntryInner {
  emoticon: EmoticonDto;
  reacted: string[];
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
