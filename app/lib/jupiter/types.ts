import { TokenInfo } from "./constants";

export interface PriceData {
  createdAt: string;
  liquidity: number;
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h?: number;
}

export type PriceResponse = Record<string, PriceData>;

export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface RoutePlanStep {
  swapInfo: SwapInfo;
  percent: number;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot?: number;
  timeTaken?: number;
  errorCode?: string;
  error?: string;
}

export interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  errorCode?: string;
  error?: string;
}

export interface OrderResponse {
  requestId: string;
  swapTransaction: string;
  totalTime: number;
  feeAmount: number;
  errorCode?: string;
  error?: string;
}

export interface ExecuteResponse {
  signature?: string;
  txid?: string;
  error?: string;
}
