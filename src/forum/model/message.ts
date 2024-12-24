
export interface Message {
  id: string;

  author: string;

  content: string;

  created_at: Date;

  deleted: boolean;

  thread_id: string;
}
