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

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
})

export type Chat = InferSelectModel<typeof chat>

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
})

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
