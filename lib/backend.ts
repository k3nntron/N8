const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

if (import.meta.env.DEV && !backendUrl) {
  console.warn("VITE_BACKEND_URL is not set. Invites and LiveKit calls will not work.");
}

export interface InvitePayload {
  method: "sms" | "whatsapp" | "email";
  to: string;
  serverId: string;
  serverName: string;
  inviteCode: string;
}

export async function sendInvite(payload: InvitePayload): Promise<void> {
  if (!backendUrl) {
    throw new Error("Backend URL is not configured");
  }
  const res = await fetch(`${backendUrl}/invite/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to send invite");
  }
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
}

export async function fetchLiveKitToken(room: string, identity: string, name: string): Promise<LiveKitTokenResponse> {
  if (!backendUrl) {
    throw new Error("Backend URL is not configured");
  }
  const params = new URLSearchParams({ room, identity, name });
  const res = await fetch(`${backendUrl}/livekit/token?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to get LiveKit token");
  }
  return res.json();
}
