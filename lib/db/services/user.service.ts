import { eq } from "drizzle-orm"
import { db } from "../drizzle"
import { user, wallet, type User } from "../schema"

/**
 * User Service - Core user management operations
 */

export type CreateUserInput = {
  walletAddress: string
  privyUserId?: string
  email?: string
  displayName?: string
  avatarUrl?: string
  settings?: User["settings"]
}

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, "walletAddress" | "privyUserId">
>

/**
 * Find user by wallet address
 */
export async function getUserByWalletAddress(
  walletAddress: string
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.walletAddress, walletAddress))
    .limit(1)

  return result[0]
}

/**
 * Find user by Privy user ID
 */
export async function getUserByPrivyId(
  privyUserId: string
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.privyUserId, privyUserId))
    .limit(1)

  return result[0]
}

/**
 * Find user by ID
 */
export async function getUserById(userId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return result[0]
}

/**
 * Find or create user by wallet address
 * This is the main authentication method
 */
export async function findOrCreateUser(input: CreateUserInput): Promise<User> {
  // Try to find existing user
  let existingUser = await getUserByWalletAddress(input.walletAddress)

  if (existingUser) {
    // Update lastActiveAt
    await updateUserLastActive(existingUser.id)
    return existingUser
  }

  // If Privy user ID is provided, check if user exists with different wallet
  if (input.privyUserId) {
    existingUser = await getUserByPrivyId(input.privyUserId)
    if (existingUser) {
      // User exists but with different wallet - this is a new wallet for the same user
      // We'll create a new wallet entry but not a new user
      return existingUser
    }
  }

  // Create new user
  const result = await db
    .insert(user)
    .values({
      walletAddress: input.walletAddress,
      privyUserId: input.privyUserId,
      email: input.email,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      settings: input.settings,
    })
    .returning()

  return result[0]
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<User | undefined> {
  const result = await db
    .update(user)
    .set({
      ...input,
      lastActiveAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  return result[0]
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: User["settings"]
): Promise<User | undefined> {
  const result = await db
    .update(user)
    .set({
      settings,
      lastActiveAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  return result[0]
}

/**
 * Update user's last active timestamp
 */
export async function updateUserLastActive(
  userId: string
): Promise<User | undefined> {
  const result = await db
    .update(user)
    .set({
      lastActiveAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  return result[0]
}

/**
 * Delete user (soft delete by removing sensitive data)
 */
export async function deleteUser(userId: string): Promise<void> {
  // In production, you might want to soft delete instead
  await db.delete(user).where(eq(user.id, userId))
}

/**
 * Get user with their wallets
 */
export async function getUserWithWallets(userId: string) {
  const result = await db
    .select()
    .from(user)
    .leftJoin(wallet, eq(wallet.userId, user.id))
    .where(eq(user.id, userId))

  if (result.length === 0) return null

  const userRecord = result[0].User
  const wallets = result.filter((r) => r.Wallet !== null).map((r) => r.Wallet!)

  return {
    ...userRecord,
    wallets,
  }
}

/**
 * Link Privy user ID to existing user
 */
export async function linkPrivyUser(
  userId: string,
  privyUserId: string
): Promise<User | undefined> {
  const result = await db
    .update(user)
    .set({
      privyUserId,
      lastActiveAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  return result[0]
}
