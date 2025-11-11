# Quick Start - Solana Payment Integration

## For Users: How to Add Payment to Your App

### Simple Request

```
"Build a todo app where users pay 0.01 SOL to use it"
```

That's it! The AI will:

1. ✅ Generate your todo app
2. ✅ Add x402-next payment middleware
3. ✅ Add Solana wallet adapter
4. ✅ Configure everything automatically
5. ✅ Start the dev server

### What You Need

**Your Solana Wallet Address** (where payments go)

- Get from Phantom wallet: Click address to copy
- Format: `7xKXt...9YrK3` (base58)

### Testing Your Payment

1. **Open the preview URL** in browser
2. **You'll see payment prompt** from x402-next
3. **Connect your wallet** (Phantom/Solflare)
4. **Make sure you're on devnet**
5. **Sign the payment transaction**
6. **Access granted!** App loads

### Get Test SOL

Visit: https://faucet.solana.com/

- Enter your wallet address
- Select "Devnet"
- Click "Get Test SOL"

---

## For Developers: How It Works

### Architecture

```
User → x402-next middleware → Payment required →
Wallet adapter → User pays → x402-next verifies → Access granted
```

### Files Generated

```
middleware.ts                  # x402-next payment middleware
providers/solana-provider.tsx  # Wallet context
components/wallet-button.tsx   # Connect wallet button
app/layout.tsx                 # Updated with SolanaProvider
.env.local                     # Config
package.json                   # Dependencies
```

### Dependencies Added

- `x402-next@^0.7.1` - Payment middleware
- `@solana/wallet-adapter-*` - Wallet connection
- `@solana/web3.js` - Solana SDK

### Key Features

✅ x402-next handles ALL payment logic
✅ Wallet adapter ONLY for wallet connection
✅ No custom payment code needed
✅ Blockchain verification automatic
✅ Works with all Solana wallets

---

## Example Requests

### Basic Paywall

```
"Create a calculator with 0.01 SOL payment"
```

### USDC Payment

```
"Build a notes app with $0.05 USDC payment"
```

### Protect Specific Routes

```
"Make a blog where /premium costs 0.001 SOL"
```

### Custom Network

```
"Build a game with 0.1 SOL payment on mainnet-beta"
```

---

## Price Formats

| You Say     | AI Understands |
| ----------- | -------------- |
| "0.01 SOL"  | 0.01 SOL       |
| "$0.05"     | 0.05 USDC      |
| "0.05 USDC" | 0.05 USDC      |
| "100 BONK"  | 100 BONK       |

---

## Networks

| Network      | Purpose           | Get Funds         |
| ------------ | ----------------- | ----------------- |
| devnet       | Testing (default) | faucet.solana.com |
| testnet      | Testing           | faucet.solana.com |
| mainnet-beta | Production        | Buy SOL           |

---

## Troubleshooting

**"Wallet won't connect"**
→ Install Phantom or Solflare extension

**"Payment failed"**
→ Check you're on correct network (devnet/mainnet)
→ Make sure you have enough SOL

**"Transaction rejected"**
→ User clicked reject, try again
→ Insufficient balance

---

## Production Checklist

- [ ] Switch to mainnet-beta
- [ ] Update treasury address
- [ ] Test with real SOL
- [ ] Set appropriate pricing
- [ ] Test multiple wallets

---

## Support

**Get test SOL:** https://faucet.solana.com/
**x402 docs:** https://x402.org
**Wallet adapter:** https://github.com/solana-labs/wallet-adapter

---

## That's It!

Request: `"Build [app] with [price] payment"`
Result: ✅ Payment-enabled app ready to use!
