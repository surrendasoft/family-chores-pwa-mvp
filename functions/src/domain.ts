import type { ChoreRule, DayKey, MemberId, RotationConfig, RotationWeekKey, TaskInstance } from './types.js';
export const dayKeys: DayKey[] = ['mon','tue','wed','thu','fri','sat','sun'];
const rotationKeys: RotationWeekKey[] = ['A','B','C'];
export function addDays(date: Date, days: number): Date { const d=new Date(date); d.setDate(d.getDate()+days); return d; }
export function toISODate(date: Date): string { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
export function parseLocalDate(iso: string): Date { const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d); }
export function dayIndexFromDate(date: Date): number { return (date.getDay()+6)%7; }
export function getMonday(date: Date): Date { return addDays(date, -dayIndexFromDate(date)); }
export function cycleKeys(config: RotationConfig): RotationWeekKey[] { return rotationKeys.slice(0, config.cycleLength); }
export function cycleWeekForOffset(config: RotationConfig, weekOffset: number): RotationWeekKey { const keys=cycleKeys(config); return keys[weekOffset % keys.length]; }
export function assignedMemberForDaily(config: RotationConfig, weekOffset: number, day: number): string { const weekKey=cycleWeekForOffset(config, weekOffset); return config.weeks[weekKey][dayKeys[day]]; }
export function weekStartForISODate(iso: string): string { return toISODate(getMonday(parseLocalDate(iso))); }

export function generateRecurringTaskInstances(choreRules: ChoreRule[], rotation: RotationConfig, startMonday: Date, weeksToGenerate=6): TaskInstance[] {
  const now=new Date().toISOString(); const tasks: TaskInstance[]=[];
  for(let weekOffset=0; weekOffset<weeksToGenerate; weekOffset++){
    const weekStart=addDays(startMonday, weekOffset*7); const weekStartISO=toISODate(weekStart); const rotationWeek=cycleWeekForOffset(rotation, weekOffset);
    for(const rule of choreRules.filter(r=>r.active)){
      if(rule.frequency==='Daily'){
        for(let day=0; day<7; day++){
          const dueDate=toISODate(addDays(weekStart, day));
          tasks.push({ id:`gen_${rule.id}_${dueDate}`, type:'recurring', choreRuleId:rule.id, name:rule.name, icon:rule.icon, frequency:rule.frequency, assignedTo:assignedMemberForDaily(rotation, weekOffset, day), dueDate, status:'upcoming', description:rule.description, rotationWeek, weekStart:weekStartISO, generated:true, reminderCount:0, createdAt:now, updatedAt:now });
        }
      } else if(rule.frequency==='Weekly') {
        tasks.push(baseTask(rule, toISODate(addDays(weekStart, rule.day)), weekStartISO, now));
      } else if(rule.frequency==='Fortnightly' && weekOffset%2===0) {
        tasks.push(baseTask(rule, toISODate(addDays(weekStart, rule.day)), weekStartISO, now));
      } else if(rule.frequency==='Monthly' && weekOffset===0) {
        tasks.push(baseTask(rule, toISODate(addDays(weekStart, rule.day)), weekStartISO, now));
      }
    }
  }
  return tasks;
}
function baseTask(rule: ChoreRule, dueDate: string, weekStart: string, now: string): TaskInstance { return { id:`gen_${rule.id}_${dueDate}`, type:'recurring', choreRuleId:rule.id, name:rule.name, icon:rule.icon, frequency:rule.frequency, assignedTo:rule.assignedTo, dueDate, status:'upcoming', description:rule.description, weekStart, generated:true, reminderCount:0, createdAt:now, updatedAt:now }; }
export function dueDateTime(task: TaskInstance): Date { const d=parseLocalDate(task.dueDate); if(task.dueTime){ const [h,m]=task.dueTime.split(':').map(Number); d.setHours(h||0,m||0,0,0); } else d.setHours(21,0,0,0); return d; }
export function isReminderEligible(task: TaskInstance): boolean { return ['pending','upcoming','unable','swap_requested','overdue'].includes(task.status) && task.assignedTo!=='anyone'; }
export function shouldRemindTask(task: TaskInstance, now: Date): boolean { if(!isReminderEligible(task)) return false; const start=addDays(dueDateTime(task), -1); start.setHours(8,0,0,0); if(now<start) return false; if(task.lastReminderAt && ((now.getTime()-new Date(task.lastReminderAt).getTime())/36e5)<4) return false; return true; }
export function isOverdue(task: TaskInstance, now: Date): boolean { return isReminderEligible(task) && task.status!=='overdue' && now>dueDateTime(task); }
