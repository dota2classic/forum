import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { ThreadType } from '../../gateway/shared-types/thread-type';
import { VirtualColumn2 } from '../../util/virtual-column';

@Entity()
@Index('external_id_thread_type_index', ['thread_type', 'external_id'], {
  unique: true,
})
export class ThreadEntity {
  @PrimaryColumn({
    unique: true,
  })
  @Index()
  id: string;

  // For now its string, subject to change
  @Column()
  external_id: string;

  @Column()
  thread_type: ThreadType;

  @Column()
  title: string;

  @Column({ default: 0 })
  views: number;

  @Column({ default: false })
  pinned: boolean;

  @Column({ default: false })
  admin_only: boolean;

  @OneToOne(() => MessageEntity, (t) => t.thread, { nullable: true })
  @JoinColumn({ name: 'pinned_message_id', referencedColumnName: 'id' })
  pinned_message?: MessageEntity;

  @Column({ nullable: true, name: 'pinned_message_id' })
  pinnedMessageId: string;

  @OneToMany((type) => MessageEntity, (msg) => msg.thread, { eager: false })
  messages: MessageEntity[];

  @VirtualColumn2('messageCount', parseInt)
  messageCount: number;

  @VirtualColumn2('newMessageCount', parseInt)
  newMessageCount: number;

  @VirtualColumn2('originalPoster', (t) => t)
  originalPoster?: string;

  @VirtualColumn2('lastMessage', (t) => t)
  lastMessage?: MessageEntity;

  @BeforeInsert()
  generateId() {
    this.id = `${this.thread_type}_${this.external_id}`;
  }
}
