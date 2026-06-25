export type MemberId = "laurence" | "tom" | "loretta" | "anyone";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type RotationWeekKey = "A" | "B" | "C";
export type Frequency = "Daily" | "Weekly" | "Fortnightly" | "Monthly" | "One-off";
export type TaskStatus = "available" | "pending" | "upcoming" | "done" | "unable" | "swap_requested" | "reassigned" | "overdue" | "cancelled";
export interface Member { id: Exclude<MemberId,"anyone">; name: string; initials: string; colorKey: "green"|"blue"|"purple"|"slate"; role: "admin"|"member"; notificationStatus: "ready"|"needs_test"|"needs_install"; }
export interface RotationConfig { cycleLength: 1|2|3; weeks: Record<RotationWeekKey, Record<DayKey, Exclude<MemberId,"anyone">>>; }
export interface ChoreRule { id:string; name:string; icon:string; frequency: Exclude<Frequency,"One-off">; day:number; assignedTo: Exclude<MemberId,"anyone">; description:string; active:boolean; }
export interface TaskInstance { id:string; type:"recurring"|"one_off"; name:string; icon:string; frequency:Frequency; assignedTo:MemberId; dueDate:string; dueTime?:string; status:TaskStatus; description:string; createdBy?:MemberId; choreRuleId?:string; rotationWeek?:RotationWeekKey; weekStart:string; reason?:string; swapTarget?:MemberId; generated?:boolean; updatedAt:string; createdAt:string; }
export interface ActivityEntry { id:string; type:"system"|"done"|"issue"|"swap"|"created"|"claimed"|"updated"; text:string; actorId:MemberId; taskId?:string; createdAt:string; weekStart:string; }
export interface DashboardSections { today:TaskInstance[]; thisWeek:TaskInstance[]; available:TaskInstance[]; requests:TaskInstance[]; done:TaskInstance[]; }
