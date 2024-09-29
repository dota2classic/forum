import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity()
@Index(['id', 'external_id'])
export class ThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // For now its string, subject to change
  @Column()
  external_id: string;

  @OneToMany((type) => MessageEntity, (msg) => msg.thread, { eager: false })
  messages: MessageEntity[];
}
