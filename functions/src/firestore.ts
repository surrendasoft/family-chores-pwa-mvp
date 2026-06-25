import * as admin from 'firebase-admin';
import type { ActivityEntry, MemberId } from './types.js';
import { getMonday, toISODate } from './domain.js';
export function householdRef(householdId: string){ return admin.firestore().collection('households').doc(householdId); }
export function subcollection(householdId: string, name: string){ return householdRef(householdId).collection(name); }
export async function addActivity(householdId: string, actorId: MemberId, text: string, type: ActivityEntry['type'], taskId?: string){
  const now=new Date(); const id=`activity_${now.getTime()}_${Math.random().toString(36).slice(2,8)}`;
  const entry: ActivityEntry={ id, type, actorId, text, taskId, createdAt:now.toISOString(), weekStart:toISODate(getMonday(now)) };
  await subcollection(householdId,'activities').doc(id).set(entry);
}
