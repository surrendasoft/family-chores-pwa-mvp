import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import type { ChoreRule, RotationConfig } from './types.js';
import { generateRecurringTaskInstances, getMonday } from './domain.js';
import { addActivity, householdRef, subcollection } from './firestore.js';
const DEFAULT_ROTATION: RotationConfig={ cycleLength:3, weeks:{ A:{mon:'loretta',tue:'tom',wed:'laurence',thu:'loretta',fri:'tom',sat:'laurence',sun:'loretta'}, B:{mon:'tom',tue:'laurence',wed:'loretta',thu:'tom',fri:'laurence',sat:'loretta',sun:'tom'}, C:{mon:'laurence',tue:'loretta',wed:'tom',thu:'laurence',fri:'loretta',sat:'tom',sun:'laurence'} } };
export async function generateNextSixWeeksForHousehold(householdId: string, actor: string='system'){
  const choreRulesSnap=await subcollection(householdId,'choreRules').where('active','==',true).get();
  const choreRules=choreRulesSnap.docs.map(d=>({ id:d.id, ...d.data() }) as ChoreRule);
  const rotationSnap=await householdRef(householdId).collection('config').doc('rotation').get();
  const rotation=rotationSnap.exists ? rotationSnap.data() as RotationConfig : DEFAULT_ROTATION;
  const generated=generateRecurringTaskInstances(choreRules, rotation, getMonday(new Date()), 6);
  const batch=admin.firestore().batch();
  generated.forEach(task=>batch.set(subcollection(householdId,'tasks').doc(task.id), task, { merge:true }));
  await batch.commit();
  await addActivity(householdId, actor, `${actor==='system'?'System':'Admin'} generated/maintained the next 6 weeks of recurring tasks.`, 'system');
  logger.info('Generated recurring tasks', { householdId, count: generated.length });
  return { generatedCount: generated.length };
}
export async function getHouseholdIds(): Promise<string[]> { const snap=await admin.firestore().collection('households').get(); return snap.docs.map(d=>d.id); }
