import { ArrowLeftRight, Check, X } from "lucide-react";
import type { Member, MemberId, TaskInstance } from "../domain/types";
import { isAvailable, taskDateLabel } from "../domain/rules";
import { DescriptionBox } from "./DescriptionBox";

interface Props {
  task: TaskInstance;
  members: Record<MemberId, Member | undefined>;
  showPerson?: boolean;
  onDone: (t: TaskInstance) => void;
  onCantDo: (t: TaskInstance) => void;
  onSwap: (t: TaskInstance) => void;
  onClaim: (t: TaskInstance) => void;
  onOpen: (t: TaskInstance) => void;
}

export function TaskCard({
  task,
  members,
  showPerson,
  onDone,
  onCantDo,
  onSwap,
  onClaim,
  onOpen,
}: Props) {
  const assignedName = members[task.assignedTo]?.name || "Anyone";

  return (
    <article className="card task-card tap-card" onClick={() => onOpen(task)}>
      <div className={`icon ${iconClass(task)}`}>{task.icon}</div>
      <div>
        <div className="row">
          <div>
            <div className="task-title">{task.name}</div>
            <div className="task-meta">
              {task.frequency}
              {showPerson ? ` · ${assignedName}` : ""} · {taskDateLabel(task)}
            </div>
          </div>
          <span className={`badge ${task.status}`}>{labelForStatus(task.status)}</span>
        </div>
        {task.type === "one_off" && (
          <div className="task-def">
            One-off task. Created by {members[task.createdBy || ""]?.name || "Member"}.{" "}
            {isAvailable(task)
              ? "Available for anyone to take."
              : `Assigned to ${assignedName}.`}
          </div>
        )}
        <DescriptionBox text={task.description} compact />
      </div>
      <div className="actions" onClick={(e) => e.stopPropagation()}>
        {isAvailable(task) ? (
          <>
            <button className="primary small-button" onClick={() => onClaim(task)}>
              Take task
            </button>
            <button className="ghost small-button" onClick={() => onOpen(task)}>
              View
            </button>
          </>
        ) : (
          <>
            <button className="good icon-button" onClick={() => onDone(task)} aria-label="Mark done">
              <Check size={16} />
              Done
            </button>
            <button className="bad icon-button" onClick={() => onCantDo(task)} aria-label="Can't do">
              <X size={16} />
              Can't do
            </button>
            <button className="swap-btn icon-button" onClick={() => onSwap(task)} aria-label="Request swap">
              <ArrowLeftRight size={16} />
              Swap
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function labelForStatus(s: TaskInstance["status"]) {
  return s === "done"
    ? "Done"
    : s === "unable"
      ? "Can't do"
      : s === "swap_requested"
        ? "Swap requested"
        : s === "available"
          ? "Available"
          : s === "upcoming"
            ? "Upcoming"
            : s === "reassigned"
              ? "Reassigned"
              : s === "cancelled"
                ? "Cancelled"
                : s === "overdue"
                  ? "Overdue"
                  : "Pending";
}

function iconClass(task: TaskInstance) {
  if (task.status === "done") return "g";
  if (task.status === "unable" || task.status === "overdue") return "r";
  if (task.status === "swap_requested") return "p";
  if (task.status === "available") return "s";
  if (task.frequency === "Daily") return "o";
  if (task.frequency === "One-off") return "p";
  return "";
}
