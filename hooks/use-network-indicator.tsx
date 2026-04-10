import { useNetwork } from "./use-network";
import { WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";

export function useNetworkIndicator() {
  const { isOnline, isOffline } = useNetwork();

  const notifyNetworkChange = (wasOnline: boolean, nowOnline: boolean) => {
    if (wasOnline && !nowOnline) {
      toast.warning("You're offline. Changes will sync when reconnected.", {
        icon: <WifiOff className="w-4 h-4" />,
        duration: 5000
      });
    } else if (!wasOnline && nowOnline) {
      toast.success("You're back online!", {
        icon: <Wifi className="w-4 h-4" />,
        duration: 3000
      });
    }
  };

  return {
    isOnline,
    isOffline,
    notifyNetworkChange
  };
}
