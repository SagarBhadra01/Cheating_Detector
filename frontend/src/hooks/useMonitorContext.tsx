import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface MonitorContextType {
  isMonitoring: boolean;
  setIsMonitoring: (v: boolean) => void;
}

const MonitorContext = createContext<MonitorContextType>({
  isMonitoring: false,
  setIsMonitoring: () => {},
});

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  return (
    <MonitorContext.Provider value={{ isMonitoring, setIsMonitoring }}>
      {children}
    </MonitorContext.Provider>
  );
}

export function useMonitorContext() {
  return useContext(MonitorContext);
}
