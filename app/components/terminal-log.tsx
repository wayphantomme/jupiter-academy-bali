"use client";

import { useEffect, useRef } from "react";
import { LogEntry } from "../lib/hooks/use-terminal";

interface TerminalLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function TerminalLog({ logs, onClear }: TerminalLogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = () => {
    const text = logs
      .map((log) => `[${log.timestamp}] [${log.type}] ${log.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const getLogColorClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "SUCCESS":
        return "text-emerald-400";
      case "ERROR":
        return "text-red-400 font-bold";
      case "WALLET":
        return "text-amber-400";
      case "BROADCASTED":
        return "text-cyan-400 decoration-dotted underline-offset-2";
      default:
        return "text-neutral-300";
    }
  };

  return (
    <div className="w-full border border-neutral-800 bg-black flex flex-col font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4 py-2 select-none">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-neutral-500 rounded-none" />
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
            Developer Console // jup_sdk_pipeline.log
          </span>
        </div>
        <div className="flex items-center gap-3">
          {logs.length > 0 && (
            <button
              onClick={copyToClipboard}
              className="text-[9px] uppercase tracking-wider text-neutral-500 hover:text-white transition-colors py-0.5 px-1 border border-neutral-800 hover:border-neutral-500 cursor-pointer"
            >
              Copy Log
            </button>
          )}
          <button
            onClick={onClear}
            className="text-[9px] uppercase tracking-wider text-neutral-500 hover:text-white transition-colors py-0.5 px-1 border border-neutral-800 hover:border-neutral-500 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="p-4 h-[180px] overflow-y-auto flex flex-col gap-1.5 select-text selection:bg-white selection:text-black"
      >
        {logs.length === 0 ? (
          <div className="text-neutral-600 italic select-none">
            &gt; Console idle. Perform a quote or swap execution to see logs...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-relaxed whitespace-pre-wrap break-all">
              <span className="text-neutral-600 mr-2">[{log.timestamp}]</span>
              <span className="text-neutral-500 mr-2 select-none">[{log.type}]</span>
              <span className={getLogColorClass(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
