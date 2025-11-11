# Payment Feature - User Guide

## Quick Start

### How to Add Payment to Your App

Simply tell the AI what you want:

```
"Build a todo app where users pay $0.01 to use it"
```

```
"Create a calculator that costs 0.001 SOL on Solana"
```

```
"Make a notes app with payment, users should be able to buy crypto"
```

---

## Choosing a Blockchain

### Base (Ethereum L2) - **Recommended**

**Best for:**

- Simplest setup
- Users without crypto (Coinbase Onramp)
- Professional payment UI out-of-the-box
- Lower gas fees than Ethereum mainnet

**Supported tokens:**

- USDC (stablecoin)
- ETH

**Networks:**

- `base-sepolia` (testnet - for testing)
- `base` (mainnet - for production)

### Solana

**Best for:**

- Solana-native applications
- Lower transaction costs
- Faster confirmations

**Supported tokens:**

- SOL
- SPL tokens (USDC, BONK, etc.)

**Networks:**

- `devnet` (testnet - for testing)
- `mainnet-beta` (mainnet - for production)

---

## Pricing Examples

### USD-based (Base)

```
"$0.01"     → 1 cent
"$0.10"     → 10 cents
"$1.00"     → 1 dollar
"$5"        → 5 dollars
```

### SOL-based (Solana)

```
"0.001 SOL"   → ~$0.20
"0.01 SOL"    → ~$2.00
"0.1 SOL"     → ~$20.00
```

---

## Example Requests

### Simple Paywall

```
User: "Build a quiz app where users pay $0.05 to take the quiz"
```

### Solana App

```
User: "Create an image gallery that costs 0.002 SOL on Solana devnet"
```

### With Crypto Purchasing

```
User: "Build a premium calculator for $0.10, users should be able to buy USDC if they don't have it"
```

### Specific Route Protection

```
User: "Build a blog where reading premium posts costs $0.02"
```

---

## Setting Up Your Treasury

### What is a Treasury Address?

Your treasury address is where payments are sent. Think of it as your bank account for crypto payments.

### For Base (Ethereum):

1. **Get MetaMask:**
   - Install MetaMask extension
   - Create wallet or import existing

2. **Copy Your Address:**
   - Click MetaMask extension
   - Click your account name to copy
   - Format: `0x1234...abcd`

3. **Switch to Base Sepolia (for testing):**
   - MetaMask → Networks → Add Network
   - Search "Base Sepolia"
   - Add network

