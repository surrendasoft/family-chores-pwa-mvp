import { useEffect, useMemo, useState } from "react";
import type { ActivityEntry, ChoreRule, Member, RotationConfig, TaskInstance } from "../domain/types";
import { defaultRotationForAdmin } from "../data/seed";
import {
  setHouseholdContext,
  setMemberNames,
  subscribeActivities,
  subscribeChoreRules,
  subscribeMembers,
  subscribeRotation,
  subscribeTasks,
} from "../services/firestore";
import { dlog } from "../lib/debug";

export function useHouseholdData(householdId: string | null | undefined) {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [choreRules, setChoreRules] = useState<ChoreRule[]>([]);
  const [rotation, setRotation] = useState<RotationConfig>(defaultRotationForAdmin(""));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    dlog("info", "Subscribing to household data", { householdId });
    setHouseholdContext(householdId);
    setLoading(true);
    setError("");

    const onError = (message: string) => {
      dlog("error", "Household data listener failed", message);
      setError(message);
      setLoading(false);
    };

    const unsubs = [
      subscribeMembers(
        householdId,
        (nextMembers) => {
          setMembers(nextMembers);
          setMemberNames(nextMembers);
          setLoading(false);
        },
        onError
      ),
      subscribeTasks(householdId, setTasks, onError),
      subscribeActivities(householdId, setActivities, onError),
      subscribeChoreRules(householdId, setChoreRules, onError),
      subscribeRotation(householdId, setRotation, onError),
    ];

    return () => {
      unsubs.forEach((u) => u());
      setHouseholdContext(null);
    };
  }, [householdId]);

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, Member | undefined>,
    [members]
  );

  return { loading, error, members, memberMap, tasks, activities, choreRules, rotation, setRotation };
}
