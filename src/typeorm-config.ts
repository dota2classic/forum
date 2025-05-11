import { ThreadEntity } from './forum/model/thread.entity';
import { MessageEntity } from './forum/model/message.entity';
import { ForumUserEntity } from './forum/model/forum-user.entity';
import { LastMessageView } from './forum/model/last-message.view';
import { EmoticonEntity } from './forum/model/emoticon.entity';
import { ReactionEntity } from './forum/model/reaction.entity';
import { ThreadStatsView } from './forum/model/thread-stats.view';

export const Entities = [
  ThreadEntity,
  MessageEntity,
  ForumUserEntity,
  LastMessageView,
  EmoticonEntity,
  ReactionEntity,
  ThreadStatsView,
];
