Here is the final **Product Requirement Document (PRD)** rewritten in English, optimized as a technical blueprint to be pasted directly into **Antigravity**.

---

# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project Name: Jupiter API Power-Playground

**Target Execution:** Instant Developer Demo (Frictionless MVP)

**Design System:** Sody.app Style (Stark Black & White, #000000 Background, #FFFFFF Text, `rounded-none`, `font-mono` for data).

---

## 1. Scope & Objective

Build a single-page dApp dashboard that serves as a raw developer playground to demonstrate frontend consumption and manipulation of the **Jupiter V6 Swap API**. This application strips away all consumer-facing retail logic and focuses purely on live data visualization (JSON) and an asynchronous execution log terminal to showcase technical proficiency directly to the Jupiter team.

---

## 2. Technical Workflow & API Architecture

The dApp implements the 3 core pillars of the Jupiter API workflow:

```
[User Input: Token/Amount] ---> 1. GET /quote ---> Display Raw JSON
                                      |
[Click: Execute Atomic Swap] -> 2. POST /swap --> Sign via Wallet Adapter --> 3. Broadcast RPC

```

### 2.1. Feature 1: Live Token Price Ticker

* **API Endpoint:** Jupiter Price API (`[https://api.jup.ag/price/v2](https://api.jup.ag/price/v2)`)
* **Tokens:** SOL, JUP, JupUSD, USDC.
* **UI Requirement:** A minimalist, continuous stream of text at the top of the viewport using a monospaced font that updates token prices at a fixed interval.

### 2.2. Feature 2: Raw Route & Quote Inspector (`/quote`)

* **API Endpoint:** `[https://quote-api.jup.ag/v6/quote](https://quote-api.jup.ag/v6/quote)`
* **Inputs:**
* Input Token (Scoped dropdown: SOL, USDC, JUP, JupUSD, BONK).
* Output Token (Scoped dropdown).
* Amount (Numeric text input).
* Toggle Swap Mode: `ExactIn` vs `ExactOut`.


* **UI Requirement:**
* **Left Side:** Minimalist input panel wrapped in a subtle dark gray border (`#222222`).
* **Right Side:** A large, code-blocked container (`<pre><code>`) with a `#111111` background rendering the **Raw JSON Response** from the Jupiter `/quote` endpoint in real-time as inputs mutate.



### 2.3. Feature 3: Terminal Log Execution Engine (`/swap`)

* **API Endpoint:** `[https://quote-api.jup.ag/v6/swap](https://quote-api.jup.ag/v6/swap)`
* **Execution Flow:**
1. Extract the latest response object from the active `/quote` state.
2. Post a payload to the `/swap` endpoint containing the `quoteResponse` and the `userPublicKey`.
3. Receive the compiled `swapTransaction` (serialized transaction string).
4. Trigger the `signTransaction` prompt via the Solana Wallet Adapter framework.
5. Broadcast the signed transaction string to the Solana network via `connection.sendRawTransaction`.


* **UI Requirement:**
* A prominent, stark button reading `[EXECUTE ATOMIC SWAP]`.
* Directly beneath the button, an interactive black terminal log component that prints sequential runtime status strings asynchronously (`[INFO] Fetching quote...`, `[SUCCESS] Transaction signed`, `[BROADCASTED] Tx ID: ...`).



---

## 3. UI/UX Design Tokens (For Antigravity System Constraining)

* **Background:** `#000000` (Pure Black)
* **Text & Accents:** `#FFFFFF` (Pure White)
* **Borders:** `1px solid #222222` (Zero box-shadows, zero gradients).
* **Corners:** `rounded-none` (Absolute sharp angles).
* **Typography:** Bold sans-serif for overarching layout titles; `font-mono` for all interactive form inputs, dropdown selectors, the raw JSON view, and terminal logs.

---

## 4. Production-Ready Prompt for Antigravity

> *"Act as an Elite Solana Core Engineer. Build a single-page technical developer playground using Next.js, Tailwind CSS, and `@solana/wallet-adapter-react` based on the provided PRD. The app must implement the Jupiter V6 Swap API workflow: fetching from `/quote` based on user token/amount inputs, rendering the raw JSON response directly on screen inside a `<pre>` block, and executing the full `/swap` serialized transaction lifecycle when the user clicks 'Execute Atomic Swap'. Stream the execution states textually like a terminal console log. Adhere strictly to the Sody.app minimalist aesthetic: stark black background (#000000), white text, sharp edges (rounded-none), 1px solid borders, and monospaced typography for all data components. No consumer retail fluff, keep it strictly developer-centric."*

---

This English version is ready to be loaded into Antigravity. It frames you perfectly as a backend-fluent engineer who values architecture over surface-level cosmetics. Best of luck with the Jupiter APAC and Academy presentation!