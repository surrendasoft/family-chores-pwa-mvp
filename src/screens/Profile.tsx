import type { ReactNode } from "react";
import { useState } from "react";
import type { User } from "firebase/auth";
import {
  Bell,
  Bug,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RotateCw,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { ChoreRule, Member, RotationConfig } from "../domain/types";
import { dayKeys, dayShort, rotationDescription } from "../domain/rules";
import { signOut } from "../services/auth";
import {
  addChoreRule,
  buildInviteLink,
  createInviteCode,
  generateSixWeeks,
  saveRotation,
} from "../services/firestore";

type Panel = "home" | "members" | "chores" | "reminders" | "rotation" | "system";

export function Profile({
  user,
  member,
  members,
  householdId,
  rotation,
  setRotation,
  choreRules,
  debugOpen,
  onDebugOpenChange,
}: {
  user: User;
  member: Member | undefined;
  members: Member[];
  householdId: string;
  rotation: RotationConfig;
  setRotation: (r: RotationConfig) => void;
  choreRules: ChoreRule[];
  debugOpen: boolean;
  onDebugOpenChange: (open: boolean) => void;
}) {
  const [panel, setPanel] = useState<Panel>("home");
  const [inviteLink, setInviteLink] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = member?.role === "admin";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleCreateInvite() {
    if (!member) return;
    const code = await createInviteCode(householdId, member.id);
    setInviteLink(buildInviteLink(householdId, code));
  }

  if (panel !== "home") {
    return (
      <section className="screen-panel">
        <div className="admin-panel-title">
          <button type="button" className="icon-btn" onClick={() => setPanel("home")} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <div className="date-label">{panelTitle(panel)}</div>
        </div>
        {panel === "members" && <MembersPanel members={members} />}
        {panel === "chores" && isAdmin && (
          <ChoresPanel currentMember={member?.id || user.uid} members={members} choreRules={choreRules} />
        )}
        {panel === "reminders" && isAdmin && <RemindersPanel />}
        {panel === "rotation" && isAdmin && (
          <RotationPanel
            currentMember={member?.id || user.uid}
            rotation={rotation}
            setRotation={setRotation}
            members={members}
          />
        )}
        {panel === "system" && isAdmin && (
          <SystemPanel
            currentMember={member?.id || user.uid}
            choreRules={choreRules}
            rotation={rotation}
          />
        )}
      </section>
    );
  }

  return (
    <section className="screen-panel">
      <div className="card profile-card">
        <div className={`profile-big ${member?.colorKey || "green"}`}>
          {member?.photoURL ? (
            <img src={member.photoURL} alt="" className="profile-photo" />
          ) : (
            member?.initials || "?"
          )}
        </div>
        <div>
          <div className="task-title">{member?.name || user.displayName || "Member"}</div>
          <div className="task-meta">{member?.email || user.email}</div>
          <span className={`badge ${isAdmin ? "done" : "upcoming"}`}>
            {isAdmin ? "Admin" : "Member"}
          </span>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">Account</div>
        <button className="ghost full" disabled={signingOut} onClick={handleSignOut}>
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>

      {isAdmin && (
        <div className="settings-group">
          <div className="settings-label">Admin controls</div>
          <Setting
            icon={<Users size={20} />}
            title="Members"
            desc={`${members.length} member${members.length === 1 ? "" : "s"} in this household`}
            onClick={() => setPanel("members")}
          />
          <Setting
            icon={<UserPlus size={20} />}
            title="Invite member"
            desc="Generate a link for someone to join"
            onClick={handleCreateInvite}
          />
          {inviteLink && (
            <div className="note info invite-link-box">
              <div className="small">Share this invite link:</div>
              <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
            </div>
          )}
          <Setting
            icon={<ClipboardList size={20} />}
            title="Chores & approvals"
            desc="Manage recurring chores and definitions of done"
            onClick={() => setPanel("chores")}
          />
          <Setting
            icon={<Bell size={20} />}
            title="Reminder rules"
            desc="Daily rotation, weekly, fortnightly and monthly reminders"
            onClick={() => setPanel("reminders")}
          />
          <Setting
            icon={<RotateCw size={20} />}
            title="Rotation template"
            desc="1–3 week daily roster"
            onClick={() => setPanel("rotation")}
          />
          <Setting
            icon={<Settings size={20} />}
            title="System actions"
            desc="Generate next 6 weeks of tasks"
            onClick={() => setPanel("system")}
          />
          <SettingToggle
            icon={<Bug size={20} />}
            title="Debug log"
            desc="Show in-app diagnostic log on screen"
            checked={debugOpen}
            onChange={onDebugOpenChange}
          />
        </div>
      )}

      {!isAdmin && (
        <div className="note info">
          Member view. Admins manage recurring chores and rotation templates.
        </div>
      )}
    </section>
  );
}

function Setting({
  icon,
  title,
  desc,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <div className="setting-row" onClick={onClick} role="button" tabIndex={0}>
      {icon && <div className="setting-icon">{icon}</div>}
      <div className="setting-copy">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <ChevronRight size={18} className="setting-chevron" />
    </div>
  );
}

function SettingToggle({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon?: ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="setting-row toggle-row">
      {icon && <div className="setting-icon">{icon}</div>}
      <div className="setting-copy">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <label className="toggle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={title}
        />
        <span className="toggle-track" />
      </label>
    </div>
  );
}

function MembersPanel({ members }: { members: Member[] }) {
  return (
    <>
      {members.map((m) => (
        <div className="setting-row" key={m.id}>
          <div className={`dot ${m.colorKey}`}>{m.initials}</div>
          <div>
            <h3>{m.name}</h3>
            <p>
              {m.role} · {m.email}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

function ChoresPanel({
  currentMember,
  members,
  choreRules,
}: {
  currentMember: string;
  members: Member[];
  choreRules: ChoreRule[];
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<ChoreRule["frequency"]>("Weekly");
  const [assignedTo, setAssignedTo] = useState(members[0]?.id || "");
  const [day, setDay] = useState(0);
  const [description, setDescription] = useState("");
  const usesRotation = frequency === "Daily";

  async function add() {
    if (!name.trim() || !description.trim()) {
      alert("Name and description / checklist are required.");
      return;
    }
    if (!usesRotation && !assignedTo) {
      alert("Choose who this chore is assigned to.");
      return;
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now();
    await addChoreRule(
      {
        id,
        name: name.trim(),
        icon: "task",
        frequency,
        assignedTo: usesRotation ? currentMember : assignedTo,
        day: usesRotation ? 0 : day,
        description: description.trim(),
        active: true,
      },
      currentMember
    );
    setName("");
    setDescription("");
  }

  function ruleSummary(rule: ChoreRule): string {
    if (rule.frequency === "Daily") {
      return "Daily · Assigned via rotation template";
    }
    const assignee = members.find((m) => m.id === rule.assignedTo)?.name || "Member";
    return `${rule.frequency} · ${assignee} · ${dayShort[rule.day]}`;
  }

  return (
    <>
      <div className="note info">
        Daily chores repeat every day and follow your rotation template. Weekly, fortnightly, and
        monthly chores use a fixed assignee and due day instead.
      </div>
      <div className="card">
        <label>Recurring chore name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Clean shower"
        />
        <label>Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as ChoreRule["frequency"])}
        >
          <option>Daily</option>
          <option>Weekly</option>
          <option>Fortnightly</option>
          <option>Monthly</option>
        </select>
        {usesRotation ? (
          <div className="note">
            Who does this each day comes from Profile → Rotation template. After adding daily
            chores, run Generate next 6 weeks in System actions.
          </div>
        ) : (
          <>
            <label>Assigned member</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <label>Due day of week</label>
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {dayShort.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </>
        )}
        <label>Description / checklist</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={"One point per line:\nClean toilet bowl\nWipe sink\nWipe mirror"}
        />
        <button className="primary full" onClick={add}>
          Add recurring chore
        </button>
      </div>
      <div className="settings-label">Current recurring chores</div>
      {choreRules.length === 0 && (
        <div className="card muted small">No recurring chores yet.</div>
      )}
      {choreRules.map((rule) => (
        <div className="approval-item" key={rule.id}>
          <b>{rule.name}</b>
          <div className="small muted">{ruleSummary(rule)}</div>
        </div>
      ))}
    </>
  );
}

function RemindersPanel() {
  return (
    <>
      <div className="note warning">
        Reminder rules are admin-controlled so members cannot weaken the accountability system.
      </div>
      {[
        ["Daily roster chores", "Use the selected 1–3 week rotation", "8:00am,12:00pm,5:00pm,8:00pm"],
        ["Weekly chores", "Remind across the week until done", "Mon,Wed,Fri,Sun 8pm"],
        ["Fortnightly chores", "For shower, air fryers and heavier hygiene chores", "Day 1,Day 5,Day 10,Day 14"],
        ["Monthly chores", "Deep-clean / maintenance only", "Start,Middle,End"],
      ].map(([t, m, p]) => (
        <div className="card" key={t}>
          <div className="task-title">{t}</div>
          <div className="task-meta">{m}</div>
          <div className="pill-row">
            {p.split(",").map((x) => (
              <span className="time-pill" key={x}>
                {x}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function RotationPanel({
  currentMember,
  rotation,
  setRotation,
  members,
}: {
  currentMember: string;
  rotation: RotationConfig;
  setRotation: (r: RotationConfig) => void;
  members: Member[];
}) {
  const activeWeeks = ["A", "B", "C"].slice(0, rotation.cycleLength) as Array<"A" | "B" | "C">;

  function updateCycleLength(length: 1 | 2 | 3) {
    setRotation({ ...rotation, cycleLength: length });
  }

  function updateCell(week: "A" | "B" | "C", day: number, memberId: string) {
    setRotation({
      ...rotation,
      weeks: {
        ...rotation.weeks,
        [week]: { ...rotation.weeks[week], [dayKeys[day]]: memberId },
      },
    } as RotationConfig);
  }

  return (
    <>
      <div className="note">
        Choose a 1, 2 or 3-week daily roster cycle, then assign each day to a member.
      </div>
      <div className="card">
        <div className="task-title">Daily rotation length</div>
        <div className="task-meta">Current: {rotationDescription(rotation)}</div>
        <div className="cycle-options">
          <button
            className={rotation.cycleLength === 1 ? "active" : ""}
            onClick={() => updateCycleLength(1)}
          >
            1 week
          </button>
          <button
            className={rotation.cycleLength === 2 ? "active" : ""}
            onClick={() => updateCycleLength(2)}
          >
            2 weeks
          </button>
          <button
            className={rotation.cycleLength === 3 ? "active" : ""}
            onClick={() => updateCycleLength(3)}
          >
            3 weeks
          </button>
        </div>
      </div>
      <div className="rotation-table">
        <div
          className="rotation-row head"
          style={{ gridTemplateColumns: `56px repeat(${activeWeeks.length}, 1fr)` }}
        >
          <div>Day</div>
          {activeWeeks.map((w) => (
            <div key={w}>Week {w}</div>
          ))}
        </div>
        {dayShort.map((day, dayIndex) => (
          <div
            className="rotation-row"
            key={day}
            style={{ gridTemplateColumns: `56px repeat(${activeWeeks.length}, 1fr)` }}
          >
            <div>{day}</div>
            {activeWeeks.map((week) => {
              const selected = rotation.weeks[week][dayKeys[dayIndex]];
              const member = members.find((m) => m.id === selected);
              return (
                <div key={`${week}_${day}`}>
                  <select
                    className={`rotation-select ${member?.colorKey || ""}`}
                    value={selected}
                    onChange={(e) => updateCell(week, dayIndex, e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="rotation-help">Each dropdown is colour-coded to match member colours.</div>
      <button className="primary full" onClick={() => saveRotation(rotation, currentMember)}>
        Save rotation template
      </button>
    </>
  );
}

function SystemPanel({
  currentMember,
  choreRules,
  rotation,
}: {
  currentMember: string;
  choreRules: ChoreRule[];
  rotation: RotationConfig;
}) {
  const dailyCount = choreRules.filter((r) => r.active && r.frequency === "Daily").length;
  const otherCount = choreRules.filter((r) => r.active && r.frequency !== "Daily").length;

  return (
    <>
      <div className="note info">
        The Week view shows your rotation template immediately. This button creates dated chore
        tasks from your recurring rules so they also appear on the Dashboard.
      </div>
      <div className="card">
        <div className="task-title">Generate next 6 weeks</div>
        <div className="task-meta">
          {dailyCount === 0 && otherCount === 0
            ? "Add recurring chores first (Profile → Chores & approvals)."
            : `${dailyCount} daily chore${dailyCount === 1 ? "" : "s"} (uses rotation) · ${otherCount} weekly+ chore${otherCount === 1 ? "" : "s"} (uses assignee + due day).`}
        </div>
        <button
          className="primary full"
          disabled={dailyCount === 0 && otherCount === 0}
          onClick={() => generateSixWeeks(choreRules, rotation, currentMember)}
        >
          Generate next 6 weeks
        </button>
      </div>
    </>
  );
}

function panelTitle(panel: Panel) {
  return panel === "members"
    ? "Members"
    : panel === "chores"
      ? "Chores"
      : panel === "reminders"
        ? "Reminder rules"
        : panel === "rotation"
          ? "Rotation"
          : panel === "system"
            ? "System"
            : "Profile";
}
