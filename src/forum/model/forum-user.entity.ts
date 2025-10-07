import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ForumUserEntity {
  @PrimaryColumn({
    unique: true,
  })
  steam_id: string;

  @Column({ type: 'timestamptz' })
  muted_until: Date;

  @Column({
    name: 'toxic_counter',
    default: 0,
  })
  toxicCounter: number;
}
