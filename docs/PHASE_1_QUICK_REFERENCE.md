# Phase 1: Quick Reference Guide

## 🚀 Quick Start

### 1. Database Setup

```bash
# Run migration
npm run db:migrate

# Test database connection
npx tsx scripts/test-auth-flow.ts
```

### 2. Frontend Usage

```tsx
import { useAuth } from "@/providers/auth-provider"

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <button onClick={login}>Connect Wallet</button>

  return (
    <div>
      <p>Wallet: {user.walletAddress}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### 3. API Route Protection

```typescript
import { requireAuth } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { user, sessionToken } = auth
  // Your authenticated logic here
}
```

---

## 📦 Service Layer Cheat Sheet

### User Service

```typescript
import {
  findOrCreateUser,
  getUserByWalletAddress,
  updateUser,
  updateUserSettings,
} from "@/lib/db/services/user.service"

// Find or create user (main auth method)
const user = await findOrCreateUser({
  walletAddress: "wallet_address",
  privyUserId: "privy_id",
  displayName: "John Doe",
})

// Get user by wallet
const user = await getUserByWalletAddress("wallet_address")

// Update profile
await updateUser(userId, {
  displayName: "New Name",
  avatarUrl: "https://...",
})

// Update settings
await updateUserSettings(userId, {
  theme: "dark",
  defaultModel: "gpt-5",
})
```

### Wallet Service

```typescript
import {
  findOrCreateWallet,
  getUserWallets,
  updateWalletBalance,
} from "@/lib/db/services/wallet.service"

// Create wallet
const wallet = await findOrCreateWallet({
  userId: user.id,
  address: "wallet_address",
  walletType: "phantom",
})

// Get all user wallets
const wallets = await getUserWallets(userId)

// Update balance
await updateWalletBalance("wallet_address", {
  SOL: "1000000000",
  USDC: "10000000",
})
```

### Session Service

```typescript
import {
  createSession,
  validateAndRefreshSession,
  deleteSession,
} from "@/lib/db/services/session.service"

// Create session (on login)
const session = await createSession({
  userId: user.id,
  walletAddress: "wallet_address",
  expiresInDays: 30,
})

// Validate session
const validSession = await validateAndRefreshSession(sessionToken)

// Delete session (on logout)
await deleteSession(sessionToken)
```

---

## 🔑 API Endpoints

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "walletAddress": "wallet_address",
  "walletType": "phantom",
  "privyUserId": "privy_id"
}
```

### Logout

```bash
POST /api/auth/logout
Content-Type: application/json

{
  "sessionToken": "token"
}
```

### Validate Session

```bash
POST /api/auth/session
Content-Type: application/json

{
  "sessionToken": "token"
}
```

### Get User

```bash
GET /api/auth/user
Authorization: Bearer {sessionToken}
```

### Update User

```bash
PATCH /api/auth/user
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "displayName": "New Name",
  "settings": { "theme": "dark" }
}
```

---

## 🗄️ Database Schema Quick View

```sql
-- User
User (
  id uuid PRIMARY KEY,
  walletAddress varchar UNIQUE,
  privyUserId varchar,
  displayName varchar,
  settings jsonb,
  createdAt timestamp,
  lastActiveAt timestamp
)

-- Wallet
Wallet (
  id uuid PRIMARY KEY,
  userId uuid REFERENCES User,
  address varchar UNIQUE,
  walletType varchar,
  balance jsonb,
  isActive boolean
)

-- Session
Session (
  id uuid PRIMARY KEY,
  userId uuid REFERENCES User,
  walletAddress varchar,
  sessionToken varchar UNIQUE,
  expiresAt timestamp,
  lastActiveAt timestamp
)
```

---

## ⚡ Common Patterns

### Authenticated Component

```tsx
import { useAuth } from "@/providers/auth-provider"

function ProtectedComponent() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please connect wallet</div>

  return <div>Protected content for {user.displayName}</div>
}
```

### Authenticated API Call

```typescript
// Client-side
const { sessionToken } = useAuth()

const response = await fetch("/api/protected-endpoint", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${sessionToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ data: "..." }),
})

// Server-side
import { requireAuth } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  // Process request
}
```

### User Settings Management

```typescript
import { useAuth } from "@/providers/auth-provider"

function SettingsComponent() {
  const { user, sessionToken, refreshUser } = useAuth()

  const updateSettings = async (newSettings: any) => {
    await fetch("/api/auth/user", {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${sessionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ settings: newSettings })
    })

    // Refresh user data
    await refreshUser()
  }

  return <button onClick={() => updateSettings({ theme: "dark" })}>
    Set Dark Theme
  </button>
}
```

---

## 🐛 Debugging Tips

### Check Database Connection

```bash
npx tsx scripts/test-auth-flow.ts
```

### Verify Session in Browser

```javascript
// In browser console
localStorage.getItem("session_token")
```

### Test API Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test_wallet"}'
```

### Check User in Database

```sql
SELECT * FROM "User" WHERE "walletAddress" = 'wallet_address';
SELECT * FROM "Session" WHERE "userId" = 'user_id';
SELECT * FROM "Wallet" WHERE "userId" = 'user_id';
```

---

## 📝 Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Optional
SESSION_EXPIRATION_DAYS=30
```

---

## ✅ Health Check

Run these commands to verify Phase 1 is working:

```bash
# 1. Check database connection
npm run db:migrate

# 2. Run tests
npx tsx scripts/test-auth-flow.ts

# 3. Start dev server
npm run dev

# 4. Connect wallet in browser
# Navigate to http://localhost:3000
# Click "Connect Wallet"
# Verify user appears in database
```

Expected output: All tests passing ✅

---

## 🔗 Related Files

- **Schema:** `lib/db/schema.ts`
- **Services:** `lib/db/services/*.service.ts`
- **API Routes:** `app/api/auth/**/route.ts`
- **Auth Provider:** `providers/auth-provider.tsx`
- **Middleware:** `lib/auth/middleware.ts`
- **Hook:** `hooks/use-wallet.ts`
- **Tests:** `scripts/test-auth-flow.ts`
- **Docs:** `docs/PHASE_1_IMPLEMENTATION.md`
