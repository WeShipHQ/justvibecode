import type { InferSelectModel } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  index,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import type { AppUsage } from "../usage"

// User table - Enhanced for wallet-based authentication
export const user = pgTable(
  "User",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Wallet address is the primary identifier for authentication
    walletAddress: varchar("walletAddress", { length: 64 }).notNull().unique(),
    // Privy user ID for linking to Privy authentication
    privyUserId: varchar("privyUserId", { length: 128 }),
    // Optional email (may not be provided in wallet-only auth)
    email: varchar("email", { length: 64 }),
    // Legacy password field (kept for backwards compatibility)
    password: varchar("password", { length: 64 }),
    // User profile information
    displayName: varchar("displayName", { length: 128 }),
    avatarUrl: text("avatarUrl"),
    // User preferences stored as JSONB
    settings: jsonb("settings").$type<{
      theme?: "light" | "dark" | "system"
      defaultModel?: string
      reasoningEffort?: "low" | "medium"
      autoFixErrors?: boolean
      promptInput?: string
    }>(),
    // Timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    lastActiveAt: timestamp("lastActiveAt").notNull().defaultNow(),
  },
  (table) => ({
    walletAddressIdx: index("user_wallet_address_idx").on(table.walletAddress),
    privyUserIdIdx: index("user_privy_user_id_idx").on(table.privyUserId),
  })
)

export type User = InferSelectModel<typeof user>

// Wallet table - Support multiple wallets per user
export const wallet = pgTable(
  "Wallet",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Wallet address (unique across all users)
    address: varchar("address", { length: 64 }).notNull().unique(),
    // Wallet type (embedded Privy wallet or external wallet)
    walletType: varchar("walletType", {
      enum: ["embedded", "phantom", "solflare", "backpack", "other"],
    })
      .notNull()
      .default("other"),
    // Whether this is the user's active/primary wallet
    isActive: boolean("isActive").notNull().default(true),
    // Cached balance snapshot (updated periodically)
    balance: jsonb("balance").$type<{
      SOL?: string
      USDC?: string
      lastUpdated?: string
    }>(),
    // Timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    lastUsedAt: timestamp("lastUsedAt").notNull().defaultNow(),
  },
  (table) => ({
    addressIdx: index("wallet_address_idx").on(table.address),
    userIdIdx: index("wallet_user_id_idx").on(table.userId),
  })
)

export type Wallet = InferSelectModel<typeof wallet>

// Session table - JWT-based authentication persistence
export const session = pgTable(
  "Session",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Wallet address used for this session
    walletAddress: varchar("walletAddress", { length: 64 }).notNull(),
    // Session token (JWT or random token)
    sessionToken: varchar("sessionToken", { length: 512 }).notNull().unique(),
    // Session expiration
    expiresAt: timestamp("expiresAt").notNull(),
    // User agent for security tracking
    userAgent: text("userAgent"),
    // IP address for security tracking
    ipAddress: varchar("ipAddress", { length: 45 }),
    // Timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    lastActiveAt: timestamp("lastActiveAt").notNull().defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: index("session_token_idx").on(table.sessionToken),
    userIdIdx: index("session_user_id_idx").on(table.userId),
    walletAddressIdx: index("session_wallet_address_idx").on(
      table.walletAddress
    ),
  })
)

export type Session = InferSelectModel<typeof session>

