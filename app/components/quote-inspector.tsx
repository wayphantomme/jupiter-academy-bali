"use client";

import { TokenInfo } from "../lib/jupiter/constants";
import { TokenSelector } from "./token-selector";
import { QuoteResponse, OrderResponse } from "../lib/jupiter/types";

interface QuoteInspectorProps {
  tokenIn: TokenInfo;
  setTokenIn: (token: TokenInfo) => void;
  tokenOut: TokenInfo;
  setTokenOut: (token: TokenInfo) => void;
  amount: string;
  setAmount: (amount: string) => void;
  slippageBps: number;
  setSlippageBps: (slippage: number) => void;
  swapMode: "ExactIn" | "ExactOut";
  setSwapMode: (mode: "ExactIn" | "ExactOut") => void;
  flow: "aggregator" | "router";
  setFlow: (flow: "aggregator" | "router") => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  quote: QuoteResponse | null;
  order: OrderResponse | null;
  error: any;
  isLoading: boolean;
}

export function QuoteInspector({
  tokenIn,
  setTokenIn,
  tokenOut,
  setTokenOut,
  amount,
  setAmount,
  slippageBps,
  setSlippageBps,
  swapMode,
  setSwapMode,
  flow,
  setFlow,
  apiKey,
  setApiKey,
  quote,
  order,
  error,
  isLoading,
}: QuoteInspectorProps) {
  const handleCopyJSON = () => {
    const data = quote || order || { message: "No data" };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const currentData = quote || order;
  const jsonString = currentData
    ? JSON.stringify(currentData, null, 2)
    : JSON.stringify({ status: "Awaiting parameters...", message: "Please input token pair and amount." }, null, 2);

  // Formatted display values
  const outAmountRaw = quote ? quote.outAmount : (order as any)?.outAmount || "0";
  const inAmountRaw = quote ? quote.inAmount : (order as any)?.inAmount || "0";

  const formattedOutAmount = outAmountRaw !== "0"
    ? (Number(outAmountRaw) / Math.pow(10, tokenOut.decimals)).toLocaleString(undefined, {
        minimumFractionDigits: tokenOut.symbol === "BONK" ? 2 : 4,
        maximumFractionDigits: tokenOut.decimals,
      })
    : "0";

  const priceImpact = quote?.priceImpactPct
    ? `${Number(quote.priceImpactPct).toFixed(3)}%`
    : "N/A";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Left Column: Form Controls */}
      <div className="border border-neutral-800 bg-black p-5 flex flex-col gap-5 font-mono">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <span className="text-xs uppercase tracking-wider text-white font-bold">
            API Configuration & Inputs
          </span>
          <span className="text-[10px] text-neutral-500">v3_swap_router</span>
        </div>

        {/* API Key Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Jupiter API Key
            </label>
            <a
              href="https://developers.jup.ag/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-neutral-500 hover:text-white underline cursor-pointer"
            >
              Get Key
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Jupiter API Key (Leave empty for Mock Mode)"
            className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white placeholder-neutral-700 focus:border-neutral-500 outline-none transition-colors"
          />
          {!apiKey && (
            <span className="text-[9px] text-amber-500/80 leading-normal">
              ⚠ Running in Mock Mode. Real price/quote flows will be simulated.
            </span>
          )}
        </div>

        {/* Flow Selector (Aggregator vs Router) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
            Execution Path
          </label>
          <div className="grid grid-cols-2 border border-neutral-800">
            <button
              type="button"
              onClick={() => setFlow("aggregator")}
              className={`p-2.5 text-xs font-bold transition-all cursor-pointer border-r border-neutral-850 ${
                flow === "aggregator"
                  ? "bg-white text-black"
                  : "bg-black text-neutral-500 hover:text-white"
              }`}
            >
              Meta-Aggregator V2
            </button>
            <button
              type="button"
              onClick={() => setFlow("router")}
              className={`p-2.5 text-xs font-bold transition-all cursor-pointer ${
                flow === "router"
                  ? "bg-white text-black"
                  : "bg-black text-neutral-500 hover:text-white"
              }`}
            >
              Router V1 (Full SDK)
            </button>
          </div>
          <span className="text-[9px] text-neutral-500 leading-normal">
            {flow === "aggregator"
              ? "Meta-Aggregator: Returns quote + pre-packaged transaction. Auto-routes through OKX, JupiterZ, Dflow, Metis."
              : "Router: Uses standard Metis route planner. Perfect for custom instructions and program signers."}
          </span>
        </div>

        {/* Token In / Out Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <TokenSelector
            label="Token In"
            selectedToken={tokenIn}
            onSelect={setTokenIn}
            excludeToken={tokenOut}
          />
          <TokenSelector
            label="Token Out"
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            excludeToken={tokenIn}
          />
        </div>

        {/* Amount Input & Swap Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Amount ({tokenIn.symbol})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white placeholder-neutral-700 focus:border-neutral-500 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Slippage Tolerance (Bps)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={slippageBps}
                onChange={(e) => setSlippageBps(Number(e.target.value))}
                placeholder="50"
                className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white outline-none focus:border-neutral-500"
              />
              <div className="flex items-center text-xs text-neutral-500 bg-neutral-900 border border-neutral-850 px-2 select-none">
                {(slippageBps / 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Swap Mode Toggle */}
        {flow === "router" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Swap Mode
            </label>
            <div className="grid grid-cols-2 border border-neutral-800">
              <button
                type="button"
                onClick={() => setSwapMode("ExactIn")}
                className={`p-1.5 text-xs transition-all cursor-pointer ${
                  swapMode === "ExactIn"
                    ? "bg-neutral-900 text-white font-bold"
                    : "bg-black text-neutral-600 hover:text-white"
                }`}
              >
                Exact In
              </button>
              <button
                type="button"
                onClick={() => setSwapMode("ExactOut")}
                className={`p-1.5 text-xs transition-all cursor-pointer border-l border-neutral-850 ${
                  swapMode === "ExactOut"
                    ? "bg-neutral-900 text-white font-bold"
                    : "bg-black text-neutral-600 hover:text-white"
                }`}
              >
                Exact Out
              </button>
            </div>
          </div>
        )}

        {/* Simple Quote Summary card */}
        {currentData && !error && (
          <div className="border border-neutral-900 bg-neutral-950/50 p-3.5 flex flex-col gap-2 select-none">
            <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold border-b border-neutral-900 pb-1.5">
              Quote Summary
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Expected Return:</span>
              <span className="text-emerald-400 font-bold">
                {formattedOutAmount} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Price Impact:</span>
              <span className="text-white">{priceImpact}</span>
            </div>
            {quote?.routePlan && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Route Hops:</span>
                <span className="text-neutral-350">
                  {quote.routePlan.map((h) => h.swapInfo.label).join(" → ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: JSON Response Viewer */}
      <div className="border border-neutral-800 bg-black p-5 flex flex-col gap-3 font-mono">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-white font-bold">
              Raw API Response
            </span>
            {isLoading && (
              <span className="text-[10px] text-amber-500 animate-pulse">
                [FETCHING...]
              </span>
            )}
          </div>
          <button
            onClick={handleCopyJSON}
            className="text-[9px] uppercase tracking-wider text-neutral-500 hover:text-white transition-colors py-0.5 px-1.5 border border-neutral-800 hover:border-neutral-500 cursor-pointer"
          >
            Copy JSON
          </button>
        </div>

        <div className="flex-1 min-h-[300px] max-h-[460px] overflow-y-auto bg-neutral-950 p-4 border border-neutral-900 rounded-none relative">
          {error ? (
            <pre className="text-red-400 text-xs whitespace-pre-wrap leading-relaxed select-text">
              {JSON.stringify(
                {
                  error: true,
                  message: error.message || "An unexpected error occurred during API call.",
                  suggestion: "Please double check your API key, parameters, and network status.",
                },
                null,
                2
              )}
            </pre>
          ) : (
            <pre className="text-[11px] text-neutral-400 leading-relaxed font-mono whitespace-pre select-text">
              {jsonString}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
