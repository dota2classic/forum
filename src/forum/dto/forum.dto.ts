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
  readonly externalKey: string;
}

export class ThreadDTO {
  readonly id: string;
  readonly externalId: string;
  // readonly title: string;
  // readonly messages: number;
  // readonly newMessages: number;
}
