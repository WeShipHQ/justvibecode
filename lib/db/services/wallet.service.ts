import { and, eq } from "drizzle-orm"
import { db } from "../drizzle"
import { wallet, type Wallet } from "../schema"

/**
 * Wallet Service - Manage user wallets
 */

export type CreateWalletInput = {
  userId: string
  address: string
  walletType: "embedded" | "phantom" | "solflare" | "backpack" | "other"
  isActive?: boolean
  balance?: Wallet["balance"]
}

export type UpdateWalletInput = {
  walletType?: Wallet["walletType"]
  isActive?: boolean
  balance?: Wallet["balance"]
}

/**
 * Find wallet by address
 */
export async function getWalletByAddress(
  address: string
): Promise<Wallet | undefined> {
  const result = await db
    .select()
    .from(wallet)
    .where(eq(wallet.address, address))
    .limit(1)

  return result[0]
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: string): Promise<Wallet[]> {
  return db.select().from(wallet).where(eq(wallet.userId, userId))
}

/**
 * Get active wallet for a user
 */
export async function getActiveWallet(
  userId: string
): Promise<Wallet | undefined> {
  const result = await db
    .select()
    .from(wallet)
    .where(and(eq(wallet.userId, userId), eq(wallet.isActive, true)))
    .limit(1)

  return result[0]
}

/**
 * Create or update wallet
 */
export async function createOrUpdateWallet(
  input: CreateWalletInput
): Promise<Wallet> {
  // Check if wallet already exists
  const existingWallet = await getWalletByAddress(input.address)

  if (existingWallet) {
    // Update existing wallet
    const result = await db
      .update(wallet)
      .set({
        userId: input.userId,
        walletType: input.walletType,
        isActive: input.isActive ?? existingWallet.isActive,
        balance: input.balance ?? existingWallet.balance,
        lastUsedAt: new Date(),
      })
      .where(eq(wallet.address, input.address))
      .returning()

    return result[0]
  }

  // Create new wallet
  const result = await db
    .insert(wallet)
    .values({
      userId: input.userId,
      address: input.address,
      walletType: input.walletType,
      isActive: input.isActive ?? true,
      balance: input.balance,
    })
    .returning()

  return result[0]
}

/**
 * Update wallet
 */
export async function updateWallet(
  walletId: string,
  input: UpdateWalletInput
): Promise<Wallet | undefined> {
  const result = await db
    .update(wallet)
    .set({
      ...input,
      lastUsedAt: new Date(),
    })
    .where(eq(wallet.id, walletId))
    .returning()

  return result[0]
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  address: string,
  balance: Wallet["balance"]
): Promise<Wallet | undefined> {
  const result = await db
    .update(wallet)
    .set({
      balance: {
        ...balance,
        lastUpdated: new Date().toISOString(),
      },
      lastUsedAt: new Date(),
    })
    .where(eq(wallet.address, address))
    .returning()

  return result[0]
}

/**
 * Set wallet as active (and deactivate others for the user)
 */
export async function setActiveWallet(
  userId: string,
  walletAddress: string
): Promise<void> {
  // Deactivate all wallets for the user
  await db
    .update(wallet)
    .set({ isActive: false })
    .where(eq(wallet.userId, userId))

  // Activate the specified wallet
  await db
    .update(wallet)
    .set({ isActive: true, lastUsedAt: new Date() })
    .where(and(eq(wallet.userId, userId), eq(wallet.address, walletAddress)))
}

/**
 * Delete wallet
 */
export async function deleteWallet(walletId: string): Promise<void> {
  await db.delete(wallet).where(eq(wallet.id, walletId))
}

/**
 * Update wallet last used timestamp
 */
export async function updateWalletLastUsed(
  address: string
): Promise<Wallet | undefined> {
  const result = await db
    .update(wallet)
    .set({
      lastUsedAt: new Date(),
    })
    .where(eq(wallet.address, address))
    .returning()

  return result[0]
}

/**
 * Find or create wallet for user
 */
export async function findOrCreateWallet(
  input: CreateWalletInput
): Promise<Wallet> {
  const existingWallet = await getWalletByAddress(input.address)

  if (existingWallet) {
    // Update last used timestamp
    await updateWalletLastUsed(input.address)
    return existingWallet
  }

  // Create new wallet
  return createOrUpdateWallet(input)
}
