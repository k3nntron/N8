import { useState, useEffect, useRef } from "react";
import { Plus, Hash, Volume2, Settings, Send, Mic, Headphones, Users, UserPlus, LogOut, Copy, Home, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Message, ServerMember } from "@/lib/types";
import ServerModal from "@/components/ServerModal";
import FriendsModal from "@/components/FriendsModal";
import InviteModal from "@/components/InviteModal";
import LiveKitCallModal from "@/components/LiveKitCallModal";
import InviteManagerPanel from "@/components/InviteManagerPanel";

const AppDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [callRoom, setCallRoom] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["servers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("server_members")
        .select("server_id")
        .eq("user_id", user!.id);
      if (!memberships?.length) return [];
      const serverIds = memberships.map((m) => m.server_id);
      const { data } = await supabase.from("servers").select("*").in("id", serverIds);
      return data || [];
    },
  });

  useEffect(() => {
    if (servers.length > 0 && !activeServer) {
      setActiveServer(servers[0].id);
    }
  }, [servers, activeServer]);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels", activeServer],
    enabled: !!activeServer,
    queryFn: async () => {
      const { data } = await supabase.from("channels").select("*").eq("server_id", activeServer!).order("created_at");
      return data || [];
    },
  });

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const textCh = channels.find((c) => c.type === "text");
      setActiveChannel(textCh?.id || channels[0].id);
    }
  }, [channels, activeChannel]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeChannel],
    enabled: !!activeChannel,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, profile:profiles!messages_user_id_fkey(*)")
        .eq("channel_id", activeChannel!)
        .order("created_at", { ascending: true })
        .limit(50);
      return data || [];
    },
  });

  // Real-time message subscription
  useEffect(() => {
    if (!activeChannel) return;
    const channel = supabase
      .channel(`messages-${activeChannel}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", activeChannel] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, queryClient]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { data: members = [] } = useQuery({
    queryKey: ["members", activeServer],
    enabled: !!activeServer,
    queryFn: async () => {
      const { data } = await supabase
        .from("server_members")
        .select("*, profile:profiles!server_members_user_id_fkey(*)")
        .eq("server_id", activeServer!);
      return data || [];
    },
  });

  // Real-time member changes for current server
  useEffect(() => {
    if (!activeServer) return;
    const channel = supabase
      .channel(`server-members-${activeServer}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "server_members", filter: `server_id=eq.${activeServer}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["members", activeServer] });
          queryClient.invalidateQueries({ queryKey: ["servers", user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeServer, queryClient, user?.id]);

  // Real-time presence per server
  useEffect(() => {
    if (!activeServer || !user) return;

    const channel = supabase.channel(`presence-${activeServer}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p?.user_id) online.add(p.user_id);
          });
        });
        setOnlineUserIds(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            name: profile?.display_name || profile?.username || "User",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeServer, user, profile?.display_name, profile?.username]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        channel_id: activeChannel!,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeChannel] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSend = () => {
    if (!messageInput.trim() || !activeChannel) return;
    sendMessage.mutate(messageInput.trim());
  };

  const activeServerData = servers.find((s) => s.id === activeServer);
  const activeChannelData = channels.find((c) => c.id === activeChannel);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Server sidebar */}
      <div className="w-[72px] flex-shrink-0 bg-darker-navy flex flex-col items-center py-3 gap-2 overflow-y-auto">
        {/* Home button */}
        <button
          onClick={() => { setActiveServer(null); setActiveChannel(null); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:rounded-xl ${
            !activeServer ? "gradient-blurple rounded-xl" : "bg-secondary hover:bg-primary"
          }`}
          title="Home"
        >
          <Home className="text-foreground" size={20} />
        </button>

        <div className="w-8 h-0.5 bg-border rounded-full my-1" />

        {/* Friends button */}
        <button
          onClick={() => setFriendsOpen(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:rounded-xl bg-secondary hover:bg-primary"
          title="Friends"
        >
          <UserPlus className="text-foreground" size={20} />
        </button>

        <div className="w-8 h-0.5 bg-border rounded-full my-1" />

        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => {
              setActiveServer(server.id);
              setActiveChannel(null);
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold transition-all hover:rounded-xl ${
              activeServer === server.id ? "gradient-blurple rounded-xl text-primary-foreground" : "bg-secondary hover:bg-primary text-foreground"
            }`}
            title={server.name}
          >
            {server.name.substring(0, 2).toUpperCase()}
          </button>
        ))}

        <button
          onClick={() => setModalOpen(true)}
          className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:rounded-xl hover:bg-n8-green transition-all group"
        >
          <Plus className="text-n8-green group-hover:text-foreground transition-colors" size={24} />
        </button>
      </div>

      {/* Channel sidebar */}
      <div className="w-60 flex-shrink-0 bg-card flex flex-col">
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shadow-sm">
          <h2 className="font-bold text-foreground truncate">{activeServerData?.name || "N8"}</h2>
          {activeServerData?.invite_code && (
            <button
              onClick={() => {
                setInviteOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Invite"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
        {activeServerData?.invite_code && (
          <InviteManagerPanel
            serverId={activeServerData.id}
            serverName={activeServerData.name}
            inviteCode={activeServerData.invite_code}
            onInviteOpen={() => setInviteOpen(true)}
            onInviteUpdated={() => queryClient.invalidateQueries({ queryKey: ["servers"] })}
          />
        )}

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {channels.filter((c) => c.type === "text").length > 0 && (
            <div className="mb-4">
              <h3 className="px-2 mb-1 text-xs font-bold uppercase text-muted-foreground tracking-wide">Text Channels</h3>
              {channels.filter((c) => c.type === "text").map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    activeChannel === ch.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Hash size={16} className="flex-shrink-0 opacity-60" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}
          {channels.filter((c) => c.type === "voice").length > 0 && (
            <div>
              <h3 className="px-2 mb-1 text-xs font-bold uppercase text-muted-foreground tracking-wide">Voice Channels</h3>
              {channels.filter((c) => c.type === "voice").map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (!activeServerData) return;
                    const room = `server-${activeServerData.id}-voice-${ch.id}`;
                    setCallRoom(room);
                    setCallOpen(true);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Volume2 size={16} className="flex-shrink-0 opacity-60" />
                    <span className="truncate">{ch.name}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Join</span>
                </button>
              ))}
            </div>
          )}
          {servers.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 px-4">
              <p>No servers yet!</p>
              <p className="text-xs mt-1">Click the + to create or join one</p>
            </div>
          )}
        </div>

        {/* User panel */}
        <div className="h-[52px] bg-darker-navy px-2 flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-n8-green border-2 border-darker-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{profile?.display_name || profile?.username}</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
          <div className="flex gap-1">
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Mic size={16} /></button>
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Headphones size={16} /></button>
            <button onClick={() => navigate("/settings")} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Settings"><Settings size={16} /></button>
            <button onClick={() => { signOut(); navigate("/"); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeServer ? (
          <>
            <div className="h-12 px-4 flex items-center gap-3 border-b border-border shadow-sm flex-shrink-0">
              <Home size={20} className="text-muted-foreground" />
              <span className="font-bold text-foreground">Your Servers</span>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">All Servers</h2>
                  <p className="text-sm text-muted-foreground">Real servers stored in Supabase</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 rounded-full gradient-blurple text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} className="inline-block mr-1" /> Create
                  </button>
                  <button
                    onClick={() => setFriendsOpen(true)}
                    className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <UserPlus size={14} className="inline-block mr-1" /> Friends
                  </button>
                </div>
              </div>

              {servers.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  No servers yet. Create one to get started.
                </div>
              )}

              {servers.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {servers.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => {
                        setActiveServer(server.id);
                        setActiveChannel(null);
                      }}
                      className="text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-semibold text-foreground">{server.name}</div>
                        <div className="text-xs text-muted-foreground">Open</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Invite: {server.invite_code || "No code"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Server chat view */
          <>
            <div className="h-12 px-4 flex items-center gap-3 border-b border-border shadow-sm flex-shrink-0">
              <Hash size={20} className="text-muted-foreground" />
              <span className="font-bold text-foreground">{activeChannelData?.name || "general"}</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!activeServerData) return;
                    const room = `server-${activeServerData.id}-channel-${activeChannelData?.id || "general"}`;
                    setCallRoom(room);
                    setCallOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80"
                >
                  <Phone size={14} className="inline-block mr-1" /> Start Call
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && activeChannel && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <p className="text-lg mb-1">Welcome to #{activeChannelData?.name}!</p>
                  <p>This is the beginning of this channel. Say hi! 👋</p>
                </div>
              )}
              {messages.map((msg: Message, i: number) => (
                <motion.div
                  key={msg.id}
                  className="flex gap-3 group hover:bg-secondary/30 -mx-4 px-4 py-1 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 text-primary-foreground">
                    {(msg.profile?.display_name || msg.profile?.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-foreground text-sm">{msg.profile?.display_name || msg.profile?.username}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-secondary-foreground leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {activeChannel && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 bg-secondary rounded-lg px-4 py-2">
                  <input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={`Message #${activeChannelData?.name || "general"}`}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={handleSend} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Members sidebar */}
      <div className="w-60 flex-shrink-0 bg-card border-l border-border hidden lg:block overflow-y-auto">
        <div className="px-4 py-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-3">
            Members — {members.length}
          </h3>
          <div className="space-y-1">
            {members.map((m: ServerMember) => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                    {(m.profile?.display_name || m.profile?.username || "U")[0].toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${onlineUserIds.has(m.user_id) ? "bg-n8-green" : "bg-muted"}`} />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{m.profile?.display_name || m.profile?.username}</span>
                  {m.role === "owner" && <span className="text-[10px] text-n8-yellow ml-1">OWNER</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ServerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onServerCreated={() => queryClient.invalidateQueries({ queryKey: ["servers"] })}
      />
      <FriendsModal isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />
      {activeServerData && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          serverId={activeServerData.id}
          serverName={activeServerData.name}
          inviteCode={activeServerData.invite_code}
        />
      )}
      {activeServerData && user && callRoom && (
        <LiveKitCallModal
          isOpen={callOpen}
          onClose={() => {
            setCallOpen(false);
            setCallRoom(null);
          }}
          room={callRoom}
          identity={user.id}
          name={profile?.display_name || profile?.username || "User"}
        />
      )}
    </div>
  );
};

export default AppDashboard;
