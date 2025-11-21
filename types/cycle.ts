export interface Cycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date?: string;
  cycle_length?: number;
  period_length?: number;
  is_predicted: boolean;
  created_at: string;
}

export interface CreateCycleRequest {
  start_date: string;
  end_date?: string;
}

export interface DayInfo {
  date: string;
  type?: 'period' | 'ovulation' | 'fertile';
  isPredicted?: boolean;
  hasNote?: boolean;
}
