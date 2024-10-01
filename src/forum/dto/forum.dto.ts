import { ThreadType } from '../../gateway/shared-types/thread-type';
import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../gateway/shared-types/page';

export class CreateMessageDTO {
  readonly author: string;
  readonly content: string;
}

export class MessageDTO {
  threadId: string;
  externalThreadId: string;
  id: string;
  content: string;
  author: string;
  createdAt: string;
  index: number;
}

export class CreateThreadDTO {
  readonly externalId: string;
  @ApiProperty({ enum: ThreadType, enumName: 'ThreadType' })
  readonly threadType: ThreadType;
  readonly title: string;
}

export class ThreadDTO {
  readonly id: string;
  readonly externalId: string;
  readonly threadType: string;
  readonly title: string;

  readonly messageCount: number;
  readonly newMessageCount: number;
}

export class ThreadPageDto extends Page<ThreadDTO> {
  data: ThreadDTO[];
  perPage: number;
  page: number;
  pages: number;
}
