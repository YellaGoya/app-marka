export type User = {
  user_id: number;
  tag: string;
  email: string;
  password: string;
  created_at: Date;
};

export type Waiting = {
  errors?: {
    tag?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

type Todo = { done: boolean; text: string };
type TodoList = [string, Todo];

export type Diary = {
  user_id?: number;
  diary_id?: number;
  title: string;
  content_html: string;
  created_at?: string;
  updated_at?: string;
  extracted_todos: Array<TodoList>;
  manual_todos: Array<TodoList>;
  is_secret: boolean;
};
