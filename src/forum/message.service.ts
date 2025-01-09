import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageEntity } from './model/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { ReactionEntity } from './model/reaction.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    private readonly ebus: EventBus,
    @InjectRepository(ReactionEntity)
    private readonly reactionEntityRepository: Repository<ReactionEntity>,
  ) {}

  public async toggleReaction(
    messageId: string,
    author: string,
    emoticonId: number,
  ) {
    await this.reactionEntityRepository
      .createQueryBuilder()
      .insert()
      .into(ReactionEntity, ['messageId', 'emoticonId', 'author', 'active'])
      .values({
        messageId: messageId,
        emoticonId: emoticonId,
        author,
        active: true,
      })
      .onConflict(
        `("message_id", "emoticon_id", "author") DO UPDATE SET "active" = NOT "reaction_entity"."active"`,
      )
      .execute();

    await this.messageEntityRepository.update(
      {
        id: messageId,
      },
      {
        updated_at: new Date().toISOString(),
      },
    );

    return this.fullMessage(messageId);
  }

  public async editMessage(
    messageId: string,
    content: string,
    authorSteamId: string,
  ) {
    const msg = await this.messageEntityRepository.findOne({
      where: {
        id: messageId,
      },
    });

    console.log(msg, messageId);

    if (!msg) throw new NotFoundException('Message not found');

    if (msg.author !== authorSteamId)
      throw new ForbiddenException('Can only edit own messages');

    msg.content = content;
    msg.updated_at = new Date();
    await this.messageEntityRepository.save(msg);

    return this.fullMessage(messageId);
  }

  private async fullMessage(id: string): Promise<MessageEntity> {
    return this.messageEntityRepository
      .createQueryBuilder('me')
      .where('me.id = :id', { id })
      .leftJoinAndSelect('me.reactions', 'reactions', 'reactions.active')
      .getOneOrFail();
  }
}
