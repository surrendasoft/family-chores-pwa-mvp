import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Member, MemberId, RotationConfig, TaskInstance } from "../domain/types";
import {
  addDays,
  assignedMemberForDaily,
  cycleWeekForOffset,
  dayNames,
  dayShort,
  daysBetween,
  rotationDescription,
  taskMatchesWeekDay,
} from "../domain/rules";

function defaultDayIndex(weekStart: Date): number {
  const today = new Date();
  const diff = daysBetween(weekStart, today);
  if (diff >= 0 && diff < 7) return diff;
  return 0;
}

export function Week({
  tasks,
  members,
  currentMember,
  weekStart,
  weekOffset,
  todayJump,
  rotation,
  scope,
  setScope,
  moveWeek,
  onGoToToday,
  onOpen,
}: {
  tasks: TaskInstance[];
  members: Record<MemberId, Member | undefined>;
  currentMember: MemberId;
  weekStart: Date;
  weekOffset: number;
  todayJump: number;
  rotation: RotationConfig;
  scope: "everyone" | "me";
  setScope: (s: "everyone" | "me") => void;
  moveWeek: (d: number) => void;
  onGoToToday: () => void;
  onOpen: (t: TaskInstance) => void;
}) {
  const rotationWeek = cycleWeekForOffset(rotation, weekOffset);
  const scopedTasks =
    scope === "me"
      ? tasks.filter((t) => t.assignedTo === currentMember || t.assignedTo === "anyone")
      : tasks;
  const [selectedDay, setSelectedDay] = useState(() => defaultDayIndex(weekStart));

  useEffect(() => {
    setSelectedDay(defaultDayIndex(weekStart));
  }, [weekStart, todayJump]);

  const viewingToday = weekOffset === 0 && selectedDay === defaultDayIndex(weekStart);

  const dayDate = addDays(weekStart, selectedDay);
  const dayTasks = scopedTasks.filter((t) => taskMatchesWeekDay(t, weekStart, selectedDay));
  const rosterMemberId = assignedMemberForDaily(rotation, weekOffset, selectedDay);
  const rosterMember = members[rosterMemberId];
  const showRosterForMe = scope === "me" && rosterMemberId !== currentMember;

  return (
    <section className="screen-panel">
      <div className="date-nav">
        <button type="button" className="icon-btn" onClick={() => moveWeek(-1)} aria-label="Previous week">
          <ChevronLeft size={22} />
        </button>
        <div className="date-label">Week of {formatWeekRange(weekStart)}</div>
        <button type="button" className="icon-btn" onClick={() => moveWeek(1)} aria-label="Next week">
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="segmented">
        <button
          type="button"
          className={scope === "everyone" ? "active" : ""}
          onClick={() => setScope("everyone")}
        >
          Everyone
        </button>
        <button
          type="button"
          className={scope === "me" ? "active" : ""}
          onClick={() => setScope("me")}
        >
          Me
        </button>
      </div>
      <div className="note">
        Daily roster: Week {rotationWeek} · {rotationDescription(rotation)} ·{" "}
        {scope === "everyone" ? "Everyone’s roster" : "Your roster"} · Viewing {weekOffset + 1} of
        next 6 weeks
      </div>
      <div className="week-chips-row">
        <div className="week-chips">
          {dayShort.map((d, i) => (
            <button
              type="button"
              className={`chip ${i === selectedDay ? "active" : ""}`}
              key={d}
              onClick={() => setSelectedDay(i)}
            >
              {d}
              <br />
              {shortDate(addDays(weekStart, i))}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`today-btn ${viewingToday ? "active" : ""}`}
          onClick={onGoToToday}
        >
          Today
        </button>
      </div>
      <div className="day-card">
        <div className="day-head">
          <span>
            {dayNames[selectedDay]} {shortDate(dayDate)}
          </span>
          <span>{dayTasks.length} tasks</span>
        </div>
        {!showRosterForMe && (
          <div className="roster-row">
            <span className={`dot ${rosterMember?.colorKey || "slate"}`}>
              {rosterMember?.initials || "?"}
            </span>
            <span>
              <b>{rosterMember?.name || "Unassigned"}</b> on daily roster
              <em> · Week {rotationWeek}</em>
            </span>
          </div>
        )}
        {dayTasks.length ? (
          dayTasks.map((task) => (
            <div className="mini-task" key={task.id} onClick={() => onOpen(task)}>
              <span className={`dot ${members[task.assignedTo]?.colorKey || "slate"}`}>
                {members[task.assignedTo]?.initials || "?"}
              </span>
              <span>
                <b>{members[task.assignedTo]?.name || "Anyone"}</b> {task.name}
                {task.rotationWeek ? <em> · Week {task.rotationWeek}</em> : null}
              </span>
              <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
            </div>
          ))
        ) : (
          <div className="mini-task">
            <span />
            <span className="muted">
              {scope === "me" && showRosterForMe
                ? "Not your roster day."
                : "No generated chores for this day yet. Add daily chores in Profile, then run Generate next 6 weeks."}
            </span>
            <span />
          </div>
        )}
      </div>
    </section>
  );
}

function shortDate(date: Date) {
  return `${date.getDate()} ${date.toLocaleString("en-AU", { month: "short" })}`;
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleString("en-AU", { month: "short" })} ${start.getFullYear()}`;
  }
  return `${shortDate(start)} – ${shortDate(end)} ${start.getFullYear()}`;
}
