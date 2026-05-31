"use client";

import useSWR from "swr";
import { fetchQuote, fetchOrder } from "../jupiter/api";
import { QuoteResponse, OrderResponse } from "../jupiter/types";

export interface UseQuoteResult {
  quote: QuoteResponse | null;
  order: OrderResponse | null;
}

export function useQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  swapMode: "ExactIn" | "ExactOut";
  flow: "aggregator" | "router";
  userPublicKey?: string;
  apiKey: string;
}) {
  const shouldFetch =
    params.inputMint &&
    params.outputMint &&
    params.amount &&
    params.amount !== "0" &&
    params.inputMint !== params.outputMint;

  const key = shouldFetch
    ? [
        "jupiter-quote-or-order",
        params.flow,
        params.inputMint,
        params.outputMint,
        params.amount,
        params.slippageBps,
        params.swapMode,
        params.userPublicKey || "",
        params.apiKey,
      ] as const
    : null;

  const { data, error, isLoading, mutate } = useSWR<UseQuoteResult>(
    key,
    async () => {
      if (params.flow === "router") {
        const quote = await fetchQuote(
          {
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: params.amount,
            slippageBps: params.slippageBps,
            swapMode: params.swapMode,
          },
          params.apiKey || undefined
        );
        return { quote, order: null };
      } else {
        const order = await fetchOrder(
          {
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            inAmount: params.amount,
            slippageBps: params.slippageBps,
            userPublicKey: params.userPublicKey,
          },
          params.apiKey || undefined
        );
        return { quote: null, order };
      }
    },
    {
      refreshInterval: 15_000, // refresh every 15s to keep quotes fresh
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  return {
    quote: data?.quote ?? null,
    order: data?.order ?? null,
    error,
    isLoading,
    mutate,
  };
}
