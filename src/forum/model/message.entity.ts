import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ThreadEntity } from './thread.entity';
import { Message } from './message';
import { ReactionEntity } from './reaction.entity';

@Entity('message_entity')
export class MessageEntity implements Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // we expect it to be steam_id so string
  @Column()
  author: string;

  @Column()
  content: string;

  @Column({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @Column({
    type: 'timestamptz',
    name: 'updated_at',
    default: 'now()',
  })
  updated_at: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column({ default: false })
  edited: boolean;

  @ManyToOne(() => MessageEntity, (msg) => msg.replies, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({
    foreignKeyConstraintName: 'FK_message_reply',
    name: 'reply_message_id',
  })
  reply?: Relation<MessageEntity>;

  @Column({ name: 'reply_message_id', nullable: true })
  reply_message_id: string;

  @ManyToOne((type) => ThreadEntity, (thread) => thread.messages, {
    eager: true,
  })
  @JoinColumn({
    foreignKeyConstraintName: 'FK_thread_message',
    name: 'thread_id',
  })
  thread!: ThreadEntity;

  @Column({ name: 'thread_id' })
  @Index()
  thread_id: string;

  @OneToMany((type) => ReactionEntity, (msg) => msg.message, { eager: false })
  reactions: Relation<ReactionEntity>[];

  @OneToMany((type) => MessageEntity, (msg) => msg.reply, { eager: false })
  replies: Relation<MessageEntity>[];
}
