import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity()
export class ThreadEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;


  @OneToMany(
    type => MessageEntity,
    msg => msg.thread,
    { eager: false },
  )
  messages: MessageEntity[];
}
