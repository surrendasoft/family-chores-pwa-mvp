import { describe, expect, it } from "vitest";
import { dashboardSections, getMonday, taskMatchesWeekDay } from "../../src/domain/rules";
import type { TaskInstance } from "../../src/domain/types";

const weekStart = new Date(2026, 5, 16);
const memberTom = "user-tom";
const base: TaskInstance = {
  id: "oneoff",
  type: "one_off",
  name: "Move boxes",
  icon: "task",
  frequency: "One-off",
  assignedTo: "anyone",
  dueDate: "2026-06-18",
  status: "available",
  description: "Move boxes\nClear hallway",
  createdBy: "user-a",
  weekStart: "2026-06-16",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("AC-One-off", () => {
  it("places a one-off task on the exact selected date", () => {
    expect(taskMatchesWeekDay(base, weekStart, 2)).toBe(true);
    expect(taskMatchesWeekDay(base, weekStart, 1)).toBe(false);
  });

  it("shows unclaimed one-off tasks as available", () => {
    const sections = dashboardSections([base], memberTom, getMonday(weekStart));
    expect(sections.available.map((t) => t.id)).toEqual(["oneoff"]);
  });

  it("shows claimed one-off tasks due today in the Today section", () => {
    const claimed = { ...base, assignedTo: memberTom, status: "pending" as const };
    const dueDay = new Date(2026, 5, 18);
    const sections = dashboardSections([claimed], memberTom, getMonday(weekStart), dueDay);
    expect(sections.today.map((t) => t.id)).toEqual(["oneoff"]);
  });
});
