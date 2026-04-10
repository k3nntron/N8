export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  servers: string[];
  createdAt?: string;
}

export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface Server {
  id: string;
  name: string;
  inviteCode?: string;
  ownerId: string;
  createdAt?: string;
  memberCount?: number;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  createdAt?: string;
}

export type ChannelType = "text" | "voice";

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  role: MemberRole;
  profile?: Profile;
}

export type MemberRole = "owner" | "admin" | "member";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: UserStatus;
  friendshipId: string;
}

export interface PendingFriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester: Profile;
  created_at: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
  sourceId: string;
}

export type NotificationType = "mention" | "reply" | "reaction" | "friend_request" | "server_invite";

export interface QueryKeys {
  profile: ["profile", string];
  servers: ["servers", string];
  channels: ["channels", string];
  messages: ["messages", string];
  members: ["members", string];
}

export const queryKeys: QueryKeys = {
  profile: ["profile"],
  servers: ["servers"],
  channels: ["channels"],
  messages: ["messages"],
  members: ["members"],
};
