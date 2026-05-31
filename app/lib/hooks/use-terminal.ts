import { useState, useCallback } from "react";

export type LogType = "INFO" | "SUCCESS" | "ERROR" | "WALLET" | "BROADCASTED";

export interface LogEntry {
  type: LogType;
  message: string;
  timestamp: string;
}

export function useTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogType, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
