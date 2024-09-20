import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ThreadEntity } from './thread.entity';

@Entity('message_entity')
export class MessageEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne(
    type => ThreadEntity,
    thread => thread.messages,
  )
  @JoinColumn({
    foreignKeyConstraintName: 'FK_thread_message',
  })
  thread!: ThreadEntity;

}
