"use client";

import { useState } from "react";
import { useWallet } from "../lib/wallet/context";

interface SwapButtonProps {
  onClick: () => Promise<void>;
  disabled: boolean;
  isSwapping: boolean;
}

export function SwapButton({ onClick, disabled, isSwapping }: SwapButtonProps) {
  const { status, connectors, connect, wallet, disconnect } = useWallet();
  const [showConnectorModal, setShowConnectorModal] = useState(false);

  const handleWalletClick = async (connectorId: string) => {
    try {
      setShowConnectorModal(false);
      await connect(connectorId);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  if (status === "disconnected") {
    return (
      <div className="relative w-full font-mono">
        <button
          type="button"
          onClick={() => setShowConnectorModal(!showConnectorModal)}
          className="w-full bg-white text-black p-3.5 text-sm font-black tracking-widest hover:bg-neutral-200 transition-colors uppercase cursor-pointer"
        >
          [ CONNECT WALLET ]
        </button>

        {showConnectorModal && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowConnectorModal(false)}
            />
            <div className="absolute bottom-[calc(100%+6px)] left-0 w-full border border-neutral-700 bg-black p-2 z-50 shadow-2xl flex flex-col gap-1">
              <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold px-2 py-1 mb-1 border-b border-neutral-900 select-none">
                Select Solana Wallet
              </div>
              {connectors.length === 0 ? (
                <div className="text-[10px] text-neutral-500 italic p-2 select-none">
                  No compatible wallet extensions found. Please install Phantom or Backpack.
                </div>
              ) : (
                connectors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleWalletClick(c.id)}
                    className="w-full flex items-center gap-3 p-2 border border-transparent hover:border-neutral-800 hover:bg-neutral-950 text-left transition-colors cursor-pointer"
                  >
                    {c.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.icon} alt={c.name} className="w-5 h-5 rounded-none" />
                    )}
                    <span className="text-xs font-bold text-white uppercase">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-500 p-3.5 text-sm font-bold tracking-widest uppercase select-none"
      >
        [ CONNECTING WALLET... ]
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSwapping}
      className={`w-full p-3.5 text-sm font-black tracking-widest uppercase transition-all duration-150 border font-mono cursor-pointer ${
        isSwapping
          ? "bg-neutral-950 border-neutral-850 text-amber-500 cursor-not-allowed"
          : disabled
          ? "bg-neutral-950 border-neutral-900 text-neutral-600 cursor-not-allowed"
          : "bg-white text-black border-transparent hover:bg-neutral-250"
      }`}
    >
      {isSwapping ? "[ ATOMIC SWAP IN PROGRESS... ]" : "[ EXECUTE ATOMIC SWAP ]"}
    </button>
  );
}
