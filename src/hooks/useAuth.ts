import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { completeRedirectSignIn, subscribeAuth } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    completeRedirectSignIn().finally(() => {
      if (!active) return;
      cleanup = subscribeAuth((nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return { user, loading };
}
