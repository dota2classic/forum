import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ThreadEntity } from './thread.entity';

@Entity('message_entity')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // we expect it to be steam_id so string
  @Column()
  author: string;

  @Column()
  index: number;

  @Column()
  content: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne((type) => ThreadEntity, (thread) => thread.messages)
  @JoinColumn({
    foreignKeyConstraintName: 'FK_thread_message',
    name: 'thread_id',
  })
  thread!: ThreadEntity;

  @Column({ name: 'thread_id' })
  thread_id: string;
}
