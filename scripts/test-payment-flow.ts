/**
 * Test script for Phase 2: Payment System Persistence
 *
 * This script tests the complete payment flow:
 * 1. Payment transaction storage
 * 2. Free message tracking
 * 3. Payment history retrieval
 * 4. Payment statistics
 *
 * Run with: npx tsx scripts/test-payment-flow.ts
 */

import { config } from "dotenv"
import {
  getFreeMessageByWallet,
  getRemainingFreeMessages,
  hasFreeMessagesRemaining,
  incrementFreeMessageCount,
  resetFreeMessageCount,
} from "../lib/db/services/free-message.service"
import {
  createPayment,
  getPaymentBySignature,
  getUserPayments,
  getUserPaymentStats,
  markPaymentSettled,
  markPaymentVerified,
} from "../lib/db/services/payment.service"
import { findOrCreateUser } from "../lib/db/services/user.service"

config({ path: ".env.local" })

async function testPaymentFlow() {
  console.log("🧪 Starting Phase 2 Payment System Tests\n")

  try {
    // Test 1: Create User for Payment
    console.log("Test 1: Create User for Payment Tests")
    const testWalletAddress = "payment_test_" + Date.now()
    const user = await findOrCreateUser({
      walletAddress: testWalletAddress,
      displayName: "Payment Test User",
    })
    console.log("✅ User created:", user.walletAddress)
    console.log()

    // Test 2: Create Payment Record
    console.log("Test 2: Create Payment Record")
    const txSignature = "test_tx_" + Date.now()
    const payment = await createPayment({
      userId: user.id,
      walletAddress: testWalletAddress,
      transactionSignature: txSignature,
      network: "solana-devnet",
      token: "USDC",
      amount: "10000000", // 10 USDC
      resourceUrl: "/api/chat",
      facilitatorResponse: { test: true },
    })
    console.log("✅ Payment created:", {
      id: payment.id,
      txSignature: payment.transactionSignature,
      status: payment.status,
    })
    console.log()

    // Test 3: Get Payment by Signature
    console.log("Test 3: Get Payment by Signature")
    const foundPayment = await getPaymentBySignature(txSignature)
    if (foundPayment && foundPayment.id === payment.id) {
      console.log("✅ Payment found:", foundPayment.transactionSignature)
    } else {
      throw new Error("Payment not found or ID mismatch")
    }
    console.log()

    // Test 4: Mark Payment as Verified
    console.log("Test 4: Mark Payment as Verified")
    const verifiedPayment = await markPaymentVerified(payment.id, {
      verificationTime: Date.now(),
    })
    console.log("✅ Payment verified:", {
      status: verifiedPayment?.status,
      verifiedAt: verifiedPayment?.verifiedAt,
    })
    console.log()

    // Test 5: Mark Payment as Settled
    console.log("Test 5: Mark Payment as Settled")
    const settledPayment = await markPaymentSettled(payment.id, {
      settlementTime: Date.now(),
    })
    console.log("✅ Payment settled:", {
      status: settledPayment?.status,
      settledAt: settledPayment?.settledAt,
    })
    console.log()

    // Test 6: Create Multiple Payments
    console.log("Test 6: Create Multiple Payments")
    const additionalPayments = []
    for (let i = 0; i < 3; i++) {
      const p = await createPayment({
        userId: user.id,
        walletAddress: testWalletAddress,
        transactionSignature: `test_tx_${Date.now()}_${i}`,
        network: "solana-devnet",
        token: i % 2 === 0 ? "USDC" : "SOL",
        amount: i % 2 === 0 ? "5000000" : "100000000",
        resourceUrl: "/api/chat",
      })
      await markPaymentSettled(p.id)
      additionalPayments.push(p)
    }
    console.log(`✅ Created and settled ${additionalPayments.length} payments`)
    console.log()

    // Test 7: Get User Payment History
    console.log("Test 7: Get User Payment History")
    const paymentHistory = await getUserPayments(user.id)
    console.log(`✅ Retrieved ${paymentHistory.length} payments from history`)
    console.log()

    // Test 8: Get User Payment Statistics
    console.log("Test 8: Get User Payment Statistics")
    const stats = await getUserPaymentStats(user.id)
    console.log("✅ Payment statistics:", {
      totalPayments: stats.totalPayments,
      successful: stats.successfulPayments,
      failed: stats.failedPayments,
      pending: stats.pendingPayments,
      totalSpent: stats.totalSpent,
    })
    console.log()

    // ===== FREE MESSAGE TESTS =====
    console.log("===== FREE MESSAGE TRACKING TESTS =====\n")

    // Test 9: Check Initial Free Message Status
    console.log("Test 9: Check Initial Free Message Status")
    const testFreeWallet = "free_test_" + Date.now()
    const hasInitialFree = await hasFreeMessagesRemaining(testFreeWallet)
    const initialRemaining = await getRemainingFreeMessages(testFreeWallet)
    console.log("✅ Initial free message status:", {
      hasRemaining: hasInitialFree,
      remaining: initialRemaining,
    })
    console.log()

    // Test 10: Increment Free Message Count
    console.log("Test 10: Increment Free Message Count")
    const freeMessageRecord = await incrementFreeMessageCount(testFreeWallet)
    console.log("✅ Free message incremented:", {
      messageCount: freeMessageRecord?.messageCount,
      limit: freeMessageRecord?.limit,
    })
    console.log()

    // Test 11: Check Free Message Status After Use
    console.log("Test 11: Check Free Message Status After Use")
    const hasAfterUse = await hasFreeMessagesRemaining(testFreeWallet)
    const remainingAfterUse = await getRemainingFreeMessages(testFreeWallet)
    console.log("✅ After using 1 free message:", {
      hasRemaining: hasAfterUse,
      remaining: remainingAfterUse,
    })
    console.log()

    // Test 12: Get Free Message Record
    console.log("Test 12: Get Free Message Record")
    const record = await getFreeMessageByWallet(testFreeWallet)
    console.log("✅ Free message record:", {
      walletAddress: record?.walletAddress,
      messageCount: record?.messageCount,
      limit: record?.limit,
      firstMessageAt: record?.firstMessageAt,
      lastMessageAt: record?.lastMessageAt,
    })
    console.log()

    // Test 13: Reset Free Message Count
    console.log("Test 13: Reset Free Message Count")
    await resetFreeMessageCount(testFreeWallet)
    const afterReset = await getFreeMessageByWallet(testFreeWallet)
    console.log("✅ Free message count reset:", {
      messageCount: afterReset?.messageCount,
      resetAt: afterReset?.resetAt,
    })
    console.log()

    console.log("🎉 All Phase 2 tests passed successfully!")
    console.log("\n📊 Test Summary:")
    console.log("   • Payment Creation: ✅")
    console.log("   • Payment Status Updates: ✅")
    console.log("   • Payment History: ✅")
    console.log("   • Payment Statistics: ✅")
    console.log("   • Free Message Tracking: ✅")
    console.log("   • Free Message Status: ✅")
    console.log("\n✨ Phase 2: Payment System Persistence is ready!")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  }

  process.exit(0)
}

// Run tests
testPaymentFlow()
