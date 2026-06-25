import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import type { PushToken, TaskInstance } from './types.js';
import { isOverdue, shouldRemindTask } from './domain.js';
import { addActivity, subcollection } from './firestore.js';
export async function runReminderSweepForHousehold(householdId: string){
  const now=new Date(); const snap=await subcollection(householdId,'tasks').where('status','in',['pending','upcoming','unable','swap_requested','overdue']).get();
  const tasks=snap.docs.map(d=>({ id:d.id, ...d.data() }) as TaskInstance); let remindersSent=0, overdueUpdated=0;
  for(const task of tasks){
    if(isOverdue(task, now)){ await subcollection(householdId,'tasks').doc(task.id).set({ status:'overdue', updatedAt:now.toISOString() }, { merge:true }); await addActivity(householdId,'system',`${task.name} is now overdue.`, 'reminder', task.id); overdueUpdated++; }
    if(!shouldRemindTask(task, now)) continue;
    const tokens=await getTokensForMember(householdId, task.assignedTo);
    if(tokens.length){ await admin.messaging().sendEachForMulticast({ tokens, notification:{ title:`Reminder: ${task.name}`, body: task.dueTime ? `Due ${task.dueDate} at ${task.dueTime}` : `Due ${task.dueDate}` }, data:{ householdId, taskId:task.id } }); }
    await subcollection(householdId,'tasks').doc(task.id).set({ lastReminderAt:now.toISOString(), reminderCount:(task.reminderCount||0)+1, updatedAt:now.toISOString() }, { merge:true });
    await addActivity(householdId,'system',`Reminder queued for ${task.assignedTo}: ${task.name}.`, 'reminder', task.id); remindersSent++;
  }
  logger.info('Reminder sweep complete', { householdId, remindersSent, overdueUpdated }); return { remindersSent, overdueUpdated };
}
export async function sendTestNotificationToMember(householdId: string, memberId: string){ const tokens=await getTokensForMember(householdId, memberId); if(!tokens.length) return { sent:0, message:'No enabled push tokens found for this member.' }; await admin.messaging().sendEachForMulticast({ tokens, notification:{ title:'Family Chores test', body:'Test notification received.' }, data:{ householdId, test:'true' } }); await addActivity(householdId,'system',`Sent test notification to ${memberId}.`, 'system'); return { sent:tokens.length }; }
async function getTokensForMember(householdId: string, memberId: string): Promise<string[]>{ const snap=await subcollection(householdId,'pushTokens').where('memberId','==',memberId).where('enabled','==',true).get(); return snap.docs.map(d=>(d.data() as PushToken).token).filter(Boolean); }
