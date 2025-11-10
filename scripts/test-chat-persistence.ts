/**
 * Phase 3 Test Script - Chat & Message Persistence
 * Tests all chat and message CRUD operations
 */

import {
  createChat,
  getChatById,
  getChatsByUser,
  updateChat,
  updateChatTitle,
  deleteChat,
  restoreChat,
  saveMessage,
  getChatMessages,
  getChatWithMessages,
  countChatMessages,
  getUserChatCount,
  getUserChatStats,
  searchChatsByTitle,
  getRecentChats,
  getDeletedChats,
} from "../lib/db/services/chat.service"
import { findOrCreateUser } from "../lib/db/services/user.service"

// Test configuration
const TEST_WALLET = "test_phase3_wallet_" + Date.now()
const TEST_WALLET_2 = "test_phase3_wallet2_" + Date.now()

// Test counters
let totalTests = 0
let passedTests = 0
let failedTests = 0

// Helper to run tests
function test(name: string, fn: () => Promise<void>) {
  return async () => {
    totalTests++
    try {
      await fn()
      console.log(`✅ ${name}`)
      passedTests++
    } catch (error: any) {
      console.error(`❌ ${name}`)
      console.error(`   Error: ${error.message}`)
      failedTests++
    }
  }
}

async function runTests() {
  console.log("🧪 Starting Phase 3: Chat & Message Persistence Tests\n")

  // Create test users
  console.log("📋 Setting up test users...")
  const user1 = await findOrCreateUser({ walletAddress: TEST_WALLET })
  const user2 = await findOrCreateUser({ walletAddress: TEST_WALLET_2 })

  if (!user1 || !user2) {
    console.error("❌ Failed to create test users")
    process.exit(1)
  }

  console.log(`✅ Test users created: ${user1.id}, ${user2.id}\n`)

  // Test variables
  let testChatId: string
  let testMessageId: string

  // ===== CHAT CREATION TESTS =====
  await test("Create new chat", async () => {
    const chat = await createChat({
      userId: user1.id,
      title: "Test Chat 1",
      modelId: "gpt-4",
    })

    if (!chat) throw new Error("Failed to create chat")
    if (chat.title !== "Test Chat 1") throw new Error("Chat title mismatch")
    if (chat.modelId !== "gpt-4") throw new Error("Chat modelId mismatch")

    testChatId = chat.id
  })()

  await test("Create chat with sandbox ID", async () => {
    const chat = await createChat({
      userId: user1.id,
      title: "Sandbox Chat",
      sandboxId: "sandbox_123",
    })

    if (!chat) throw new Error("Failed to create chat")
    if (chat.sandboxId !== "sandbox_123")
      throw new Error("Sandbox ID mismatch")
  })()

  // ===== CHAT RETRIEVAL TESTS =====
  await test("Get chat by ID", async () => {
    const chat = await getChatById(testChatId)

    if (!chat) throw new Error("Chat not found")
    if (chat.id !== testChatId) throw new Error("Chat ID mismatch")
  })()

  await test("Get chats by user", async () => {
    const chats = await getChatsByUser(user1.id)

    if (!chats || chats.length === 0) throw new Error("No chats found")
    if (chats.length < 2) throw new Error("Expected at least 2 chats")
  })()

  await test("Get chats with pagination", async () => {
    const chats = await getChatsByUser(user1.id, { limit: 1, offset: 0 })

    if (!chats) throw new Error("No chats found")
    if (chats.length !== 1) throw new Error("Pagination limit not respected")
  })()

  // ===== CHAT UPDATE TESTS =====
  await test("Update chat title", async () => {
    const updated = await updateChatTitle(testChatId, "Updated Title")

    if (!updated) throw new Error("Failed to update chat")
    if (updated.title !== "Updated Title")
      throw new Error("Title not updated")
  })()

  await test("Update chat details", async () => {
    const updated = await updateChat(testChatId, {
      title: "Final Title",
      modelId: "gpt-4-turbo",
      sandboxId: "sandbox_456",
    })

    if (!updated) throw new Error("Failed to update chat")
    if (updated.title !== "Final Title") throw new Error("Title not updated")
    if (updated.modelId !== "gpt-4-turbo")
      throw new Error("Model ID not updated")
    if (updated.sandboxId !== "sandbox_456")
      throw new Error("Sandbox ID not updated")
  })()

  // ===== MESSAGE TESTS =====
  await test("Save user message", async () => {
    const message = await saveMessage({
      chatId: testChatId,
      role: "user",
      parts: [{ type: "text", text: "Hello, AI!" }],
      attachments: [],
    })

    if (!message) throw new Error("Failed to save message")
    if (message.role !== "user") throw new Error("Role mismatch")
    if (message.chatId !== testChatId) throw new Error("Chat ID mismatch")

    testMessageId = message.id
  })()

  await test("Save assistant message with metadata", async () => {
    const message = await saveMessage({
      chatId: testChatId,
      role: "assistant",
      parts: [{ type: "text", text: "Hello, human!" }],
      attachments: [],
      metadata: {
        modelId: "gpt-4",
        reasoningEffort: "medium",
        tokens: { input: 10, output: 15, total: 25 },
        finishReason: "stop",
      },
    })

    if (!message) throw new Error("Failed to save message")
    if (message.role !== "assistant") throw new Error("Role mismatch")
    if (!message.metadata) throw new Error("Metadata not saved")
  })()

  await test("Get chat messages", async () => {
    const messages = await getChatMessages(testChatId)

    if (!messages || messages.length === 0) throw new Error("No messages found")
    if (messages.length !== 2) throw new Error("Expected 2 messages")
  })()

  await test("Get messages with pagination", async () => {
    const messages = await getChatMessages(testChatId, { limit: 1, offset: 0 })

    if (!messages) throw new Error("No messages found")
    if (messages.length !== 1)
      throw new Error("Pagination limit not respected")
  })()

  await test("Count chat messages", async () => {
    const count = await countChatMessages(testChatId)

    if (count < 2) throw new Error(`Expected at least 2 messages, got ${count}`)
  })()

  await test("Get chat with messages", async () => {
    const result = await getChatWithMessages(testChatId)

    if (!result) throw new Error("Failed to get chat with messages")
    if (!result.chat) throw new Error("Chat not included")
    if (!result.messages || result.messages.length === 0)
      throw new Error("Messages not included")
  })()

  // ===== SEARCH & FILTER TESTS =====
  await test("Search chats by title", async () => {
    const chats = await searchChatsByTitle(user1.id, "Final")

    if (!chats || chats.length === 0)
      throw new Error("Search did not find chats")
    const found = chats.some((c) => c.id === testChatId)
    if (!found) throw new Error("Expected chat not found in search results")
  })()

  await test("Get recent chats", async () => {
    const chats = await getRecentChats(user1.id)

    if (!chats || chats.length === 0) throw new Error("No recent chats found")
  })()

  // ===== STATISTICS TESTS =====
  await test("Get user chat count", async () => {
    const count = await getUserChatCount(user1.id)

    if (count < 2) throw new Error(`Expected at least 2 chats, got ${count}`)
  })()

  await test("Get user chat statistics", async () => {
    const stats = await getUserChatStats(user1.id)

    if (!stats) throw new Error("Failed to get stats")
    if (stats.activeChats < 2)
      throw new Error(`Expected at least 2 active chats, got ${stats.activeChats}`)
    if (stats.totalMessages < 2)
      throw new Error(`Expected at least 2 messages, got ${stats.totalMessages}`)
  })()

  // ===== SOFT DELETE TESTS =====
  await test("Soft delete chat", async () => {
    const success = await deleteChat(testChatId)

    if (!success) throw new Error("Failed to delete chat")

    // Verify chat is marked as deleted
    const deleted = await getChatById(testChatId)
    if (deleted) throw new Error("Deleted chat still accessible via getChatById")
  })()

  await test("Get deleted chats", async () => {
    const deletedChats = await getDeletedChats(user1.id)

    if (!deletedChats || deletedChats.length === 0)
      throw new Error("No deleted chats found")
    const found = deletedChats.some((c) => c.id === testChatId)
    if (!found) throw new Error("Deleted chat not in deleted chats list")
  })()

  await test("Restore deleted chat", async () => {
    const restored = await restoreChat(testChatId)

    if (!restored) throw new Error("Failed to restore chat")
    if (restored.isDeleted) throw new Error("Chat still marked as deleted")

    // Verify chat is accessible again
    const chat = await getChatById(testChatId)
    if (!chat) throw new Error("Restored chat not accessible")
  })()

  // ===== USER ISOLATION TESTS =====
  await test("User isolation - cannot access other user's chats", async () => {
    const user2Chats = await getChatsByUser(user2.id)

    // User 2 should not have user 1's chats
    const hasUser1Chat = user2Chats.some((c) => c.id === testChatId)
    if (hasUser1Chat)
      throw new Error("User 2 can see User 1's chats (isolation broken)")
  })()

  await test("Create chat for user 2", async () => {
    const chat = await createChat({
      userId: user2.id,
      title: "User 2 Chat",
    })

    if (!chat) throw new Error("Failed to create chat for user 2")
    if (chat.userId !== user2.id) throw new Error("Chat user ID mismatch")
  })()

  // ===== MULTI-MESSAGE TESTS =====
  await test("Save multiple messages in sequence", async () => {
    // Create new chat for this test
    const chat = await createChat({
      userId: user1.id,
      title: "Multi-message Chat",
    })

    if (!chat) throw new Error("Failed to create chat")

    // Save 5 messages
    for (let i = 1; i <= 5; i++) {
      const message = await saveMessage({
        chatId: chat.id,
        role: i % 2 === 0 ? "assistant" : "user",
        parts: [{ type: "text", text: `Message ${i}` }],
        attachments: [],
      })

      if (!message) throw new Error(`Failed to save message ${i}`)
    }

    // Verify all messages saved
    const messages = await getChatMessages(chat.id)
    if (messages.length !== 5)
      throw new Error(`Expected 5 messages, got ${messages.length}`)
  })()

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 Test Summary")
  console.log("=".repeat(60))
  console.log(`Total Tests: ${totalTests}`)
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  console.log("=".repeat(60))

  if (failedTests === 0) {
    console.log("\n🎉 All Phase 3 tests passed successfully!")
    console.log("\n✨ Phase 3: Chat & Message Persistence is ready for production!")
  } else {
    console.log(
      `\n⚠️  ${failedTests} test(s) failed. Please review the errors above.`
    )
    process.exit(1)
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error)
  process.exit(1)
})
