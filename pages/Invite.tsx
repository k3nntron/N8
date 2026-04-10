import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Invite = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "joining" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverName, setServerName] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    if (loading) return;
    if (!user) {
      localStorage.setItem("pending_invite_code", code);
      toast.info("Please sign in to accept the invite.");
      navigate("/auth");
      return;
    }

    const join = async () => {
      setStatus("joining");
      try {
        const { data, error } = await supabase.rpc("join_server_by_invite", {
          p_invite_code: code.toUpperCase(),
        });
        if (error) throw error;
        const server = Array.isArray(data) ? data[0] : data;
        if (!server) throw new Error("Invalid invite code");
        setServerName(server.server_name || server.name);
        setStatus("done");
        toast.success(`Joined "${server.server_name || server.name}"`);
        queryClient.invalidateQueries({ queryKey: ["servers"] });
        queryClient.invalidateQueries({ queryKey: ["members"] });
        navigate("/app");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join server";
        setStatus("error");
        setErrorMessage(message);
        toast.error(message);
      }
    };

    join();
  }, [code, loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-card rounded-xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Server Invite</h1>
        {status === "joining" && <p className="text-muted-foreground">Joining {serverName || "server"}...</p>}
        {status === "done" && <p className="text-muted-foreground">Success! Redirecting to your server...</p>}
        {status === "error" && (
          <p className="text-destructive">
            Invite failed. {errorMessage ? errorMessage : "Please check the link."}
          </p>
        )}
        {status === "idle" && <p className="text-muted-foreground">Preparing invite...</p>}
      </div>
    </div>
  );
};

export default Invite;