4. **Get Test Funds:**
   - Visit [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
   - Enter your address
   - Receive test ETH

### For Solana:

1. **Get Phantom Wallet:**
   - Install Phantom extension
   - Create new wallet or import

2. **Copy Your Address:**
   - Click Phantom extension
   - Click address to copy
   - Format: `7xKXt...9YrK3`

3. **Switch to Devnet (for testing):**
   - Phantom → Settings → Developer Settings
   - Enable "Testnet Mode"
   - Switch to Devnet

4. **Get Test Funds:**
   - Visit [Solana Faucet](https://faucet.solana.com/)
   - Enter your address
   - Select Devnet
   - Receive test SOL

---

## Enabling Coinbase Onramp (Base Only)

### What is Onramp?

Allows users to buy USDC with credit card directly from your payment prompt. They don't need existing crypto!

### How to Enable:

1. **Request it:**

   ```
   "Build an app with payment, users should be able to buy crypto"
   ```

2. **Get CDP API Keys:**
   - Visit [CDP Portal](https://portal.cdp.coinbase.com/)
   - Create account / sign in
   - Go to API Keys section
   - Create new API key
   - Download credentials

3. **Enable Secure Initialization:**
   - CDP Portal → Onramp & Offramp
   - Toggle "Enforce secure initialization" → Enabled

4. **Add to .env.local:**
   ```bash
   CDP_API_KEY_ID=your_key_id_here
   CDP_API_KEY_SECRET=your_secret_here
   ```

---

## Testing Your Payment

### Base (Sepolia Testnet):

1. **Open Your App:**
   - Click the preview URL

2. **Connect Wallet:**
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection

3. **Make Payment:**
   - Ensure you're on Base Sepolia network
   - Click "Pay with USDC" or "Pay with ETH"
   - Approve transaction in MetaMask
   - Wait for confirmation (~2 seconds)

4. **Access Granted:**
   - App loads automatically
   - Payment proof stored in browser
   - Access persists across sessions

### Solana (Devnet):

1. **Open Your App:**
   - Click the preview URL

2. **Connect Wallet:**
   - Click "Connect Wallet" button
   - Select Phantom (or other wallet)
   - Approve connection

3. **Make Payment:**
   - Ensure you're on Devnet
   - Click "Pay with Solana"
   - Approve transaction in Phantom
   - Wait for confirmation (~1 second)

4. **Access Granted:**
   - App loads automatically
   - Payment proof stored
   - Access persists

---

## Going to Production

### Checklist:

#### For Base:

- [ ] Switch network to `"base"` (mainnet)
- [ ] Update treasury address (use your real wallet)
- [ ] Test with small amount first
- [ ] Get real USDC for testing
- [ ] If using Onramp: Update CDP keys to production

#### For Solana:

- [ ] Switch network to `"mainnet-beta"`
- [ ] Update treasury address (use your real wallet)
- [ ] Test with small amount first
- [ ] Get real SOL for testing

### Pricing Recommendations:

**Micro-apps (calculators, tools):**

- $0.01 - $0.10 / 0.001 - 0.01 SOL

**Content (articles, tutorials):**

- $0.10 - $0.50 / 0.01 - 0.05 SOL

**Premium features:**

- $0.50 - $2.00 / 0.05 - 0.2 SOL

**Full apps:**

- $2.00+ / 0.2+ SOL

---

## Troubleshooting

### "Payment failed"

- ✅ Check you're on correct network
- ✅ Ensure sufficient balance
- ✅ Verify gas/transaction fees covered
- ✅ Try refreshing page

### "Wallet not connecting"

- ✅ Install wallet extension (MetaMask/Phantom)
- ✅ Unlock wallet
- ✅ Approve connection popup
- ✅ Switch to correct network

### "Transaction rejected"

- ✅ User clicked "Reject" - try again
- ✅ Insufficient funds
- ✅ Gas price too high - wait and retry

### "Onramp button not showing"

- ✅ Onramp only available on Base
- ✅ Check CDP API keys are set
- ✅ Verify session token endpoint exists

---

## FAQ

### Q: Where do payments go?

**A:** To your treasury address (your wallet). You receive payments directly.

### Q: Does the platform take a fee?

**A:** No! You receive 100% of payments. This is direct wallet-to-wallet.

### Q: How do users get crypto if they don't have it?

**A:** Enable Coinbase Onramp (Base only). Users can buy USDC with credit card.

### Q: Can I change the price later?

**A:** Yes! Just tell the AI to update the middleware configuration with a new price.

### Q: Can I have different prices for different features?

**A:** Yes! Specify protected paths and prices for each.

### Q: Is this secure?

**A:** Yes! Base uses server-side verification. Solana verifies on blockchain. Payments are non-reversible.

### Q: What about refunds?

**A:** Blockchain transactions are irreversible. Implement refunds manually if needed (send from your treasury).

### Q: Can users bypass the paywall?

**A:** No. Base uses server-side verification. Solana requires valid blockchain transactions.

---

## Support

### Need Help?

**Testing issues:**

- Use testnet/devnet first
- Ensure wallet has test funds
- Check browser console for errors

**Production issues:**

- Verify mainnet network selected
- Confirm treasury address correct
- Test with small amounts first

**General questions:**

- Check [x402 Protocol Docs](https://x402.org)
- Visit [CDP Documentation](https://docs.cdp.coinbase.com)
- Join [CDP Discord](https://discord.com/invite/cdp)

---

## Advanced Usage

### Custom Protected Paths

```
"Build a blog where /premium posts cost $0.05 but homepage is free"
```

### Per-Action Payments

```
"Build a calculator where each calculation costs 0.0001 SOL"
```

### Time-Based Access

```
"Build an app where users pay $0.10 for 24-hour access"
```

---

**Happy Building! 🚀**
