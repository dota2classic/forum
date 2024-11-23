
export interface Message {
  id: string;

  author: string;

  index: number;

  content: string;

  created_at: Date;

  deleted: boolean;

  thread_id: string;
}
