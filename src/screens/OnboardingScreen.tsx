import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  createHousehold,
  joinHousehold,
  userFromAuth,
} from "../services/firestore";
import { dlog } from "../lib/debug";

import type { UserProfile } from "../domain/types";

type Mode = "choose" | "create" | "join";

export function OnboardingScreen({
  user,
  onComplete,
}: {
  user: User;
  onComplete: (profile: UserProfile) => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [householdName, setHouseholdName] = useState("");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [householdId, setHouseholdId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const household = params.get("household");
    if (invite && household) {
      setMode("join");
      setInviteCode(invite.toUpperCase());
      setHouseholdId(household);
    }
  }, []);

  async function handleCreate() {
    if (!householdName.trim() || !displayName.trim()) {
      setError("Household name and your name are required.");
      return;
    }
    setLoading(true);
    setError("");
    dlog("info", "handleCreate: starting", { user: user.uid });
    try {
      const authUser = userFromAuth(user);
      const id = await createHousehold({
        name: householdName.trim(),
        displayName: displayName.trim(),
        uid: authUser.uid,
        email: authUser.email,
        photoURL: authUser.photoURL,
      });
      dlog("info", "handleCreate: success, navigating to dashboard", { householdId: id });
      onComplete({
        uid: authUser.uid,
        householdId: id,
        displayName: displayName.trim(),
        email: authUser.email,
        photoURL: authUser.photoURL,
      });
    } catch (err) {
      dlog("error", "handleCreate: FAILED", err);
      setError(err instanceof Error ? err.message : "Could not create household.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!householdId.trim() || !inviteCode.trim()) {
      setError("Household ID and invite code are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authUser = userFromAuth(user);
      const id = householdId.trim();
      await joinHousehold(id, inviteCode.trim(), authUser);
      onComplete({
        uid: authUser.uid,
        householdId: id,
        displayName: authUser.displayName,
        email: authUser.email,
        photoURL: authUser.photoURL,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join household.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Welcome</h1>
          <p>Create a new household or join one with an invite code.</p>
          {error && <div className="note warning">{error}</div>}
          <button className="primary full" onClick={() => setMode("create")}>
            Create household
          </button>
          <button className="ghost full" onClick={() => setMode("join")}>
            Join with invite code
          </button>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <button className="back-link" onClick={() => setMode("choose")}>
            Back
          </button>
          <h1>Create household</h1>
          <p>You will be the admin for this household.</p>
          {error && <div className="note warning">{error}</div>}
          <label>Household name</label>
          <input
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="e.g. Klein family"
          />
          <label>Your name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          <button className="primary full" disabled={loading} onClick={handleCreate}>
            {loading ? "Creating..." : "Create household"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <button className="back-link" onClick={() => setMode("choose")}>
          Back
        </button>
        <h1>Join household</h1>
        <p>Enter the invite details shared by your household admin.</p>
        {error && <div className="note warning">{error}</div>}
        <label>Household ID</label>
        <input
          value={householdId}
          onChange={(e) => setHouseholdId(e.target.value)}
          placeholder="From invite link"
        />
        <label>Invite code</label>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="6-character code"
        />
        <button className="primary full" disabled={loading} onClick={handleJoin}>
          {loading ? "Joining..." : "Join household"}
        </button>
      </div>
    </div>
  );
}
