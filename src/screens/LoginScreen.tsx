import { useState } from "react";
import { Home } from "lucide-react";
import { signInWithGoogle } from "../services/auth";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">
          <Home size={32} strokeWidth={1.75} />
        </div>
        <h1>Family Chores</h1>
        <p>Sign in to manage your household tasks together.</p>
        {error && <div className="note warning">{error}</div>}
        <button className="primary full google-btn" disabled={loading} onClick={handleSignIn}>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
