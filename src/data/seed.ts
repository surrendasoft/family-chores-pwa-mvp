import type { DayKey, RotationConfig, RotationWeekKey } from "../domain/types";

const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const weekKeys: RotationWeekKey[] = ["A", "B", "C"];

function weekForMember(memberId: string): Record<DayKey, string> {
  return Object.fromEntries(dayKeys.map((day) => [day, memberId])) as Record<DayKey, string>;
}

export function defaultRotationForAdmin(adminId: string): RotationConfig {
  return {
    cycleLength: 3,
    weeks: {
      A: weekForMember(adminId),
      B: weekForMember(adminId),
      C: weekForMember(adminId),
    },
  };
}

export function colorKeyForIndex(index: number): "green" | "blue" | "purple" | "slate" {
  const keys = ["green", "blue", "purple", "slate"] as const;
  return keys[index % keys.length];
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
