import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { Member, UserProfile } from "../domain/types";
import { subscribeMember, subscribeUserProfile } from "../services/firestore";
import { dlog } from "../lib/debug";

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [error, setError] = useState("");

  const applyProfile = useCallback((next: UserProfile) => {
    dlog("info", "Applying profile optimistically", { householdId: next.householdId });
    setProfile(next);
    setProfileReady(true);
    setLoading(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMember(null);
      setLoading(false);
      setProfileReady(false);
      setError("");
      return;
    }

    dlog("info", "Subscribing to user profile doc", { uid: user.uid });
    setLoading(true);
    setProfileReady(false);
    setError("");

    const unsubProfile = subscribeUserProfile(
      user.uid,
      (nextProfile) => {
        dlog("info", "User profile snapshot", nextProfile ? { householdId: nextProfile.householdId } : "no profile doc");
        setProfile(nextProfile);
        setProfileReady(true);
        if (!nextProfile?.householdId) {
          setMember(null);
          setLoading(false);
        }
      },
      (message) => {
        dlog("error", "User profile listener failed", message);
        setError(message);
        setProfileReady(true);
        setLoading(false);
      }
    );

    return () => unsubProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.householdId) return;

    dlog("info", "Subscribing to member doc", { householdId: profile.householdId, uid: user.uid });
    setLoading(true);
    const unsubMember = subscribeMember(
      profile.householdId,
      user.uid,
      (nextMember) => {
        dlog("info", "Member snapshot", nextMember ? { role: nextMember.role } : "no member doc");
        setMember(nextMember);
        setLoading(false);
      },
      (message) => {
        dlog("error", "Member listener failed", message);
        setError(message);
        setLoading(false);
      }
    );

    return () => unsubMember();
  }, [user, profile?.householdId]);

  return { profile, member, loading, profileReady, error, applyProfile, setError };
}
