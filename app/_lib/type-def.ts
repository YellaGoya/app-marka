export type User = {
  user_id: number;
  nickname: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  last_login: Date;
  status: string;
};

type Todo = { done: boolean; text: string };
type TodoList = [string, Todo];

export type Diary = {
  diary_id?: number;
  user_id?: number;
  title: string;
  content_html: string;
  created_at?: string;
  updated_at?: string;
  extracted_todos: Array<TodoList>;
  manual_todos: Array<TodoList>;
  is_secret: boolean;
};
