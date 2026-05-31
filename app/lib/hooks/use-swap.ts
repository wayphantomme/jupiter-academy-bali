"use client";

import { useState, useCallback } from "react";
import { useWallet } from "../wallet/context";
import { useCluster } from "../../components/cluster-context";
import { executeSwap as executeSwapV2 } from "../jupiter/api";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(source: Uint8Array): string {
  if (source.length === 0) return "";
  const digits = [0];
  for (let i = 0; i < source.length; i++) {
    let carry = source[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let string = "";
  for (let k = 0; source[k] === 0 && k < source.length - 1; k++) {
    string += ALPHABET[0];
  }
  for (let q = digits.length - 1; q >= 0; q--) {
    string += ALPHABET[digits[q]];
  }
  return string;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useSwap(addLog: (type: "INFO" | "SUCCESS" | "ERROR" | "WALLET" | "BROADCASTED", message: string) => void) {
  const { wallet } = useWallet();
  const { cluster } = useCluster();
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (
      txBase64: string,
      flow: "aggregator" | "router",
      requestId?: string,
      apiKey?: string
    ): Promise<string> => {
      setIsSwapping(true);
      setError(null);
      addLog("INFO", `Initializing swap execution [Flow: ${flow === "aggregator" ? "Meta-Aggregator" : "Router"}]`);

      // Mock flow if no API key is set
      if (!apiKey) {
        try {
          addLog("INFO", "Running in Demo Mode (Mock Swap)...");
          addLog("WALLET", "Awaiting signature from wallet...");
          await new Promise((resolve) => setTimeout(resolve, 1200));
          addLog("WALLET", "Transaction successfully signed by wallet.");
          addLog("INFO", "Broadcasting transaction to Solana network...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const mockSig = `sig_demo_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
          addLog("SUCCESS", "Swap completed successfully!");
          addLog("BROADCASTED", `Signature: ${mockSig}`);
          return mockSig;
        } finally {
          setIsSwapping(false);
        }
      }

      if (!wallet) {
        const err = new Error("Wallet not connected");
        setError(err);
        addLog("ERROR", "Execution failed: Wallet not connected");
        setIsSwapping(false);
        throw err;
      }

      const chain = `solana:${cluster}`;
      const txBytes = base64ToUint8Array(txBase64);

      try {
        if (flow === "aggregator") {
          // Meta-Aggregator: signTransaction then POST execute
          if (!wallet.signTransaction) {
            throw new Error("Connected wallet does not support signTransaction. Use Router flow instead.");
          }
          addLog("WALLET", "Awaiting transaction signature from wallet...");
          const signedBytes = await wallet.signTransaction(txBytes, chain);
          addLog("WALLET", "Transaction signed by wallet. Executing via Jupiter...");

          const signedBase64 = uint8ArrayToBase64(signedBytes);
          const executeResult = await executeSwapV2(
            {
              signedTransaction: signedBase64,
              requestId,
            },
            apiKey
          );

          const sig = executeResult.signature;
          if (!sig) {
            throw new Error("Jupiter execution succeeded but returned no transaction signature");
          }

          addLog("SUCCESS", "Jupiter executed swap successfully!");
          addLog("BROADCASTED", `Signature: ${sig}`);
          return sig;
        } else {
          // Router: signAndSendTransaction in one step
          if (!wallet.sendTransaction) {
            throw new Error("Connected wallet does not support sendTransaction");
          }
          addLog("WALLET", "Awaiting wallet approval to sign and send transaction...");
          const sigBytes = await wallet.sendTransaction(txBytes, chain);
          const sig = encodeBase58(sigBytes);

          addLog("SUCCESS", "Transaction signed and broadcasted successfully!");
          addLog("BROADCASTED", `Signature: ${sig}`);
          return sig;
        }
      } catch (err) {
        const errorObject = err instanceof Error ? err : new Error(String(err));
        setError(errorObject);
        addLog("ERROR", `Swap execution failed: ${errorObject.message}`);
        throw errorObject;
      } finally {
        setIsSwapping(false);
      }
    },
    [wallet, cluster, addLog]
  );

  return { execute, isSwapping, error };
}
