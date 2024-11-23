import { ViewColumn, ViewEntity } from 'typeorm';
import { Message } from './message';

@ViewEntity({
  name: 'last_message_view',
  expression: `
  select mc.*
from message_entity mc
         left join message_entity next_message
                   on mc.thread_id = next_message.thread_id and
                      next_message.created_at > mc.created_at and next_message.deleted = false
where next_message.thread_id is null and mc.deleted = false
                      `,
})
export class LastMessageView implements Message {
  @ViewColumn()
  author: string;

  @ViewColumn()
  content: string;

  @ViewColumn()
  created_at: Date;

  @ViewColumn()
  deleted: boolean;

  @ViewColumn()
  id: string;

  @ViewColumn()
  index: number;

  @ViewColumn()
  thread_id: string;
}
