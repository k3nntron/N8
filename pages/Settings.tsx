import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, User, Shield, Bell, Palette } from "lucide-react";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"account" | "profile" | "notifications">("account");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  // Sync form with fetched profile
  const isLoaded = !!profile;
  if (isLoaded && !displayName && !username) {
    setDisplayName(profile.display_name || "");
    setUsername(profile.username || "");
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), username: username.trim() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user) { navigate("/auth"); return null; }

  const tabs = [
    { id: "account" as const, label: "My Account", icon: User },
    { id: "profile" as const, label: "Edit Profile", icon: Palette },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border flex flex-col py-6 px-3">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 px-3 text-sm"
        >
          <ArrowLeft size={16} /> Back to N8
        </button>
        <h3 className="px-3 text-xs font-bold uppercase text-muted-foreground tracking-wide mb-3">User Settings</h3>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
              tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
        <div className="mt-auto px-3">
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full text-left text-sm text-destructive hover:underline"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-2xl">
        {tab === "account" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">My Account</h2>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-foreground font-bold text-lg">{profile?.display_name || profile?.username}</p>
                  <p className="text-muted-foreground text-sm">@{profile?.username}</p>
                  <p className="text-muted-foreground text-xs mt-1">{user.email}</p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground text-sm">{user.email}</p>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">User ID</p>
                  <p className="text-foreground text-xs font-mono">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h2>
            <div className="bg-card rounded-xl p-6 border border-border space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-secondary-foreground mb-1 block">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-secondary-foreground mb-1 block">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => updateProfile.mutate()}
                disabled={updateProfile.isPending}
                className="px-6 py-2 rounded-md gradient-blurple text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Notifications</h2>
            <div className="bg-card rounded-xl p-6 border border-border space-y-4">
              {["Enable Desktop Notifications", "Enable Message Sounds", "Enable Friend Request Notifications"].map((setting) => (
                <div key={setting} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <span className="text-foreground text-sm">{setting}</span>
                  <div className="w-10 h-5 rounded-full bg-n8-green relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
