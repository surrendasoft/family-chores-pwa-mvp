import * as admin from 'firebase-admin';
import { logger, setGlobalOptions } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { generateNextSixWeeksForHousehold, getHouseholdIds } from './generateTasks.js';
import { runReminderSweepForHousehold, sendTestNotificationToMember } from './reminders.js';
admin.initializeApp();
setGlobalOptions({ region:'australia-southeast1', maxInstances:10 });
function householdId(data: unknown): string { const id=(data as {householdId?: string})?.householdId; if(!id) throw new HttpsError('invalid-argument','householdId is required.'); return id; }
export const generateNextSixWeeksManual = onCall(async (request)=>{ if(!request.auth) throw new HttpsError('unauthenticated','Sign in required.'); return generateNextSixWeeksForHousehold(householdId(request.data), request.auth.uid); });
export const runReminderSweepManual = onCall(async (request)=>{ if(!request.auth) throw new HttpsError('unauthenticated','Sign in required.'); return runReminderSweepForHousehold(householdId(request.data)); });
export const sendTestNotification = onCall(async (request)=>{ if(!request.auth) throw new HttpsError('unauthenticated','Sign in required.'); const hid=householdId(request.data); const memberId=(request.data as {memberId?: string})?.memberId; if(!memberId) throw new HttpsError('invalid-argument','memberId is required.'); return sendTestNotificationToMember(hid, memberId); });
export const scheduledGenerateNextSixWeeks = onSchedule({ schedule:'every day 02:00', timeZone:'Australia/Sydney' }, async ()=>{ const ids=await getHouseholdIds(); logger.info('Scheduled generation', { households:ids.length }); for(const id of ids) await generateNextSixWeeksForHousehold(id, 'system'); });
export const scheduledReminderSweep = onSchedule({ schedule:'every 1 hours', timeZone:'Australia/Sydney' }, async ()=>{ const ids=await getHouseholdIds(); logger.info('Scheduled reminder sweep', { households:ids.length }); for(const id of ids) await runReminderSweepForHousehold(id); });
