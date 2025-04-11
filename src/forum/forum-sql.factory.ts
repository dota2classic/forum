import { SortOrder } from './dto/forum.dto';

export class ForumSqlFactory {
  public static getThreadMessageCountRequest() {
    return `
select
    COUNT(1)::int as "count"
from
    "message_entity" me
where
    me.thread_id = $1 and me.deleted = false 
    `;
  }

  public static getThreadMessagePageIds() {
    return `
select
    me.id as id
from
    message_entity me
where
    me.thread_id = $1 and "me"."deleted" = false
order by
    me.created_at asc
offset $2
limit $3;`;
  }

  public static getThreadMessagePageCursorIds(order: SortOrder) {
    return `
select
    me.id as id
from
    message_entity me
where
    me.thread_id = $1 and "me"."deleted" = false and ${order === SortOrder.ASC ? 'me.created_at > $2' : 'me.created_at < $2'}
order by
    me.created_at asc
limit $3;`;
  }
}
