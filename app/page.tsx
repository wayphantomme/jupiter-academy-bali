"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "./lib/wallet/context";
import { useBalance } from "./lib/hooks/use-balance";
import { useQuote } from "./lib/hooks/use-quote";
import { useSwap } from "./lib/hooks/use-swap";
import { useTerminal } from "./lib/hooks/use-terminal";
import { PriceTicker } from "./components/price-ticker";
import { QuoteInspector } from "./components/quote-inspector";
import { SwapButton } from "./components/swap-button";
import { TerminalLog } from "./components/terminal-log";
import { WalletButton } from "./components/wallet-button";
import { TOKENS, TokenInfo } from "./lib/jupiter/constants";
import { buildTransaction } from "./lib/jupiter/api";
import { lamportsToSolString } from "./lib/lamports";
import { ellipsify } from "./lib/explorer";

// Helper to convert float display amounts to raw BigInt strings based on token decimals
function getRawAmountString(displayAmount: string, decimals: number): string {
  if (!displayAmount || isNaN(Number(displayAmount))) return "0";
  try {
    const parts = displayAmount.split(".");
    const integerPart = parts[0];
    let decimalPart = parts[1] || "";
    if (decimalPart.length > decimals) {
      decimalPart = decimalPart.substring(0, decimals);
    } else {
      decimalPart = decimalPart.padEnd(decimals, "0");
    }
    return BigInt(integerPart + decimalPart).toString();
  } catch {
    return "0";
  }
}

