import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmoticonEntity } from './model/emoticon.entity';
import { Repository } from 'typeorm';
import { RawEmoticon } from './const/emoticons';
import { InjectS3, S3 } from 'nestjs-s3';
import { GetObjectCommandInput } from '@aws-sdk/client-s3/dist-types/commands/GetObjectCommand';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';

interface UploadedImage {
  bucket: string;
  key: string;
}
@Injectable()
export class EmoticonService {
  public emoticonCache = new Map<number, EmoticonEntity>();
  private logger = new Logger(EmoticonService.name);

  constructor(
    @InjectRepository(EmoticonEntity)
    private readonly emoticonEntityRepository: Repository<EmoticonEntity>,
    @InjectS3() private readonly s3: S3,
  ) {
    this.emoticonEntityRepository
      .find()
      .then((emoticons) =>
        emoticons.forEach((emo) => this.emoticonCache.set(emo.id, emo)),
      );
  }

  public async convertEmoticons(raws: RawEmoticon[]) {
    const chunkSize = 32;
    for (let i = 0; i < raws.length; i += chunkSize) {
      const chunk = raws.slice(i, i + chunkSize);
      const promises = chunk.map(async (raw) => {
        const result = await this.emojiS3(raw);
        return this.emoticonEntityRepository.upsert(
          {
            bucket: result.bucket,
            key: result.key,
            code: raw.code,
          },
          ['code'],
        );
      });
      this.logger.log(`Start saving emoticons chunk ${i}`);
      await Promise.all(promises);
      this.logger.log(`Finished saving emoticons chunk ${i}`);
    }
  }

  public resolve(id: number): EmoticonEntity {
    return this.emoticonCache.get(id);
  }

  private async emojiS3(raw: RawEmoticon): Promise<UploadedImage> {
    const bucket = 'emoticons';
    const key = raw.code + '.gif';

    try {
      const existing = await this.s3.getObject({
        Bucket: bucket,
        Key: key,
      } satisfies GetObjectCommandInput);

      return { key, bucket };
    } catch (e) {
      const body = await fetch(raw.url)
        .then((it) => it.arrayBuffer())
        .then(Buffer.from);
      const putObjectCommandInput: PutObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'image/gif',
        ACL: 'public-read',

        Metadata: {
          originalName: key,
        },
      };

      const res = await this.s3.putObject(putObjectCommandInput);

      return { key, bucket };
    }
  }
}
