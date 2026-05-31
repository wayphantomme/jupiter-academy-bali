export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export const TOKENS: TokenInfo[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
  },
  {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    logoURI: "https://dd.dexscreener.com/ds-data/tokens/solana/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN.png"
  },
  {
    address: "JuprjznTrTSp2UFa3ZBUFgwdAmtZCq4MQCwysN55USD",
    symbol: "jupUSD",
    name: "Jupiter USD",
    decimals: 6,
    logoURI: "https://dd.dexscreener.com/ds-data/tokens/solana/JuprjznTrTSp2UFa3ZBUFgwdAmtZCq4MQCwysN55USD.png"
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    logoURI: "https://dd.dexscreener.com/ds-data/tokens/solana/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263.png"
  }
];

export const JUP_API_BASE = "https://api.jup.ag";
