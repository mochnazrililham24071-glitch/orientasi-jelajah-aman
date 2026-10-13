import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useStatusOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const berhenti = NetInfo.addEventListener((status) => {
      setOnline(!!status.isConnected && status.isInternetReachable !== false);
    });
    return berhenti;
  }, []);

  return online;
}
