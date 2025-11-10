  Database Migration Plan for JustVibeCode Platform

  Current State Assessment

  Your platform currently has:
  - ✅ Drizzle ORM configured with PostgreSQL
  - ✅ Sample schema (User, Chat, Message, Document, Suggestion, Stream tables)
  - ✅ x402 payment system implemented but not persisted
  - ✅ Privy wallet authentication integrated but not stored in DB
  - ❌ All data in memory/localStorage - lost on refresh/restart
  - ❌ No user persistence - wallet addresses not stored
  - ❌ No payment history - transactions only logged to console
  - ❌ No chat history - conversations are ephemeral
  - ❌ No sandbox persistence - projects lost on browser close

  ---
  Migration Phases

  Phase 1: Foundation - User Identity & Authentication

  Objective: Establish persistent user identity based on wallet addresses and Privy authentication

  Schema Changes:
  - Enhance User table to support wallet-based authentication
  - Create Wallet table for multi-wallet support
  - Create Session table for authentication persistence

  Implementation Tasks:
  1. Modify User schema to add:
    - walletAddress (primary identifier, unique, indexed)
    - privyUserId (link to Privy)
    - displayName, avatarUrl
    - settings (JSONB for user preferences)
    - lastActiveAt, createdAt timestamps
  2. Create Wallet table:
    - Link users to their connected wallets
    - Support multiple wallets per user
    - Track wallet type (embedded, Phantom, Solflare, Backpack)
    - Store wallet balance snapshots
  3. Create Session table:
    - JWT-based session management
    - Link sessions to wallet addresses
    - Support session expiration
  4. Build User Registration/Login Flow:
    - Auto-create user on first wallet connection
    - Retrieve existing user by wallet address
    - Update lastActiveAt on each request
  5. Create User Service Layer:
    - getUserByWallet() - Find or create user
    - updateUserSettings() - Persist preferences
    - getUserSessions() - List active sessions

  Migration Steps:
  - Create database migration scripts
  - Update Privy integration to persist users
  - Migrate any existing wallet data (if tracked elsewhere)
  - Update API middleware to fetch user from DB

  Affected Files:
  - lib/db/schema.ts - Schema updates
  - lib/db/queries.ts - User queries
  - app/api/auth/* - New auth endpoints
  - hooks/use-wallet.ts - Add DB user lookup
  - providers/privy-provider.tsx - Persist on wallet connect

  ---
  Phase 2: Payment System Persistence

  Objective: Store all x402 payment transactions with full audit trail and enable payment history

  Schema Changes:
  - Create Payment table
  - Create FreeMessage table (replace localStorage)
  - Add payment reference to Message table

  Implementation Tasks:

  1. Create Payment table:
    - transactionSignature (unique, indexed)
    - userId, walletAddress
    - network (solana-devnet/mainnet)
    - token (USDC/SOL)
    - amount (atomic units)
    - status (pending/verified/settled/failed)
    - facilitatorResponse (JSONB - full verification data)
    - resourceUrl (API endpoint paid for)
    - createdAt, settledAt
  2. Create FreeMessage table:
    - Replace localStorage tracking
    - walletAddress (unique, indexed)
    - messageCount, limit
    - firstMessageAt, lastMessageAt, resetAt
  3. Update x402 Payment Handler:
    - Save payment record after verification
    - Update status after settlement
    - Store transaction signature
    - Generate payment receipts
  4. Create Payment Service Layer:
    - recordPayment() - Create payment record
    - verifyAndUpdatePayment() - Update after verification
    - getUserPaymentHistory() - Retrieve payment history
    - getPaymentByTxSignature() - Lookup by transaction
  5. Migrate Free Message Tracking:
    - Move logic from free-message-storage.ts to DB queries
    - Create migration endpoint to import localStorage data
    - Update use-free-message-status.ts to use DB
  6. Add Payment History UI:
    - User payment dashboard
    - Transaction details view
    - Receipt download

  Migration Steps:
  - Create payment tables migration
  - Update x402 handler to persist payments
  - Create free message migration script
  - Update free message hooks to query DB
  - Build payment history API endpoints
  - Add payment UI components

  Affected Files:
  - lib/db/schema.ts - Payment schemas
  - app/api/chat/route.ts - Save payments
  - app/api/x402/payment-handler.ts - Persist after settlement
  - lib/free-message-storage.ts - Remove, replace with DB
  - hooks/use-free-message-status.ts - Query DB instead
  - app/api/payments/* - New payment history endpoints

  ---
  Phase 3: Chat & Message Persistence

  Objective: Enable persistent chat history with full message recovery across sessions

  Schema Changes:
  - Activate and enhance existing Chat table
  - Activate and enhance existing Message table
  - Link messages to payments

  Implementation Tasks:

  1. Enhance Chat table:
    - Already well-designed, just needs usage
    - Add modelId to track AI model used
    - Add sandboxId to link chats to sandboxes
    - Add updatedAt for sorting
  2. Enhance Message table:
    - Extend parts JSONB to store DataPart types
    - Add paymentId foreign key
    - Add metadata JSONB for AI model info
    - Support message attachments
  3. Create Chat Service Layer:
    - createChat() - Initialize new chat
    - getChatsByUser() - List user's chats
    - getChatMessages() - Retrieve messages with pagination
    - saveMessage() - Persist user/AI messages
    - updateChatTitle() - Auto-generate from first message
    - deleteChat() - Soft delete with cascade
  4. Update Chat API:
    - Save all messages during streaming
    - Link paid messages to payment records
    - Store DataPart stream events
    - Persist AI model metadata
  5. Implement Chat History:
    - Chat list UI component
    - Chat search/filter
    - Message pagination
    - Restore chat on selection
  6. Handle Message Streaming:
    - Buffer messages during stream
    - Save complete message after stream ends
    - Handle streaming errors gracefully

  Migration Steps:
  - Create chat enhancement migration
  - Update /api/chat to save messages
  - Build chat history API endpoints
  - Create chat list UI
  - Add chat restore functionality
  - Implement message pagination

  Affected Files:
  - lib/db/schema.ts - Chat/Message enhancements
  - lib/db/queries.ts - Chat queries
  - app/api/chat/route.ts - Persist messages
  - app/api/chats/* - CRUD endpoints
  - components/chat/* - Add history UI
  - lib/chat-context.tsx - Load from DB

  ---
  Phase 4: Sandbox & Project Persistence

  Objective: Persist sandbox state, generated files, and command history for project recovery

  Schema Changes:
  - Create Sandbox table
  - Create SandboxFile table
  - Create Command table
  - Create CommandLog table

  Implementation Tasks:

  1. Create Sandbox table:
    - sandboxId (E2B/Vercel ID, unique)
    - userId, chatId references
    - status (running/stopped/error)
    - url (preview URL)
    - metadata (JSONB - sandbox config)
    - createdAt, lastActiveAt, stoppedAt
  2. Create SandboxFile table:
    - Link files to sandbox
    - path, content, contentHash
    - isGenerated (AI-generated flag)
    - createdAt, updatedAt
  3. Create Command table:
    - sandboxId, cmdId
    - command, args (JSONB)
    - status, exitCode
    - background flag
    - startedAt, finishedAt
  4. Create CommandLog table:
    - Link logs to commands
    - stream (stdout/stderr)
    - data (log content)
    - timestamp
  5. Create Sandbox Service Layer:
    - createSandbox() - Record new sandbox
    - updateSandboxStatus() - Track lifecycle
    - saveSandboxFiles() - Persist generated files
    - recordCommand() - Save command execution
    - appendCommandLog() - Stream logs to DB
    - getSandboxByUser() - List user sandboxes
    - restoreSandbox() - Recover sandbox state
  6. Update Sandbox APIs:
    - Persist sandbox on creation
    - Save files after generation
    - Record command execution
    - Stream logs to database
    - Enable sandbox restore
  7. Implement Project Recovery:
    - Sandbox history UI
    - File browser for past projects
    - Command history replay
    - Restore sandbox to new session

  Migration Steps:
  - Create sandbox tables migration
  - Update sandbox creation API
  - Hook file generation events
  - Capture command execution
  - Build sandbox history UI
  - Implement project restore

  Affected Files:
  - lib/db/schema.ts - Sandbox schemas
  - lib/db/queries.ts - Sandbox queries
  - app/api/sandboxes/* - Update all sandbox APIs
  - app/state.ts - Load from DB on restore
  - components/sandbox/* - Add history UI

  ---
  Phase 5: Analytics & Optimization

  Objective: Add usage analytics, optimize queries, and implement caching

  Implementation Tasks:

  1. Create Analytics Tables:
    - UserUsage - Track AI usage per user
    - ModelUsage - Model-specific usage stats
    - PaymentAnalytics - Revenue tracking
    - ErrorLogs - Track system errors
  2. Implement Query Optimization:
    - Add database indexes on frequently queried columns
    - Implement pagination for all list queries
    - Add connection pooling
    - Use prepared statements
  3. Add Caching Layer:
    - Redis for hot data (active chats, sessions)
    - Cache user profiles
    - Cache payment verification results
    - Implement cache invalidation strategy
  4. Build Admin Dashboard:
    - User statistics
    - Payment analytics
    - System health monitoring
    - Error tracking
  5. Implement Data Retention:
    - Archive old chats
    - Clean up expired sessions
    - Prune old sandbox data
    - GDPR-compliant data deletion

  Affected Files:
  - lib/db/schema.ts - Analytics tables
  - lib/cache/* - New caching layer
  - app/api/admin/* - Admin endpoints
  - drizzle.config.ts - Add indexes

  ---
  Phase 6: Testing & Rollout

  Objective: Comprehensive testing and gradual rollout with rollback capability

  Implementation Tasks:

  1. Database Testing:
    - Unit tests for all DB queries
    - Integration tests for API endpoints
    - Load testing for concurrent users
    - Test migration rollback scripts
  2. Create Migration Scripts:
    - Data export from localStorage
    - Batch user migration
    - Payment history reconstruction
    - Rollback procedures
  3. Implement Feature Flags:
    - Gradual rollout per feature
    - A/B testing capability
    - Quick rollback if issues arise
  4. Monitoring & Alerting:
    - Database performance monitoring
    - Query error tracking
    - Payment failure alerts
    - Sandbox creation monitoring
  5. Documentation:
    - Database schema documentation
    - API documentation updates
    - Migration runbooks
    - Rollback procedures

  Deliverables:
  - Comprehensive test suite
  - Migration scripts with rollback
  - Feature flag configuration
  - Monitoring dashboard
  - Updated documentation

  ---
  Critical Dependencies & Prerequisites

  Before starting migration:

  1. Environment Setup:
    - PostgreSQL database provisioned
    - DATABASE_URL configured in all environments
    - Database connection tested
  2. Backup Strategy:
    - Database backup schedule
    - Point-in-time recovery enabled
    - Backup restoration tested
  3. Development Tools:
    - Drizzle migrations working
    - Database seeding scripts
    - Local development database
  4. Security:
    - Database credentials secured
    - Connection encryption enabled
    - API authentication enforced
    - SQL injection prevention verified

  ---
  Risk Mitigation

  Data Loss Prevention:
  - Run phases sequentially, not in parallel
  - Test each phase in staging before production
  - Keep old code paths active during transition
  - Implement dual-write pattern (memory + DB) initially
  - Feature flags for instant rollback

  Performance Risks:
  - Monitor query performance during rollout
  - Optimize slow queries immediately
  - Implement caching early
  - Use database indexes strategically

  User Experience:
  - Maintain backward compatibility during transition
  - Show migration progress to users
  - Handle database errors gracefully
  - Provide clear error messages

  ---
  Success Metrics

  Phase Completion Criteria:
  - All unit tests passing
  - Integration tests passing
  - Manual QA completed
  - Performance benchmarks met
  - Documentation updated
  - Rollback tested successfully

  Overall Migration Success:
  - Zero data loss
  - No critical bugs in production
  - Query response time < 200ms (p95)
  - 99.9% uptime during migration
  - User satisfaction maintained
  - Payment processing reliability = 100%

  ---
  Timeline Overview

  Phase 1: Foundation (User & Auth)          → 1-2 weeks
  Phase 2: Payment Persistence               → 1-2 weeks
  Phase 3: Chat & Message Persistence        → 2-3 weeks
  Phase 4: Sandbox & Project Persistence     → 2-3 weeks
  Phase 5: Analytics & Optimization          → 1-2 weeks
  Phase 6: Testing & Rollout                 → 1-2 weeks
