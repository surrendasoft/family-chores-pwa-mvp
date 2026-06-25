import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";
import type {
  ActivityEntry,
  ChoreRule,
  Member,
  MemberId,
  RotationConfig,
  TaskInstance,
  TaskStatus,
  UserProfile,
} from "../domain/types";
import { ANYONE } from "../domain/types";
import { generateRecurringTaskInstances, getMonday, parseLocalDate, toISODate } from "../domain/rules";
import { colorKeyForIndex, defaultRotationForAdmin, initialsFromName } from "../data/seed";
import { dlog } from "../lib/debug";

let activeHouseholdId: string | null = null;
let memberNames: Record<string, string> = {};

export function setHouseholdContext(householdId: string | null) {
  activeHouseholdId = householdId;
}

export function setMemberNames(members: Member[]) {
  memberNames = Object.fromEntries(members.map((m) => [m.id, m.name]));
}

function requireHousehold(): string {
  if (!activeHouseholdId) throw new Error("No household selected.");
  return activeHouseholdId;
}

function householdDoc(householdId: string) {
  return doc(db, "households", householdId);
}

function rotationDoc(householdId: string) {
  return doc(db, "households", householdId, "config", "rotation");
}

function col(householdId: string, name: string) {
  return collection(db, "households", householdId, name);
}

function randomInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function actorName(id: MemberId): string {
  if (id === ANYONE) return "Anyone";
  return memberNames[id] || "Member";
}

