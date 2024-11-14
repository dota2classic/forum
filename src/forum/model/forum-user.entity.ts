import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ForumUserEntity {
  @PrimaryColumn({
    unique: true,
  })
  steam_id: string;

  @Column({ type: 'timestamp with time zone' })
  muted_until: Date;
}
