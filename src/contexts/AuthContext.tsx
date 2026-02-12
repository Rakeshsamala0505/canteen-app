import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type UserProfile = {
  id: string;
  name: string | null;
  phone: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

   const fetchProfile = async (_userId: string) => {
  setProfileLoading(true);

  const { data, error } = await supabase
    .from("users") // <-- make sure this matches your table name EXACTLY
    .select("id, name, phone")
    .eq("id", _userId)
    .single();

  if (!error && data) {
    setProfile(data);
  } else {
    setProfile(null);
  }

  setProfileLoading(false);
};



    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user || null;
      setUser(sessionUser);

      // 🔥 stop blocking UI immediately
      setInitializing(false);

      // load profile after UI is free
      if (sessionUser) {
        fetchProfile(sessionUser.id);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user || null;
      setUser(sessionUser);

      if (sessionUser) {
        fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, profileLoading, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
