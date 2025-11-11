import { and, desc, eq, gte, lte } from "drizzle-orm"
import { db } from "../drizzle"
import { payment, type Payment } from "../schema"

/**
 * Payment Service - Manage x402 payment transactions
 */

export type CreatePaymentInput = {
  userId: string
  walletAddress: string
  transactionSignature: string
  network: string
  token: string
  amount: string
  resourceUrl?: string
  facilitatorResponse?: any
}

export type UpdatePaymentStatusInput = {
  status: "pending" | "verified" | "settled" | "failed"
  facilitatorResponse?: any
  errorMessage?: string
  verifiedAt?: Date
  settledAt?: Date
}

/**
 * Create a new payment record
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const result = await db
    .insert(payment)
    .values({
      userId: input.userId,
      walletAddress: input.walletAddress,
      transactionSignature: input.transactionSignature,
      network: input.network,
      token: input.token,
      amount: input.amount,
      resourceUrl: input.resourceUrl,
      facilitatorResponse: input.facilitatorResponse,
      status: "pending",
    })
    .returning()

  return result[0]
}

/**
 * Get payment by transaction signature
 */
export async function getPaymentBySignature(
  transactionSignature: string
): Promise<Payment | undefined> {
  const result = await db
    .select()
    .from(payment)
    .where(eq(payment.transactionSignature, transactionSignature))
    .limit(1)

  return result[0]
}

/**
 * Get payment by ID
 */
export async function getPaymentById(
  paymentId: string
): Promise<Payment | undefined> {
  const result = await db
    .select()
    .from(payment)
    .where(eq(payment.id, paymentId))
    .limit(1)

  return result[0]
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  statusInput: UpdatePaymentStatusInput
): Promise<Payment | undefined> {
  const result = await db
    .update(payment)
    .set({
      status: statusInput.status,
      facilitatorResponse: statusInput.facilitatorResponse,
      errorMessage: statusInput.errorMessage,
      verifiedAt: statusInput.verifiedAt,
      settledAt: statusInput.settledAt,
    })
    .where(eq(payment.id, paymentId))
    .returning()

  return result[0]
}

/**
 * Mark payment as verified
 */
export async function markPaymentVerified(
  paymentId: string,
  facilitatorResponse?: any
): Promise<Payment | undefined> {
  return updatePaymentStatus(paymentId, {
    status: "verified",
    verifiedAt: new Date(),
    facilitatorResponse,
  })
}

/**
 * Mark payment as settled
 */
export async function markPaymentSettled(
  paymentId: string,
  facilitatorResponse?: any
): Promise<Payment | undefined> {
  return updatePaymentStatus(paymentId, {
    status: "settled",
    settledAt: new Date(),
    facilitatorResponse,
  })
}

/**
 * Mark payment as failed
 */
export async function markPaymentFailed(
  paymentId: string,
  errorMessage: string
): Promise<Payment | undefined> {
  return updatePaymentStatus(paymentId, {
    status: "failed",
    errorMessage,
  })
}

/**
 * Get all payments for a user
 */
export async function getUserPayments(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Payment[]> {
  return db
    .select()
    .from(payment)
    .where(eq(payment.userId, userId))
    .orderBy(desc(payment.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * Get payments by wallet address
 */
export async function getPaymentsByWallet(
  walletAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<Payment[]> {
  return db
    .select()
    .from(payment)
    .where(eq(payment.walletAddress, walletAddress))
    .orderBy(desc(payment.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * Get payments by status
 */
export async function getPaymentsByStatus(
  status: Payment["status"],
  limit: number = 100
): Promise<Payment[]> {
  return db
    .select()
    .from(payment)
    .where(eq(payment.status, status))
    .orderBy(desc(payment.createdAt))
    .limit(limit)
}

/**
 * Get payments in date range
 */
export async function getPaymentsByDateRange(
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<Payment[]> {
  const conditions = [
    gte(payment.createdAt, startDate),
    lte(payment.createdAt, endDate),
  ]

  if (userId) {
    conditions.push(eq(payment.userId, userId))
  }

  return db
    .select()
    .from(payment)
    .where(and(...conditions))
    .orderBy(desc(payment.createdAt))
}

/**
 * Get payment statistics for a user
 */
export async function getUserPaymentStats(userId: string) {
  const payments = await db
    .select()
    .from(payment)
    .where(eq(payment.userId, userId))

  const stats = {
    totalPayments: payments.length,
    totalSpent: {
      SOL: "0",
      USDC: "0",
    },
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  }

  for (const p of payments) {
    if (p.status === "settled") {
      stats.successfulPayments++
      if (p.token === "SOL") {
        stats.totalSpent.SOL = (
          BigInt(stats.totalSpent.SOL) + BigInt(p.amount)
        ).toString()
      } else if (p.token === "USDC") {
        stats.totalSpent.USDC = (
          BigInt(stats.totalSpent.USDC) + BigInt(p.amount)
        ).toString()
      }
    } else if (p.status === "failed") {
      stats.failedPayments++
    } else if (p.status === "pending") {
      stats.pendingPayments++
    }
  }

  return stats
}

/**
 * Get recent payments (last 24 hours)
 */
export async function getRecentPayments(
  limit: number = 100
): Promise<Payment[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  return db
    .select()
    .from(payment)
    .where(gte(payment.createdAt, oneDayAgo))
    .orderBy(desc(payment.createdAt))
    .limit(limit)
}

/**
 * Find or create payment (idempotent)
 */
export async function findOrCreatePayment(
  input: CreatePaymentInput
): Promise<Payment> {
  // Check if payment with this signature already exists
  const existing = await getPaymentBySignature(input.transactionSignature)

  if (existing) {
    return existing
  }

  // Create new payment
  return createPayment(input)
}
