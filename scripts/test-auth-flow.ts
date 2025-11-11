/**
 * Test script for Phase 1: User Authentication & Database Integration
 *
 * This script tests the complete authentication flow:
 * 1. User creation with wallet address
 * 2. Wallet management
 * 3. Session creation and validation
 * 4. User profile updates
 *
 * Run with: npx tsx scripts/test-auth-flow.ts
 */

import { config } from "dotenv"
import {
  createSession,
  deleteSession,
  getValidSession,
  validateAndRefreshSession,
} from "../lib/db/services/session.service"
import {
  findOrCreateUser,
  getUserByWalletAddress,
  updateUser,
  updateUserSettings,
} from "../lib/db/services/user.service"
import {
  createOrUpdateWallet,
  getUserWallets,
  updateWalletBalance,
} from "../lib/db/services/wallet.service"

config({ path: ".env.local" })

async function testAuthFlow() {
  console.log("🧪 Starting Phase 1 Authentication Flow Tests\n")

  try {
    // Test 1: Create User
    console.log("Test 1: Create User with Wallet Address")
    const testWalletAddress = "test_wallet_" + Date.now()
    const user = await findOrCreateUser({
      walletAddress: testWalletAddress,
      privyUserId: "test_privy_user_123",
      displayName: "Test User",
      email: "test@example.com",
    })
    console.log("✅ User created:", {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
    })
    console.log()

    // Test 2: Find Existing User
    console.log("Test 2: Find Existing User by Wallet Address")
    const foundUser = await getUserByWalletAddress(testWalletAddress)
    if (foundUser && foundUser.id === user.id) {
      console.log("✅ User found successfully:", foundUser.walletAddress)
    } else {
      throw new Error("User not found or ID mismatch")
    }
    console.log()

    // Test 3: Create Wallet
    console.log("Test 3: Create Wallet Entry")
    const wallet = await createOrUpdateWallet({
      userId: user.id,
      address: testWalletAddress,
      walletType: "phantom",
      isActive: true,
      balance: {
        SOL: "1000000000", // 1 SOL
        USDC: "10000000", // 10 USDC
      },
    })
    console.log("✅ Wallet created:", {
      id: wallet.id,
      address: wallet.address,
      walletType: wallet.walletType,
    })
    console.log()

    // Test 4: Get User Wallets
    console.log("Test 4: Get User Wallets")
    const userWallets = await getUserWallets(user.id)
    console.log(`✅ Found ${userWallets.length} wallet(s) for user`)
    console.log()

    // Test 5: Update Wallet Balance
    console.log("Test 5: Update Wallet Balance")
    const updatedWallet = await updateWalletBalance(testWalletAddress, {
      SOL: "2000000000", // 2 SOL
      USDC: "20000000", // 20 USDC
      lastUpdated: new Date().toISOString(),
    })
    console.log("✅ Wallet balance updated:", updatedWallet?.balance)
    console.log()

    // Test 6: Create Session
    console.log("Test 6: Create Authentication Session")
    const session = await createSession({
      userId: user.id,
      walletAddress: testWalletAddress,
      expiresInDays: 30,
      userAgent: "Test Script",
      ipAddress: "127.0.0.1",
    })
    console.log("✅ Session created:", {
      sessionToken: session.sessionToken.substring(0, 20) + "...",
      expiresAt: session.expiresAt,
    })
    console.log()

    // Test 7: Validate Session
    console.log("Test 7: Validate Session")
    const validSession = await getValidSession(session.sessionToken)
    if (validSession && validSession.id === session.id) {
      console.log("✅ Session is valid")
    } else {
      throw new Error("Session validation failed")
    }
    console.log()

    // Test 8: Refresh Session Activity
    console.log("Test 8: Refresh Session Activity")
    const refreshedSession = await validateAndRefreshSession(
      session.sessionToken
    )
    if (refreshedSession) {
      console.log("✅ Session refreshed successfully")
      console.log("   Last active:", refreshedSession.lastActiveAt)
    } else {
      throw new Error("Session refresh failed")
    }
    console.log()

    // Test 9: Update User Profile
    console.log("Test 9: Update User Profile")
    const updatedUser = await updateUser(user.id, {
      displayName: "Updated Test User",
      avatarUrl: "https://example.com/avatar.png",
    })
    console.log("✅ User profile updated:", {
      displayName: updatedUser?.displayName,
      avatarUrl: updatedUser?.avatarUrl,
    })
    console.log()

    // Test 10: Update User Settings
    console.log("Test 10: Update User Settings")
    const userWithSettings = await updateUserSettings(user.id, {
      theme: "dark",
      defaultModel: "gpt-5",
      reasoningEffort: "medium",
      autoFixErrors: true,
    })
    console.log("✅ User settings updated:", userWithSettings?.settings)
    console.log()

    // Test 11: Logout (Delete Session)
    console.log("Test 11: Logout (Delete Session)")
    await deleteSession(session.sessionToken)
    const deletedSession = await getValidSession(session.sessionToken)
    if (!deletedSession) {
      console.log("✅ Session deleted successfully")
    } else {
      throw new Error("Session deletion failed")
    }
    console.log()

    // Test 12: Verify Session is Invalid After Deletion
    console.log("Test 12: Verify Session is Invalid After Deletion")
    const invalidSession = await validateAndRefreshSession(session.sessionToken)
    if (!invalidSession) {
      console.log("✅ Session is correctly invalidated after deletion")
    } else {
      throw new Error("Session should be invalid but is still valid")
    }
    console.log()

    console.log("🎉 All tests passed successfully!")
    console.log("\n📊 Test Summary:")
    console.log("   • User Management: ✅")
    console.log("   • Wallet Management: ✅")
    console.log("   • Session Management: ✅")
    console.log("   • Profile Updates: ✅")
    console.log("\n✨ Phase 1: Foundation is ready for production!")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  }

  process.exit(0)
}

// Run tests
testAuthFlow()
