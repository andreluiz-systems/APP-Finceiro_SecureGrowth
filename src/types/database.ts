/** Tipos das tabelas do Supabase (espelham supabase/migrations). */

export type CategoryKind = 'income' | 'expense' | 'both';
export type TransactionType = 'income' | 'expense';
export type ReminderStatus = 'pending' | 'paid';
export type NotificationKind = 'info' | 'transaction' | 'reminder' | 'goal' | 'security';

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  /** nome do ícone MaterialCommunityIcons */
  icon: string;
  kind: CategoryKind;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  occurred_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  user_id: string;
  series_id: string;
  name: string;
  amount: number;
  category_id: string | null;
  due_date: string;
  repeat_monthly: boolean;
  notify_before: boolean;
  status: ReminderStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

/** Dados mínimos da categoria que vêm junto da transação. */
export type CategoryRef = Pick<Category, 'id' | 'name' | 'icon' | 'kind'>;

export type TransactionWithCategory = Transaction & { category: CategoryRef | null };

export type ReminderWithCategory = Reminder & { category: CategoryRef | null };
