export type MemberId = string;
export const ANYONE = 'anyone';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RotationWeekKey = 'A' | 'B' | 'C';
export type Frequency = 'Daily' | 'Weekly' | 'Fortnightly' | 'Monthly' | 'One-off';
export type TaskStatus = 'available' | 'pending' | 'upcoming' | 'done' | 'unable' | 'swap_requested' | 'reassigned' | 'overdue' | 'cancelled';

export interface RotationConfig {
  cycleLength: 1 | 2 | 3;
  weeks: Record<RotationWeekKey, Record<DayKey, string>>;
}
export interface ChoreRule {
  id: string;
  name: string;
  icon: string;
  frequency: Exclude<Frequency, 'One-off'>;
  day: number;
  assignedTo: string;
  description: string;
  active: boolean;
}
export interface TaskInstance {
  id: string;
  type: 'recurring' | 'one_off';
  name: string;
  icon: string;
  frequency: Frequency;
  assignedTo: MemberId;
  dueDate: string;
  dueTime?: string;
  status: TaskStatus;
  description: string;
  createdBy?: MemberId;
  choreRuleId?: string;
  rotationWeek?: RotationWeekKey;
  weekStart: string;
  reason?: string;
  swapTarget?: MemberId;
  generated?: boolean;
  lastReminderAt?: string;
  reminderCount?: number;
  createdAt: string;
  updatedAt: string;
}
export interface ActivityEntry {
  id: string;
  type: 'system' | 'done' | 'issue' | 'swap' | 'created' | 'claimed' | 'updated' | 'reminder';
  text: string;
  actorId: MemberId;
  taskId?: string;
  createdAt: string;
  weekStart: string;
}
export interface PushToken {
  token: string;
  memberId: MemberId;
  enabled?: boolean;
}
