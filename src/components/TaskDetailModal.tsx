import { ArrowLeftRight, Check, RotateCcw, X } from "lucide-react";
import type { Member, MemberId, TaskInstance } from "../domain/types";
import { isAvailable, taskDateLabel } from "../domain/rules";
import { claimTask, updateTaskStatus } from "../services/firestore";
import { DescriptionBox } from "./DescriptionBox";

export function TaskDetailModal({
  task,
  currentMember,
  members,
  onCantDo,
  onSwap,
  onClose,
}: {
  task: TaskInstance | null;
  currentMember: MemberId;
  members: Record<MemberId, Member | undefined>;
  onCantDo: (t: TaskInstance) => void;
  onSwap: (t: TaskInstance) => void;
  onClose: () => void;
}) {
  if (!task) return null;

  const assignedName = members[task.assignedTo]?.name || "Anyone";

  async function markDone() {
    await updateTaskStatus(task!, "done", currentMember);
    onClose();
  }

  async function setPending() {
    await updateTaskStatus(task!, "pending", currentMember);
    onClose();
  }

  async function takeTask() {
    await claimTask(task!, currentMember);
    onClose();
  }

  return (
    <div className="modal-backdrop show">
      <div className="bottom-sheet">
        <div className="modal-head">
          <div>
            <h2>{task.name}</h2>
            <p>
              {task.frequency} · Assigned to {assignedName} · {taskDateLabel(task)}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
        <DescriptionBox text={task.description} />
        {task.reason && <div className="reason-box">Reason/history: {task.reason}</div>}
        {isAvailable(task) && (
          <div className="reason-box">This one-off task is unclaimed. Anyone can take it.</div>
        )}
        <div className="detail-grid">
          {isAvailable(task) ? (
            <button type="button" className="primary" onClick={takeTask}>
              Take task
            </button>
          ) : (
            <>
              <button type="button" className="good icon-button" onClick={markDone}>
                <Check size={16} />
                Mark done
              </button>
              <button type="button" className="ghost icon-button" onClick={setPending}>
                <RotateCcw size={16} />
                Set pending
              </button>
              <button type="button" className="bad icon-button" onClick={() => onCantDo(task)}>
                <X size={16} />
                Can't do
              </button>
              <button type="button" className="swap-btn icon-button" onClick={() => onSwap(task)}>
                <ArrowLeftRight size={16} />
                Request swap
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
