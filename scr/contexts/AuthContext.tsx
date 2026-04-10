import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<Session | null>;
  signIn: (email: string, password: string) => Promise<Session | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

let profileEnsurePromise: Promise<void> | null = null;

const ensureProfileForUser = async (user: User | null) => {
  if (!user) return;
  if (profileEnsurePromise) {
    await profileEnsurePromise;
    return;
  }
  const email = user.email ?? "";
  const fallbackName = email ? email.split("@")[0] : "user";
  const username = (user.user_metadata?.username as string | undefined) || fallbackName;
  const displayName = (user.user_metadata?.display_name as string | undefined) || username;

  profileEnsurePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("Profile lookup failed:", error.message);
        return;
      }
      if (data) return;

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        display_name: displayName,
      });
      if (insertError) {
        console.warn("Profile create failed:", insertError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profile create failed.";
      if (message.toLowerCase().includes("lock")) {
        console.warn("Profile create delayed due to auth lock. It will retry on next auth event.");
      } else {
        console.warn(message);
      }
    } finally {
      profileEnsurePromise = null;
    }
  })();

  await profileEnsurePromise;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    let initialHandled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (ignore) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      void ensureProfileForUser(newSession?.user ?? null);
      if (!initialHandled || event === "INITIAL_SESSION") {
        initialHandled = true;
        setLoading(false);
      }
    });

    const fallbackTimer = setTimeout(() => {
      if (!ignore && !initialHandled) {
        initialHandled = true;
        setLoading(false);
      }
    }, 8000);

    return () => {
      ignore = true;
      clearTimeout(fallbackTimer);
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      }),
        12000,
        "Sign up timed out. Please try again."
      );
      if (error) throw new Error(error.message);
      return data.session ?? null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        12000,
        "Sign in timed out. Please check your network and try again."
      );
      if (error) throw new Error(error.message);
      return data.session ?? null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        8000,
        "Sign out timed out. Please try again."
      );
      if (error) throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      session: null,
      user: null,
      loading: false,
      signUp: async () => null,
      signIn: async () => null,
      signOut: async () => {},
    };
  }
  return context;
};
