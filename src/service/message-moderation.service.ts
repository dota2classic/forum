import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageEntity } from '../forum/model/message.entity';
import { In, MoreThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ForumUserEntity } from '../forum/model/forum-user.entity';
import { GptService } from './gpt.service';
import { ForumService } from '../forum/forum.service';
import { Role } from '../gateway/shared-types/roles';

@Injectable()
export class MessageModerationService {
  private cutoffTimestamp = new Date();

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageEntityRepository: Repository<MessageEntity>,
    @InjectRepository(ForumUserEntity)
    private readonly forumUserEntityRepository: Repository<ForumUserEntity>,
    private readonly gptService: GptService,
    private readonly forumService: ForumService,
  ) {
    this.validateMessages();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  public async validateMessages() {
    const batch = await this.messageEntityRepository.find({
      where: {
        created_at: MoreThan(this.cutoffTimestamp),
        deleted: false,
        author: Not(In(['159907143'])),
      },
    });

    if (batch.length === 0) {
      return;
    }

    const toxicityScoreThreshold = 7;

    const results = await this.gptService.getValidationResult(batch);

    for (let msg of results.results.filter(
      (t) => t.score > toxicityScoreThreshold,
    )) {
      const baddyScore = msg.score - toxicityScoreThreshold;
      const origMsg = batch.find((t) => t.id === msg.id)!;
      const res = await this.forumUserEntityRepository
        .createQueryBuilder()
        .update()
        .set({
          toxicCounter: () => `toxicCounter + :inc`,
        })
        .where('steam_id = :steam_id', { steam_id: origMsg.author })
        .setParameters({ inc: Math.max(0, baddyScore) })
        .returning('*')
        .execute();

      await this.forumService.deleteMessage(origMsg.id);
      const sum = res.raw[0]['toxic_counter'] as number;

      if (sum > 10) {
        await this.punishUser(origMsg.author, res.raw[0]['muted_until']);
        await this.forumService.postMessage(
          origMsg.thread_id,
          `https://dotaclassic.ru/players/${origMsg.author} были временно запрещены сообщения.`,
          undefined,
          '159907143',
          [Role.ADMIN],
        );
      } else {
        await this.forumService.postMessage(
          origMsg.thread_id,
          `https://dotaclassic.ru/players/${origMsg.author} Предупреждение: сообщение нарушает правила общения.`,
          undefined,
          '159907143',
          [Role.ADMIN],
        );
      }
    }

    this.cutoffTimestamp = new Date();
  }

  private async punishUser(steamId: string, currentMute: string) {
    const mute =
      Math.max(new Date(currentMute).getTime(), Date.now()) + 1000 * 60 * 15;
    await this.forumUserEntityRepository
      .createQueryBuilder()
      .update()
      .set({
        toxicCounter: () => `toxicCounter - :inc`,
        muted_until: new Date(mute).toISOString(),
      })
      .where('steam_id = :steam_id', { steam_id: steamId })
      .setParameters({ inc: 10 })
      .execute();
  }
}
