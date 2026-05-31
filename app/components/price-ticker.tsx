"use client";

import useSWR from "swr";
import { fetchPrices } from "../lib/jupiter/api";
import { TOKENS } from "../lib/jupiter/constants";

export function PriceTicker({ apiKey }: { apiKey: string }) {
  const mints = TOKENS.map((t) => t.address);

  const { data: prices, error } = useSWR(
    ["prices-ticker", apiKey],
    () => fetchPrices(mints, apiKey || undefined),
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
    }
  );

  return (
    <div className="w-full bg-black border-y border-neutral-900 text-[11px] font-mono text-neutral-400 py-2 px-4 flex flex-wrap items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 ${error ? "bg-red-500" : "bg-emerald-500"} animate-pulse`} />
        <span className="text-neutral-500 font-semibold tracking-wider">JUPITER PRICE V3:</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {TOKENS.map((token) => {
          const priceInfo = prices?.[token.address];
          const price = priceInfo?.usdPrice;
          const change = priceInfo?.priceChange24h;

          return (
            <div key={token.address} className="flex items-center gap-1.5">
              <span className="text-neutral-300 font-bold">{token.symbol}</span>
              <span className="text-white font-medium">
                {price !== undefined
                  ? `$${price.toLocaleString(undefined, {
                      minimumFractionDigits: token.symbol === "BONK" ? 6 : 2,
                      maximumFractionDigits: token.symbol === "BONK" ? 8 : 4,
                    })}`
                  : "..."}
              </span>
              {change !== undefined && (
                <span
                  className={
                    change > 0
                      ? "text-emerald-500"
                      : change < 0
                      ? "text-red-500"
                      : "text-neutral-600"
                  }
                >
                  {change > 0 ? "▲" : change < 0 ? "▼" : "—"}{Math.abs(change).toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-neutral-600 font-semibold tracking-wider">
        {error ? "OFFLINE" : apiKey ? "LIVE FEED" : "DEMO MOCK"}
      </div>
    </div>
  );
}
