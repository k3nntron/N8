import { useState, useEffect, useCallback } from "react";

type NetworkStatus = "online" | "offline";

interface UseNetworkReturn {
  isOnline: boolean;
  isOffline: boolean;
  status: NetworkStatus;
}

export function useNetwork(): UseNetworkReturn {
  const [status, setStatus] = useState<NetworkStatus>(
    typeof navigator !== "undefined" ? (navigator.onLine ? "online" : "offline") : "online"
  );

  useEffect(() => {
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline: status === "online",
    isOffline: status === "offline",
    status
  };
}

interface PendingAction {
  id: string;
  type: "message" | "friend" | "server";
  payload: unknown;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const STORAGE_KEY = "n8_pending_actions";

export function useOfflineSync() {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { isOnline } = useNetwork();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  const addPendingAction = useCallback((action: Omit<PendingAction, "id" | "timestamp" | "retries">) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };
    setPendingActions(prev => [...prev, newAction]);
  }, []);

  const removePendingAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const retryPendingActions = useCallback(async (syncFn: (action: PendingAction) => Promise<void>) => {
    for (const action of pendingActions) {
      try {
        await syncFn(action);
        removePendingAction(action.id);
      } catch {
        setPendingActions(prev => 
          prev.map(a => 
            a.id === action.id 
              ? { ...a, retries: a.retries + 1 }
              : a
          ).filter(a => a.retries < MAX_RETRIES)
        );
      }
    }
  }, [pendingActions, removePendingAction]);

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      console.log(`Network restored. ${pendingActions.length} pending actions ready to sync.`);
    }
  }, [isOnline, pendingActions.length]);

  return {
    pendingActions,
    addPendingAction,
    removePendingAction,
    retryPendingActions,
    hasPendingActions: pendingActions.length > 0
  };
}

export function useRealtimeSubscription(
  channelName: string,
  callbacks: {
    onInsert?: (payload: unknown) => void;
    onUpdate?: (payload: unknown) => void;
    onDelete?: (payload: unknown) => void;
  },
  deps: unknown[]
) {
  const { isOnline } = useNetwork();
  
  useEffect(() => {
    if (!isOnline) {
      console.log(`Offline: skipping subscription ${channelName}`);
      return;
    }

    // The actual subscription logic would be handled by the component
    // This is just for network state awareness
  }, [channelName, isOnline, ...deps]);
}
