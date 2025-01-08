import { ThreadType } from '../../gateway/shared-types/thread-type';
import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../gateway/shared-types/page';
import { Role } from '../../gateway/shared-types/roles';
import { MessageDTO } from './message.dto';

export interface JwtPayload {
  steam_id: string;
  roles: Role[];
}

export class CreateMessageDTO {
  readonly author: JwtPayload;
  readonly content: string;
  readonly replyMessageId?: string;
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class MessagePageDTO extends Page<MessageDTO> {
  data: MessageDTO[];
  perPage: number;
  page: number;
  pages: number;
}

export class CreateThreadDTO {
  readonly externalId: string;
  @ApiProperty({ enum: ThreadType, enumName: 'ThreadType' })
  readonly threadType: ThreadType;
  readonly title: string;

  readonly op?: string;
}

export class ThreadDTO {
  readonly id: string;
  readonly externalId: string;

  @ApiProperty({ enum: ThreadType, enumName: 'ThreadType' })
  readonly threadType: ThreadType;
  readonly title: string;

  readonly views: number;
  readonly pinned: boolean;
  readonly adminOnly: boolean;

  readonly messageCount: number;
  readonly newMessageCount: number;
  readonly originalPoster?: string;

  readonly lastMessage?: MessageDTO;
}

export class ThreadPageDto extends Page<ThreadDTO> {
  data: ThreadDTO[];
  perPage: number;
  page: number;
  pages: number;
}

export class UpdateThreadDTO {
  pinned: boolean;
}

export class UpdateUserDTO {
  muteUntil: string;
}

export class ForumUserDTO {
  steamId: string;
  muteUntil: string;
  messages: number;
}
