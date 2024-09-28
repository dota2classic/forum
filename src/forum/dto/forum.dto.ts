export class CreateMessageDTO {
  readonly author: string;
  readonly content: string;
}

export class MessageDTO {
         threadId: string;
         id: string;
         content: string;
         author: string;
         createdAt: string;
         index: number;
       }
