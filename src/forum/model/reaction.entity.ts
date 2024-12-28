import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity()
export class ReactionEntity {
  @JoinColumn([
    {
      name: 'message_id',
      referencedColumnName: 'id',
    },
  ])
  @ManyToOne((type) => MessageEntity, (message) => message.reactions)
  message: Relation<MessageEntity>;

  @PrimaryColumn({ name: 'message_id' })
  messageId: string;

  @PrimaryColumn({ name: 'emoticon_id' })
  emoticonId: number;

  @PrimaryColumn()
  author: string;

  @Column({ default: true })
  active: boolean;
}