export default function Home() {
  // Config & Input States
  const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKENS[0]); // SOL
  const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKENS[1]); // USDC
  const [amount, setAmount] = useState<string>("1.0");
  const [slippageBps, setSlippageBps] = useState<number>(50); // 0.5%
  const [swapMode, setSwapMode] = useState<"ExactIn" | "ExactOut">("ExactIn");
  const [flow, setFlow] = useState<"aggregator" | "router">("aggregator");
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jup_playground_api_key");
      if (stored !== null) return stored;
    }
    return process.env.NEXT_PUBLIC_JUP_API_KEY || "";
  });

  const { wallet, status, disconnect } = useWallet();
  const address = wallet?.account.address;
  const balance = useBalance(address);

  // Sync API key to local storage
  useEffect(() => {
    localStorage.setItem("jup_playground_api_key", apiKey);
  }, [apiKey]);

  // Terminal logging
  const { logs, addLog, clearLogs } = useTerminal();

  // Debounce amount changes to avoid spamming the APIs
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 450);
    return () => clearTimeout(timer);
  }, [amount]);

  // Convert amount to raw string
  const rawAmountString = getRawAmountString(
    debouncedAmount,
    swapMode === "ExactIn" ? tokenIn.decimals : tokenOut.decimals
  );

  // Quote Fetching hook
  const { quote, order, error, isLoading } = useQuote({
    inputMint: tokenIn.address,
    outputMint: tokenOut.address,
    amount: rawAmountString,
    slippageBps,
    swapMode,
    flow,
    userPublicKey: address,
    apiKey,
  });

  // Swap hook
  const { execute, isSwapping } = useSwap(addLog);

  // Track parameter changes and log to console
  const lastParamsRef = useRef("");
  useEffect(() => {
    if (!debouncedAmount || debouncedAmount === "0" || debouncedAmount === "") return;
    const currentParams = `${tokenIn.symbol}-${tokenOut.symbol}-${debouncedAmount}-${flow}-${swapMode}-${slippageBps}`;
    
    if (currentParams !== lastParamsRef.current) {
      lastParamsRef.current = currentParams;
      addLog("INFO", `Route request: Swap ${debouncedAmount} ${tokenIn.symbol} → ${tokenOut.symbol} (${flow === "aggregator" ? "Meta-Aggregator V2" : "Router V1"})`);
    }
  }, [debouncedAmount, tokenIn, tokenOut, flow, swapMode, slippageBps, addLog]);

  // Log successful quotes
  const lastQuoteRef = useRef("");
  useEffect(() => {
    if (quote) {
      const quoteHash = `${quote.inAmount}-${quote.outAmount}`;
      if (quoteHash !== lastQuoteRef.current) {
        lastQuoteRef.current = quoteHash;
        const outVal = Number(quote.outAmount) / Math.pow(10, tokenOut.decimals);
        addLog("SUCCESS", `Quote found: ${debouncedAmount} ${tokenIn.symbol} = ${outVal.toFixed(tokenOut.symbol === "BONK" ? 2 : 4)} ${tokenOut.symbol} (Impact: ${quote.priceImpactPct}%)`);
      }
    } else if (order) {
      const orderHash = `${order.requestId}-${order.swapTransaction ? "signed" : "unsigned"}`;
      if (orderHash !== lastQuoteRef.current) {
        lastQuoteRef.current = orderHash;
        const outVal = Number((order as any).outAmount || 0) / Math.pow(10, tokenOut.decimals);
        addLog("SUCCESS", `Order Quote created: ID ${order.requestId}. Estimated return: ${outVal.toFixed(tokenOut.symbol === "BONK" ? 2 : 4)} ${tokenOut.symbol}.`);
      }
    }
  }, [quote, order, tokenOut.decimals, tokenIn.symbol, tokenOut.symbol, debouncedAmount, addLog]);

  // Execute Swap transaction
  const handleSwapExecute = async () => {
    let txBase64 = "";
    let reqId = "";

    try {
      if (flow === "router") {
        if (!quote) {
          addLog("ERROR", "Cannot execute swap: No quote available");
          return;
        }
        if (!wallet) {
          addLog("ERROR", "Cannot execute swap: Wallet not connected");
          return;
        }

        addLog("INFO", "Building serialized transaction via Jupiter `/swap/v1/swap`...");
        const buildResult = await buildTransaction(
          {
            quoteResponse: quote,
            userPublicKey: address!,
          },
          apiKey || undefined
        );
        txBase64 = buildResult.swapTransaction;
        addLog("SUCCESS", "Serialized transaction payload generated.");
      } else {
        if (!order) {
          addLog("ERROR", "Cannot execute swap: No order available");
          return;
        }
        if (!order.swapTransaction) {
          addLog("ERROR", "Cannot execute swap: Transaction payload is empty. Check if wallet is connected.");
          return;
        }
        txBase64 = order.swapTransaction;
        reqId = order.requestId;
      }

      await execute(txBase64, flow, reqId, apiKey);
    } catch (err: any) {
      addLog("ERROR", `Pipeline failed: ${err.message || err}`);
    }
  };

  const hasExecutableTx = flow === "router" ? !!quote : !!(order && order.swapTransaction);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-950 px-6 py-4 flex items-center justify-between font-mono select-none">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 border-2 border-white flex items-center justify-center font-bold text-xs">
            J
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase">
              Jupiter API Power-Playground
            </h1>
            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
              developer demo module // jup_bali_academy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <WalletButton />
        </div>
      </header>

      {/* Price Ticker Banner */}
      <PriceTicker apiKey={apiKey} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Wallet Balance Strip */}
        {status === "connected" && address && (
          <div className="border border-neutral-800 bg-neutral-950/40 p-4 flex flex-wrap items-center justify-between gap-4 font-mono select-none">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                active session address:
              </span>
              <span className="text-xs text-white bg-neutral-900 border border-neutral-850 px-2 py-0.5 font-bold">
                {address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                balance:
              </span>
              <span className="text-sm font-black text-emerald-400">
                {balance.lamports != null ? lamportsToSolString(balance.lamports) : "..."} SOL
              </span>
            </div>
          </div>
        )}

        {/* Two-Column Quote Inspector Panel */}
        <QuoteInspector
          tokenIn={tokenIn}
          setTokenIn={setTokenIn}
          tokenOut={tokenOut}
          setTokenOut={setTokenOut}
          amount={amount}
          setAmount={setAmount}
          slippageBps={slippageBps}
          setSlippageBps={setSlippageBps}
          swapMode={swapMode}
          setSwapMode={setSwapMode}
          flow={flow}
          setFlow={setFlow}
          apiKey={apiKey}
          setApiKey={setApiKey}
          quote={quote}
          order={order}
          error={error}
          isLoading={isLoading}
        />

        {/* Swap execution and terminal controls */}
        <div className="flex flex-col gap-4 w-full">
          <SwapButton
            onClick={handleSwapExecute}
            disabled={!hasExecutableTx || isLoading}
            isSwapping={isSwapping}
          />
          <TerminalLog logs={logs} onClear={clearLogs} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-6 text-center font-mono text-[9px] text-neutral-600 select-none uppercase tracking-widest">
        build v3.1.0 // jup-bali-academy demo suite
      </footer>
    </div>
  );
}