export function subscribeUserProfile(
  uid: string,
  cb: (profile: UserProfile | null) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      cb(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export function subscribeMember(
  householdId: string,
  uid: string,
  cb: (member: Member | null) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    doc(db, "households", householdId, "members", uid),
    (snap) => {
      cb(snap.exists() ? (snap.data() as Member) : null);
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export async function createHousehold(input: {
  name: string;
  displayName: string;
  uid: string;
  email: string;
  photoURL?: string;
}): Promise<string> {
  const householdRef = doc(collection(db, "households"));
  const householdId = householdRef.id;
  const now = new Date().toISOString();
  const member: Member = {
    id: input.uid,
    name: input.displayName,
    initials: initialsFromName(input.displayName),
    colorKey: "green",
    role: "admin",
    email: input.email,
    photoURL: input.photoURL,
  };
  const rotation = defaultRotationForAdmin(input.uid);

  // Security rules for member/config creation check `get(household).createdBy`,
  // and rules can't see pending writes inside the same batch. So the household
  // doc must be committed FIRST, then the member/config/user docs.
  try {
    dlog("info", "Step 1/3: creating household doc", { householdId, uid: input.uid });
    await setDoc(householdRef, {
      id: householdId,
      name: input.name.trim(),
      createdAt: now,
      createdBy: input.uid,
    });

    dlog("info", "Step 2/3: creating member + rotation");
    const batch = writeBatch(db);
    batch.set(doc(db, "households", householdId, "members", input.uid), member);
    batch.set(rotationDoc(householdId), rotation);
    await batch.commit();

    dlog("info", "Step 3/3: linking user profile");
    await setDoc(doc(db, "users", input.uid), {
      uid: input.uid,
      householdId,
      displayName: input.displayName,
      email: input.email,
      photoURL: input.photoURL || "",
    });

    dlog("info", "createHousehold completed OK", { householdId });
  } catch (err) {
    dlog("error", "createHousehold FAILED", err);
    throw err;
  }
  return householdId;
}

export async function joinHousehold(
  householdId: string,
  inviteCode: string,
  user: { uid: string; displayName: string; email: string; photoURL?: string }
): Promise<void> {
  const code = inviteCode.trim().toUpperCase();
  const inviteRef = doc(db, "households", householdId, "invites", code);

  dlog("info", "joinHousehold: validating invite", { householdId, code });
  let inviteSnap;
  try {
    inviteSnap = await getDoc(inviteRef);
  } catch (err) {
    dlog("error", "joinHousehold: invite read FAILED", err);
    throw err;
  }
  if (!inviteSnap.exists() || !inviteSnap.data().active) {
    throw new Error("Invalid or expired invite code.");
  }

  const member: Member = {
    id: user.uid,
    name: user.displayName,
    initials: initialsFromName(user.displayName),
    colorKey: colorKeyForIndex(code.charCodeAt(0) % 4),
    role: "member",
    email: user.email,
    photoURL: user.photoURL,
  };

  try {
    dlog("info", "joinHousehold: creating member doc", { householdId, uid: user.uid });
    await setDoc(doc(db, "households", householdId, "members", user.uid), {
      ...member,
      joinCode: code,
    });

    dlog("info", "joinHousehold: linking user profile");
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      householdId,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || "",
    });

    dlog("info", "joinHousehold completed OK", { householdId });
  } catch (err) {
    dlog("error", "joinHousehold FAILED", err);
    throw err;
  }
}

export async function createInviteCode(householdId: string, createdBy: string): Promise<string> {
  const code = randomInviteCode();
  await setDoc(doc(db, "households", householdId, "invites", code), {
    code,
    createdBy,
    createdAt: new Date().toISOString(),
    active: true,
  });
  return code;
}

export function buildInviteLink(householdId: string, code: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const url = new URL(base, window.location.origin);
  url.searchParams.set("household", householdId);
  url.searchParams.set("invite", code);
  return url.toString();
}

export function subscribeMembers(
  householdId: string,
  cb: (members: Member[]) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    col(householdId, "members"),
    (snap) => {
      cb(snap.docs.map((d) => d.data() as Member));
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export function subscribeChoreRules(
  householdId: string,
  cb: (rules: ChoreRule[]) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    col(householdId, "choreRules"),
    (snap) => {
      cb(snap.docs.map((d) => d.data() as ChoreRule));
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export function subscribeTasks(
  householdId: string,
  cb: (tasks: TaskInstance[]) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    query(col(householdId, "tasks"), orderBy("dueDate", "asc")),
    (snap) => {
      cb(snap.docs.map((d) => d.data() as TaskInstance));
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export function subscribeActivities(
  householdId: string,
  cb: (activities: ActivityEntry[]) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    query(col(householdId, "activities"), orderBy("createdAt", "desc")),
    (snap) => {
      cb(snap.docs.map((d) => d.data() as ActivityEntry));
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export function subscribeRotation(
  householdId: string,
  cb: (rotation: RotationConfig) => void,
  onError?: (message: string) => void
) {
  return onSnapshot(
    rotationDoc(householdId),
    (snap) => {
      if (snap.exists()) cb(snap.data() as RotationConfig);
    },
    (err) => {
      onError?.(err.message);
    }
  );
}

export async function addActivity(
  actorId: MemberId,
  text: string,
  type: ActivityEntry["type"],
  taskId?: string
) {
  const householdId = requireHousehold();
  const now = new Date().toISOString();
  const id = `activity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(col(householdId, "activities"), id), {
    id,
    type,
    actorId,
    text,
    taskId,
    createdAt: now,
    weekStart: toISODate(getMonday(new Date())),
  });
}

export async function updateTaskStatus(
  task: TaskInstance,
  status: TaskStatus,
  actorId: MemberId,
  reason?: string,
  swapTarget?: MemberId
) {
  const householdId = requireHousehold();
  await updateDoc(doc(col(householdId, "tasks"), task.id), {
    status,
    reason: reason || "",
    swapTarget: swapTarget || "",
    updatedAt: new Date().toISOString(),
  });
  await addActivity(
    actorId,
    `${actorName(actorId)} updated ${task.name} to ${status}${reason ? `: ${reason}` : ""}.`,
    status === "done" ? "done" : "updated",
    task.id
  );
}

export async function claimTask(task: TaskInstance, actorId: MemberId) {
  const householdId = requireHousehold();
  await updateDoc(doc(col(householdId, "tasks"), task.id), {
    assignedTo: actorId,
    status: "pending",
    updatedAt: new Date().toISOString(),
  });
  await addActivity(actorId, `${actorName(actorId)} took one-off task: ${task.name}.`, "claimed", task.id);
}

export async function createOneOffTask(input: {
  name: string;
  assignedTo: MemberId;
  dueDate: string;
  dueTime?: string;
  description: string;
  createdBy: MemberId;
}) {
  const householdId = requireHousehold();
  const now = new Date().toISOString();
  const id = `oneoff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const due = parseLocalDate(input.dueDate);
  const task: TaskInstance = {
    id,
    type: "one_off",
    name: input.name,
    icon: "📌",
    frequency: "One-off",
    assignedTo: input.assignedTo,
    dueDate: input.dueDate,
    dueTime: input.dueTime || "",
    status: input.assignedTo === ANYONE ? "available" : "pending",
    description: input.description,
    createdBy: input.createdBy,
    weekStart: toISODate(getMonday(due)),
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(col(householdId, "tasks"), id), task);
  const assigneeText =
    input.assignedTo === ANYONE
      ? "Available for anyone."
      : `Assigned to ${actorName(input.assignedTo)}.`;
  void addActivity(
    input.createdBy,
    `${actorName(input.createdBy)} created one-off task: ${input.name}. ${assigneeText}`,
    "created",
    id
  ).catch((err) => dlog("warn", "Activity log failed after task create", err));
}

export async function saveRotation(rotation: RotationConfig, actorId: MemberId) {
  const householdId = requireHousehold();
  await setDoc(rotationDoc(householdId), rotation);
  await addActivity(
    actorId,
    `${actorName(actorId)} saved the ${rotation.cycleLength}-week daily roster template assignments.`,
    "system"
  );
}

export async function addChoreRule(rule: ChoreRule, actorId: MemberId) {
  const householdId = requireHousehold();
  await setDoc(doc(col(householdId, "choreRules"), rule.id), rule);
  await addActivity(actorId, `${actorName(actorId)} added recurring chore: ${rule.name}.`, "created");
}

export async function generateSixWeeks(
  choreRules: ChoreRule[],
  rotation: RotationConfig,
  actorId: MemberId
) {
  const householdId = requireHousehold();
  const existing = await getDocs(col(householdId, "tasks"));
  const batch = writeBatch(db);
  existing.docs
    .map((d) => d.data() as TaskInstance)
    .filter((t) => t.type === "recurring" && t.generated)
    .forEach((t) => batch.delete(doc(col(householdId, "tasks"), t.id)));
  generateRecurringTaskInstances(choreRules, rotation, getMonday(new Date()), 6).forEach((t) =>
    batch.set(doc(col(householdId, "tasks"), t.id), t)
  );
  await batch.commit();
  await addActivity(
    actorId,
    `${actorName(actorId)} generated the next 6 weeks from recurring rules and rotation template.`,
    "system"
  );
}

export function userFromAuth(user: User) {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "Member",
    email: user.email || "",
    photoURL: user.photoURL || undefined,
  };
}
