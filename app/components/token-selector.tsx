"use client";

import { useState } from "react";
import { TOKENS, TokenInfo } from "../lib/jupiter/constants";

interface TokenSelectorProps {
  label: string;
  selectedToken: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  excludeToken?: TokenInfo;
}

export function TokenSelector({ label, selectedToken, onSelect, excludeToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredTokens = TOKENS.filter((t) => t.address !== excludeToken?.address);

  return (
    <div className="relative flex flex-col gap-1.5 w-full">
      <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-neutral-800 bg-neutral-950 p-3 hover:border-neutral-500 transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            className="w-6 h-6 rounded-none bg-neutral-900 border border-neutral-800"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
            }}
          />
          <div>
            <div className="text-sm font-bold text-white tracking-tight">{selectedToken.symbol}</div>
            <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[140px]">
              {selectedToken.name}
            </div>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-[calc(100%+6px)] left-0 w-full border border-neutral-700 bg-black p-1.5 z-50 shadow-2xl">
            <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold px-2 py-1 mb-1 border-b border-neutral-900">
              Select Asset
            </div>
            <div className="flex flex-col max-h-[220px] overflow-y-auto">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 hover:bg-neutral-900 text-left transition-colors duration-100 ${
                    token.address === selectedToken.address ? "bg-neutral-950 border border-neutral-800" : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-5 h-5 rounded-none bg-neutral-900 border border-neutral-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{token.symbol}</div>
                      <div className="text-[9px] text-neutral-500 font-mono">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-neutral-600 select-none">
                    {token.address.slice(0, 4)}...{token.address.slice(-4)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