// Payment table - Store x402 payment transactions
export const payment = pgTable(
  "Payment",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Wallet address that made the payment
    walletAddress: varchar("walletAddress", { length: 64 }).notNull(),
    // Solana transaction signature (unique identifier)
    transactionSignature: varchar("transactionSignature", { length: 128 })
      .notNull()
      .unique(),
    // Network where transaction occurred
    network: varchar("network", { length: 32 }).notNull(), // "solana-devnet" | "solana-mainnet"
    // Token used for payment
    token: varchar("token", { length: 16 }).notNull(), // "USDC" | "SOL"
    // Amount paid in atomic units (lamports for SOL, smallest unit for USDC)
    amount: varchar("amount", { length: 64 }).notNull(),
    // Payment status
    status: varchar("status", {
      enum: ["pending", "verified", "settled", "failed"],
    })
      .notNull()
      .default("pending"),
    // Full facilitator response (verification data)
    facilitatorResponse: jsonb("facilitatorResponse"),
    // API resource that was paid for
    resourceUrl: text("resourceUrl"),
    // Error details if payment failed
    errorMessage: text("errorMessage"),
    // Timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    verifiedAt: timestamp("verifiedAt"),
    settledAt: timestamp("settledAt"),
  },
  (table) => ({
    transactionSignatureIdx: index("payment_transaction_signature_idx").on(
      table.transactionSignature
    ),
    userIdIdx: index("payment_user_id_idx").on(table.userId),
    walletAddressIdx: index("payment_wallet_address_idx").on(
      table.walletAddress
    ),
    statusIdx: index("payment_status_idx").on(table.status),
    createdAtIdx: index("payment_created_at_idx").on(table.createdAt),
  })
)

export type Payment = InferSelectModel<typeof payment>

// FreeMessage table - Track free message usage per wallet
export const freeMessage = pgTable(
  "FreeMessage",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Wallet address (unique per user)
    walletAddress: varchar("walletAddress", { length: 64 }).notNull().unique(),
    // Number of free messages used
    messageCount: varchar("messageCount", { length: 32 }).notNull().default("0"),
    // Maximum free messages allowed
    limit: varchar("limit", { length: 32 }).notNull().default("1"),
    // Timestamps
    firstMessageAt: timestamp("firstMessageAt").notNull().defaultNow(),
    lastMessageAt: timestamp("lastMessageAt"),
    resetAt: timestamp("resetAt"),
  },
  (table) => ({
    walletAddressIdx: index("free_message_wallet_address_idx").on(
      table.walletAddress
    ),
  })
)

export type FreeMessage = InferSelectModel<typeof freeMessage>

export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
    // AI model used in this chat
    modelId: varchar("modelId", { length: 64 }),
    // Link to sandbox if this chat has code execution
    sandboxId: varchar("sandboxId", { length: 128 }),
    // Soft delete flag
    isDeleted: boolean("isDeleted").notNull().default(false),
    deletedAt: timestamp("deletedAt"),
    lastContext: jsonb("lastContext").$type<AppUsage | null>(),
  },
  (table) => ({
    userIdIdx: index("chat_user_id_idx").on(table.userId),
    updatedAtIdx: index("chat_updated_at_idx").on(table.updatedAt),
    isDeletedIdx: index("chat_is_deleted_idx").on(table.isDeleted),
  })
)

export type Chat = InferSelectModel<typeof chat>

export const message = pgTable(
  "Message",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(),
    // Extended parts to support DataPart types (text, tool-call, tool-result, etc.)
    parts: jsonb("parts").notNull(),
    attachments: json("attachments").notNull(),
    // Link to payment if this message was paid for
    paymentId: uuid("paymentId").references(() => payment.id),
    // Store AI model metadata (model name, reasoning effort, tokens, etc.)
    metadata: jsonb("metadata").$type<{
      modelId?: string
      reasoningEffort?: "low" | "medium" | "high"
      tokens?: {
        input?: number
        output?: number
        total?: number
      }
      finishReason?: string
      streamDuration?: number
    }>(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    chatIdIdx: index("message_chat_id_idx").on(table.chatId),
    paymentIdIdx: index("message_payment_id_idx").on(table.paymentId),
    createdAtIdx: index("message_created_at_idx").on(table.createdAt),
  })
)

export type DBMessage = InferSelectModel<typeof message>

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    }
  }
)

export type Document = InferSelectModel<typeof document>

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
)

export type Suggestion = InferSelectModel<typeof suggestion>

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
)

export type Stream = InferSelectModel<typeof stream>
