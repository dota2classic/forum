import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity()
export class ThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  // For now its string, subject to change
  @Column()
  external_id: string;

  @OneToMany(
    type => MessageEntity,
    msg => msg.thread,
    { eager: false },
  )
  messages: MessageEntity[];
}
