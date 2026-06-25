import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Home, ScrollText } from "lucide-react";
import type { Member, RotationConfig, TaskInstance } from "./domain/types";
import { addDays, getMonday } from "./domain/rules";
import { useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { useHouseholdData } from "./hooks/useHouseholdData";
import { claimTask, saveRotation, updateTaskStatus } from "./services/firestore";
import { Dashboard } from "./screens/Dashboard";
import { Week } from "./screens/Week";
import { Activity } from "./screens/Activity";
import { Profile } from "./screens/Profile";
import { LoginScreen } from "./screens/LoginScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { OneOffTaskModal } from "./components/OneOffTaskModal";
import { ReasonModal } from "./components/ReasonModal";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { DebugPanel } from "./components/DebugPanel";

type Screen = "dashboard" | "week" | "activity" | "profile";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { profile, member, loading: profileLoading, profileReady, applyProfile, error: profileError } =
    useUserProfile(user);
  const householdId = profile?.householdId ?? null;
  const {
    loading: dataLoading,
    error,
    members,
    memberMap,
    tasks,
    activities,
    choreRules,
    rotation,
    setRotation,
  } = useHouseholdData(householdId);

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekScope, setWeekScope] = useState<"everyone" | "me">("everyone");
  const [weekTodayJump, setWeekTodayJump] = useState(0);
  const [oneOffOpen, setOneOffOpen] = useState(false);
  const [reasonTask, setReasonTask] = useState<TaskInstance | null>(null);
  const [reasonAction, setReasonAction] = useState<"unable" | "swap" | null>(null);
  const [detailTask, setDetailTask] = useState<TaskInstance | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const currentMember = user?.uid ?? "";
  const weekStart = useMemo(() => addDays(getMonday(new Date()), weekOffset * 7), [weekOffset]);

  function moveWeek(delta: number) {
    setWeekOffset((c) => Math.min(5, Math.max(0, c + delta)));
  }

  function goToTodayWeek() {
    setWeekOffset(0);
    setWeekTodayJump((n) => n + 1);
  }

  async function handleRotationChange(next: RotationConfig) {
    setRotation(next);
    await saveRotation(next, currentMember);
  }

  if (authLoading) {
    return (
      <Shell>
        <StateScreen>
          <div className="card">Loading...</div>
        </StateScreen>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <LoginScreen />
      </Shell>
    );
  }

  if (!profileReady || profileLoading) {
    return (
      <Shell>
        <StateScreen>
          <div className="card">Loading profile...</div>
        </StateScreen>
      </Shell>
    );
  }

  if (!profile?.householdId) {
    return (
      <Shell>
        <OnboardingScreen user={user} onComplete={applyProfile} />
      </Shell>
    );
  }

  if (profileError) {
    return (
      <Shell>
        <StateScreen>
          <div className="card error-card">
            <b>Profile error</b>
            <p>{profileError}</p>
          </div>
        </StateScreen>
      </Shell>
    );
  }

  if (dataLoading) {
    return (
      <Shell>
        <StateScreen>
          <div className="card">Loading household data...</div>
        </StateScreen>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <StateScreen>
          <div className="card error-card">
            <b>Firebase error</b>
            <p>{error}</p>
            <p>Check Firestore rules are deployed and you belong to this household.</p>
          </div>
        </StateScreen>
      </Shell>
    );
  }

  const me = member ?? memberMap[currentMember];
  const isAdmin = me?.role === "admin";

  return (
    <Shell>
      <header className="topbar">
        <div>
          <h1>{titleFor(screen)[0]}</h1>
          <p>{titleFor(screen)[1]}</p>
        </div>
        <button
          className={`avatar ${me?.colorKey || "green"}`}
          onClick={() => setScreen("profile")}
        >
          {me?.photoURL ? (
            <img src={me.photoURL} alt="" className="avatar-img" />
          ) : (
            me?.initials || "?"
          )}
        </button>
      </header>
      <main>
        {screen === "dashboard" && (
          <Dashboard
            tasks={tasks}
            members={memberMap}
            currentMember={currentMember}
            weekStart={getMonday(new Date())}
            onCreateOneOff={() => setOneOffOpen(true)}
            onDone={(task) => updateTaskStatus(task, "done", currentMember)}
            onCantDo={(task) => {
              setReasonTask(task);
              setReasonAction("unable");
            }}
            onSwap={(task) => {
              setReasonTask(task);
              setReasonAction("swap");
            }}
            onClaim={(task) => claimTask(task, currentMember)}
            onOpen={setDetailTask}
          />
        )}
        {screen === "week" && (
          <Week
            tasks={tasks}
            members={memberMap}
            currentMember={currentMember}
            weekStart={weekStart}
            weekOffset={weekOffset}
            todayJump={weekTodayJump}
            rotation={rotation}
            scope={weekScope}
            setScope={setWeekScope}
            moveWeek={moveWeek}
            onGoToToday={goToTodayWeek}
            onOpen={setDetailTask}
          />
        )}
        {screen === "activity" && (
          <Activity activities={activities} members={memberMap} />
        )}
        {screen === "profile" && (
          <Profile
            user={user}
            member={me}
            members={members}
            householdId={householdId!}
            rotation={rotation}
            setRotation={handleRotationChange}
            choreRules={choreRules}
            debugOpen={debugOpen}
            onDebugOpenChange={setDebugOpen}
          />
        )}
      </main>
      <nav className="bottom-nav">
        <button
          type="button"
          className={screen === "dashboard" ? "active" : ""}
          onClick={() => setScreen("dashboard")}
        >
          <Home size={22} strokeWidth={2} />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={screen === "week" ? "active" : ""}
          onClick={() => setScreen("week")}
        >
          <CalendarDays size={22} strokeWidth={2} />
          <span>Week</span>
        </button>
        <button
          type="button"
          className={screen === "activity" ? "active" : ""}
          onClick={() => setScreen("activity")}
        >
          <ScrollText size={22} strokeWidth={2} />
          <span>Activity</span>
        </button>
      </nav>
      {isAdmin && debugOpen && <DebugPanel onClose={() => setDebugOpen(false)} />}
      <OneOffTaskModal
        isOpen={oneOffOpen}
        currentMember={currentMember}
        members={members}
        onClose={() => setOneOffOpen(false)}
      />
      <ReasonModal
        task={reasonTask}
        action={reasonAction}
        currentMember={currentMember}
        members={members}
        onClose={() => {
          setReasonTask(null);
          setReasonAction(null);
        }}
      />
      <TaskDetailModal
        task={detailTask}
        currentMember={currentMember}
        members={memberMap}
        onClose={() => setDetailTask(null)}
        onCantDo={(task) => {
          setDetailTask(null);
          setReasonTask(task);
          setReasonAction("unable");
        }}
        onSwap={(task) => {
          setDetailTask(null);
          setReasonTask(task);
          setReasonAction("swap");
        }}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell">{children}</div>;
}

function StateScreen({ children }: { children: ReactNode }) {
  return <div className="state-screen">{children}</div>;
}

function titleFor(screen: Screen): [string, string] {
  if (screen === "week") return ["Week", "Roster and planning"];
  if (screen === "activity") return ["Activity", "What happened"];
  if (screen === "profile") return ["Profile", "Account and admin"];
  return ["Dashboard", "Your household week"];
}
