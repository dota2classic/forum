import { ViewColumn, ViewEntity } from 'typeorm';
import { Message } from './message';

@ViewEntity({
  name: 'last_message_view',
  expression: `with latest as (select max(me.created_at) as latest_msg, me.thread_id
                from message_entity me
                where me.deleted = false
                group by me.thread_id)
select me.id,
       me.author,
       me.content,
       me.created_at,
       me.thread_id,
       me.deleted
from latest
         inner join message_entity me
                    on me.created_at = latest.latest_msg and me.thread_id = latest.thread_id`,
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
  thread_id: string;
}
