import { describe, expect, it } from "vitest";
import { cycleWeekForOffset, generateRecurringTaskInstances } from "../../src/domain/rules";
import type { ChoreRule, RotationConfig } from "../../src/domain/types";

const memberA = "user-a";
const memberB = "user-b";
const memberC = "user-c";

const testRotation: RotationConfig = {
  cycleLength: 3,
  weeks: {
    A: { mon: memberA, tue: memberB, wed: memberC, thu: memberA, fri: memberB, sat: memberC, sun: memberA },
    B: { mon: memberB, tue: memberC, wed: memberA, thu: memberB, fri: memberC, sat: memberA, sun: memberB },
    C: { mon: memberC, tue: memberA, wed: memberB, thu: memberC, fri: memberA, sat: memberB, sun: memberC },
  },
};

const washingUp: ChoreRule = {
  id: "washing_up",
  name: "Washing up",
  icon: "🍽️",
  frequency: "Daily",
  assignedTo: memberA,
  day: 0,
  active: true,
  description: "Dishes done",
};

describe("AC-Rotation", () => {
  it("supports 1, 2, and 3 week cycle previews", () => {
    const one: RotationConfig = { ...testRotation, cycleLength: 1 };
    const two: RotationConfig = { ...testRotation, cycleLength: 2 };
    const three: RotationConfig = { ...testRotation, cycleLength: 3 };
    expect(Array.from({ length: 6 }, (_, i) => cycleWeekForOffset(one, i))).toEqual([
      "A", "A", "A", "A", "A", "A",
    ]);
    expect(Array.from({ length: 6 }, (_, i) => cycleWeekForOffset(two, i))).toEqual([
      "A", "B", "A", "B", "A", "B",
    ]);
    expect(Array.from({ length: 6 }, (_, i) => cycleWeekForOffset(three, i))).toEqual([
      "A", "B", "C", "A", "B", "C",
    ]);
  });

  it("generates fair daily tasks across a 3-week cycle", () => {
    const tasks = generateRecurringTaskInstances([washingUp], testRotation, new Date(2026, 5, 16), 3);
    const counts = tasks.reduce<Record<string, number>>((a, t) => {
      a[t.assignedTo] = (a[t.assignedTo] || 0) + 1;
      return a;
    }, {});
    expect(tasks).toHaveLength(21);
    expect(counts[memberA]).toBe(7);
    expect(counts[memberB]).toBe(7);
    expect(counts[memberC]).toBe(7);
  });
});
