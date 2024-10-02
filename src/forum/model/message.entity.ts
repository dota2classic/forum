import {
  Column,
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

  @Column({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @ManyToOne((type) => ThreadEntity, (thread) => thread.messages, {
    eager: true,
  })
  @JoinColumn({
    foreignKeyConstraintName: 'FK_thread_message',
    name: 'thread_id',
  })
  thread!: ThreadEntity;

  @Column({ name: 'thread_id' })
  thread_id: string;
}
