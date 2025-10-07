import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApisauceInstance, create } from 'apisauce';
import { CompletionResponse } from './openai';
import { Message } from '../forum/model/message';

const Prompt = `Ты — модуль оценки сообщений игрового чата.

Оцени каждое сообщение по шкале 0–10, где:
- 0 — нейтральное, позитивное, игровое, саркастичное или эмоциональное сообщение без нападок.
- 3–6 — раздражённое, грубое, с матом или негативом, или с легким оскорблением.
- 7–10 — токсичное: содержащее жесткие прямые оскорбления, унижения, агрессию в адрес других людей, групп или модерации, а также угрозы или экстремизм.

Важно:
- Мат, жаргон и грубые слова сами по себе не делают сообщение токсичным.
- Самоирония ("я дебил", "я пидор"), юмор или эмоциональные жалобы не считаются оскорблением.
- Агрессия или презрение, направленные на других людей, игроков, админов, нации, группы — повышают оценку.
- Немного агрессии - нестрашно. Мы хотим отфильтровать только начала жестких конфликтов, легкие перепалки нестрашны.

Примеры:
- "я пидор" → 1  
- "сука, опять лаги" → 2  
- "ты ебаный даун" → 9  
- "блять, модеры охуели" → 5  
- "модеры — пидорасы" → 9  
- "нахуй этот сервер" → 3

Ответь строго в формате JSON:
{
  "results": [
    { "id": <id>, "score": <число от 0 до 10>}
  ]
}`.trim();

export interface AIMessageHistory {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

interface CompletionRequest {
  model: 'gpt-4o-mini';
  response_format?: { type: 'json_object' };
  messages: AIMessageHistory[];
}

interface ValidationResult {
  results: {
    id: string;
    score: number;
  }[];
}

@Injectable()
export class GptService {
  private logger = new Logger(GptService.name);

  private api: ApisauceInstance;
  constructor(private readonly config: ConfigService) {
    this.api = create({
      baseURL: 'https://api.proxyapi.ru/openai',
      headers: {
        Authorization: `Bearer ${config.get('gpt.token')}`,
      },
    });
  }

  public async getValidationResult(
    messages: Message[],
  ): Promise<ValidationResult> {
    try {
      const input = {
        messages: messages.map((msg) => ({ id: msg.id, text: msg.content })),
      };

      const request: CompletionRequest = {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: Prompt,
          },
          {
            role: 'user',
            content: JSON.stringify(input),
          },
        ],
      };

      const res = await this.api.post<CompletionResponse>(
        `/v1/chat/completions`,
        request,
      );

      if (res.ok) {
        return JSON.parse(res.data.choices[0].message.content);
      }

      return {
        results: [],
      };
    } catch (e) {
      this.logger.error('There was an issue getting GPT response', e);
      return {
        results: [],
      };
    }
  }
}
