import { TokenInfo, TOKENS, JUP_API_BASE } from "./constants";
import { PriceResponse, QuoteResponse, SwapResponse, OrderResponse, ExecuteResponse } from "./types";

// Static mock prices with slight random fluctuation
const MOCK_BASE_PRICES: Record<string, number> = {
  "So11111111111111111111111111111111111111112": 142.50, // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 1.00,   // USDC
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": 1.15,   // JUP
  "JuprjznTrTSp2UFa3ZBUFgwdAmtZCq4MQCwysN55USD": 1.00,   // jupUSD
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": 0.000022 // BONK
};

function getMockPrice(mint: string): number {
  const base = MOCK_BASE_PRICES[mint] || 1.0;
  // Add minor fluctuation +-0.2%
  const fluctuation = 1 + (Math.random() * 0.004 - 0.002);
  return base * fluctuation;
}

function getHeaders(apiKey?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

export async function fetchPrices(mints: string[], apiKey?: string): Promise<PriceResponse> {
  if (!apiKey) {
    // Generate mock price response
    const mockResponse: PriceResponse = {};
    const now = new Date().toISOString();
    mints.forEach((mint) => {
      const token = TOKENS.find(t => t.address === mint);
      const dec = token ? token.decimals : 9;
      mockResponse[mint] = {
        createdAt: now,
        liquidity: 15000000 + Math.random() * 5000000,
        usdPrice: getMockPrice(mint),
        blockId: 348000000 + Math.floor(Math.random() * 100000),
        decimals: dec,
        priceChange24h: Math.random() * 6 - 3, // -3% to +3%
      };
    });
    return mockResponse;
  }

  try {
    const res = await fetch(`${JUP_API_BASE}/price/v3?ids=${mints.join(",")}`, {
      headers: getHeaders(apiKey),
    });
    if (!res.ok) {
      throw new Error(`Price API error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn("Real Price API failed, falling back to mock prices:", error);
    // Silent fallback so ticker never breaks
    return fetchPrices(mints, undefined);
  }
}

export async function fetchQuote(
  params: {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps: number;
    swapMode: "ExactIn" | "ExactOut";
  },
  apiKey?: string
): Promise<QuoteResponse> {
  if (!apiKey) {
    // Mock quote calculation
    const inputToken = TOKENS.find((t) => t.address === params.inputMint);
    const outputToken = TOKENS.find((t) => t.address === params.outputMint);

    if (!inputToken || !outputToken) {
      throw new Error("Invalid token pair selected");
    }

    const priceIn = getMockPrice(params.inputMint);
    const priceOut = getMockPrice(params.outputMint);

    const inDec = inputToken.decimals;
    const outDec = outputToken.decimals;

    // Convert raw amount to standard float based on the swap mode
    const rawAmount = BigInt(params.amount);
    const isExactIn = params.swapMode === "ExactIn";
    const floatAmount = Number(rawAmount) / Math.pow(10, isExactIn ? inDec : outDec);

    let floatInAmount = 0;
    let floatOutAmount = 0;

    if (isExactIn) {
      floatInAmount = floatAmount;
      floatOutAmount = (floatInAmount * priceIn) / priceOut;
    } else {
      floatOutAmount = floatAmount;
      floatInAmount = (floatOutAmount * priceOut) / priceIn;
    }

    // Expected raw values (before slippage)
    const rawInExpected = BigInt(Math.floor(floatInAmount * Math.pow(10, inDec)));
    const rawOutExpected = BigInt(Math.floor(floatOutAmount * Math.pow(10, outDec)));

    // Slippage boundaries
    const slippageMultiplier = 1 - params.slippageBps / 10000;
    const rawMinOut = BigInt(Math.floor(floatOutAmount * slippageMultiplier * Math.pow(10, outDec)));
    const rawMaxIn = BigInt(Math.floor((floatInAmount / slippageMultiplier) * Math.pow(10, inDec)));

    return {
      inputMint: params.inputMint,
      inAmount: (isExactIn ? rawAmount : rawInExpected).toString(),
      outputMint: params.outputMint,
      outAmount: (isExactIn ? rawOutExpected : rawAmount).toString(),
      otherAmountThreshold: (isExactIn ? rawMinOut : rawMaxIn).toString(),
      swapMode: params.swapMode,
      slippageBps: params.slippageBps,
      priceImpactPct: (0.01 + Math.random() * 0.15).toFixed(4),
      routePlan: [
        {
          swapInfo: {
            ammKey: "6111111111111111111111111111111111111111",
            label: "Orca V2",
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            inAmount: (isExactIn ? rawAmount : rawInExpected).toString(),
            outAmount: (isExactIn ? rawOutExpected : rawAmount).toString(),
            feeAmount: Math.floor(Number(isExactIn ? rawAmount : rawInExpected) * 0.003).toString(),
            feeMint: params.inputMint,
          },
          percent: 100,
        },
      ],
      timeTaken: 12.5,
    };
  }

  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: params.slippageBps.toString(),
    swapMode: params.swapMode,
  });

  const res = await fetch(`${JUP_API_BASE}/swap/v1/quote?${queryParams.toString()}`, {
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Quote API failed (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function buildTransaction(
  params: {
    quoteResponse: QuoteResponse;
    userPublicKey: string;
  },
  apiKey?: string
): Promise<SwapResponse> {
  if (!apiKey) {
    // Return dummy base64 transaction string (a valid empty-ish tx or dummy bytes)
    // "AAAAA..." is just random bytes formatted as base64 representing a mock tx payload
    return {
      swapTransaction: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQAGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5ADQxTW9jS1RyYW5zYWN0aW9uUGF5bG9hZERlbW9Nb2RlR2VuZXJhdGVkPT0=",
      lastValidBlockHeight: 320000000,
      prioritizationFeeLamports: 5000,
      computeUnitLimit: 150000,
    };
  }

  const res = await fetch(`${JUP_API_BASE}/swap/v1/swap`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Swap build API failed (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function fetchOrder(
  params: {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    slippageBps: number;
    userPublicKey?: string;
  },
  apiKey?: string
): Promise<OrderResponse> {
  if (!apiKey) {
    // Mock order response
    return {
      requestId: `req_${Math.random().toString(36).substring(2, 11)}`,
      swapTransaction: params.userPublicKey
        ? "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQAGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5ADQxTW9jS1RyYW5zYWN0aW9uUGF5bG9hZERlbW9Nb2RlR2VuZXJhdGVkPT0="
        : "",
      totalTime: 45.2,
      feeAmount: 30, // 30 bps
    };
  }

  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.inAmount,
    slippageBps: params.slippageBps.toString(),
  });
  if (params.userPublicKey) {
    queryParams.append("userPublicKey", params.userPublicKey);
  }

  const res = await fetch(`${JUP_API_BASE}/swap/v2/order?${queryParams.toString()}`, {
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Order API failed (${res.status}): ${errText || res.statusText}`);
  }

  return await res.json();
}

export async function executeSwap(
  params: {
    signedTransaction: string;
    requestId?: string;
  },
  apiKey?: string
): Promise<ExecuteResponse> {
  if (!apiKey) {
    // Mock execution success after a simulated delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      signature: `sig_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    };
  }

  const res = await fetch(`${JUP_API_BASE}/swap/v2/execute`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      signedTransaction: params.signedTransaction,
      requestId: params.requestId,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Execution API failed (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  return {
    signature: data.signature || data.txid,
  };
}
