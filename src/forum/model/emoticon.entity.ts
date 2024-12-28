import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EmoticonEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index({ unique: true })
  code: string;

  @Column()
  bucket: string;

  @Column()
  key: string;

  constructor(code: string, bucket: string, key: string) {
    this.code = code;
    this.bucket = bucket;
    this.key = key;
  }
}
