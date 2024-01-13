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

export type Waiting = {
  errors?: {
    nickname?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};
