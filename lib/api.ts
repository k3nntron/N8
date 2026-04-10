import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: "online" | "idle" | "dnd" | "offline";
  created_at: string;
}

export interface Server {
  id: string;
  name: string;
  invite_code: string | null;
  owner_id: string;
  created_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  type: "text" | "voice";
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  profile?: Profile;
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const handleError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new ApiError(500, error.message);
  }
  throw new ApiError(500, "An unexpected error occurred");
};

const handleResponse = <T>(data: T | null, error: unknown): T => {
  if (error) handleError(error);
  if (!data) throw new ApiError(404, "Resource not found");
  return data;
};

export const api = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return handleResponse(data, error);
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return handleResponse(data, error);
  },

  async getServers(userId: string): Promise<Server[]> {
    const { data: memberships, error: membershipError } = await supabase
      .from("server_members")
      .select("server_id")
      .eq("user_id", userId);

    if (membershipError) handleError(membershipError);
    if (!memberships?.length) return [];

    const serverIds = memberships.map((m) => m.server_id);
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .in("id", serverIds);

    return handleResponse(data, error);
  },

  async createServer(name: string, userId: string): Promise<Server> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .insert({ name, owner_id: userId, invite_code: inviteCode })
      .select()
      .single();
    
    if (serverError) handleError(serverError);

    const { error: memberError } = await supabase
      .from("server_members")
      .insert({ server_id: server!.id, user_id: userId, role: "owner" });

    if (memberError) handleError(memberError);

    return server!;
  },

  async joinServer(inviteCode: string, userId: string): Promise<Server> {
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("*")
      .eq("invite_code", inviteCode)
      .single();

    if (serverError || !server) {
      throw new ApiError(404, "Invalid invite code");
    }

    const { error: memberError } = await supabase
      .from("server_members")
      .insert({ server_id: server.id, user_id: userId, role: "member" });

    if (memberError?.code === "23505") {
      throw new ApiError(400, "Already a member of this server");
    }
    if (memberError) handleError(memberError);

    return server;
  },

  async getChannels(serverId: string): Promise<Channel[]> {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("server_id", serverId)
      .order("created_at");
    return handleResponse(data, error);
  },

  async createChannel(serverId: string, name: string, type: "text" | "voice"): Promise<Channel> {
    const { data, error } = await supabase
      .from("channels")
      .insert({ server_id: serverId, name, type })
      .select()
      .single();
    return handleResponse(data, error);
  },

  async getMessages(channelId: string, limit = 50, before?: string): Promise<Message[]> {
    let query = supabase
      .from("messages")
      .select("*, profile:profiles!messages_user_id_fkey(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    return handleResponse(data, error);
  },

  async sendMessage(channelId: string, userId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({ channel_id: channelId, user_id: userId, content })
      .select("*, profile:profiles(*)")
      .single();
    return handleResponse(data, error);
  },

  async getMembers(serverId: string): Promise<ServerMember[]> {
    const { data, error } = await supabase
      .from("server_members")
      .select("*, profile:profiles!server_members_user_id_fkey(*)")
      .eq("server_id", serverId);
    return handleResponse(data, error);
  },

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", userId);

    if (error) handleError(error);
  },

  async leaveServer(serverId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("server_members")
      .delete()
      .eq("server_id", serverId)
      .eq("user_id", userId);

    if (error) handleError(error);
  }
};
