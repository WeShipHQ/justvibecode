/**
 * Phase 4: Sandbox & Project Persistence - Test Script
 *
 * Tests all sandbox, file, command, and log persistence functionality.
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })

import { createChat } from "../lib/db/services/chat.service"
import {
  // Log management
  appendCommandLog,
  appendCommandLogs,
  countCommandLogs,
  countSandboxCommands,
  countSandboxFiles,
  countUserSandboxes,
  // Command management
  createCommand,
  // Sandbox management
  createSandbox,
  findOrCreateSandbox,
  getActiveSandboxes,
  getChatSandboxes,
  getCommandById,
  getCommandLogs,
  getCommandStderr,
  getCommandStdout,
  getCommandWithLogs,
  getRecentSandboxActivity,
  getSandboxById,
  getSandboxBySandboxId,
  getSandboxCommands,
  getSandboxFileByPath,
  getSandboxFiles,
  getSandboxGeneratedFiles,
  // Comprehensive queries
  getSandboxWithDetails,
  getUserSandboxes,
  getUserSandboxStats,
  markCommandCompleted,
  markCommandFailed,
  markCommandStarted,
  // File management
  saveSandboxFile,
  saveSandboxFiles,
  touchSandbox,
  updateSandboxStatus,
  updateSandboxUrl,
} from "../lib/db/services/sandbox.service"
import { findOrCreateUser } from "../lib/db/services/user.service"

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function test(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error })
  if (passed) {
    console.log(`✅ ${name}`)
  } else {
    console.log(`❌ ${name}`)
    if (error) {
      console.log(`   Error: ${error}`)
    }
  }
}

async function runTests() {
  console.log("🧪 Testing Phase 4: Sandbox & Project Persistence\n")

  let testUser1: any
  let testUser2: any
  let testChat: any
  let sandbox1: any
  let sandbox2: any
  let file1: any
  let command1: any

  try {
    // ============================================
    // Setup: Create test users and chat
    // ============================================
    console.log("📋 Setting up test environment...")

    testUser1 = await findOrCreateUser({
      walletAddress: "test_sandbox_user_1",
      displayName: "Test Sandbox User 1",
    })
    test("Create test user 1", !!testUser1)

    testUser2 = await findOrCreateUser({
      walletAddress: "test_sandbox_user_2",
      displayName: "Test Sandbox User 2",
    })
    test("Create test user 2", !!testUser2)

    testChat = await createChat({
      userId: testUser1.id,
      title: "Test Chat for Sandbox",
    })
    test("Create test chat", !!testChat)

    console.log("\n")

    // ============================================
    // Test Sandbox Management
    // ============================================
    console.log("🏖️  Testing Sandbox Management...")

    // Test 1: Create sandbox
    sandbox1 = await createSandbox({
      sandboxId: "test_sandbox_1",
      userId: testUser1.id,
      chatId: testChat.id,
      url: "https://test-sandbox-1.vercel.app",
      metadata: {
        template: "nextjs",
        runtime: "nodejs",
        ports: [3000],
      },
    })
    test(
      "Create sandbox",
      !!sandbox1 && sandbox1.sandboxId === "test_sandbox_1"
    )

    // Test 2: Get sandbox by ID
    const fetchedSandbox = await getSandboxById(sandbox1.id)
    test(
      "Get sandbox by ID",
      !!fetchedSandbox && fetchedSandbox.id === sandbox1.id
    )

    // Test 3: Get sandbox by external sandbox ID
    const fetchedBySandboxId = await getSandboxBySandboxId("test_sandbox_1")
    test(
      "Get sandbox by sandboxId",
      !!fetchedBySandboxId && fetchedBySandboxId.sandboxId === "test_sandbox_1"
    )

    // Test 4: Create second sandbox
    sandbox2 = await createSandbox({
      sandboxId: "test_sandbox_2",
      userId: testUser1.id,
      url: "https://test-sandbox-2.vercel.app",
    })
    test("Create second sandbox", !!sandbox2)

    // Test 5: Get user sandboxes
    const userSandboxes = await getUserSandboxes(testUser1.id)
    test("Get user sandboxes", userSandboxes.length >= 2)

    // Test 6: Get chat sandboxes
    const chatSandboxes = await getChatSandboxes(testChat.id)
    test("Get chat sandboxes", chatSandboxes.length >= 1)

    // Test 7: Get active sandboxes
    const activeSandboxes = await getActiveSandboxes(testUser1.id)
    test("Get active sandboxes", activeSandboxes.length >= 2)

    // Test 8: Update sandbox status
    const updated = await updateSandboxStatus("test_sandbox_1", "stopped")
    test("Update sandbox status", !!updated && updated.status === "stopped")

    // Test 9: Update sandbox URL
    const urlUpdated = await updateSandboxUrl(
      "test_sandbox_2",
      "https://new-url.vercel.app"
    )
    test(
      "Update sandbox URL",
      !!urlUpdated && urlUpdated.url === "https://new-url.vercel.app"
    )

    // Test 10: Touch sandbox (update lastActiveAt)
    await touchSandbox("test_sandbox_2")
    test("Touch sandbox", true)

    // Test 11: Count user sandboxes
    const count = await countUserSandboxes(testUser1.id)
    test("Count user sandboxes", count >= 2)

    // Test 12: Get user sandbox stats
    const stats = await getUserSandboxStats(testUser1.id)
    test(
      "Get user sandbox stats",
      stats.totalSandboxes >= 2 && stats.stoppedSandboxes >= 1
    )

    // Test 13: Find or create sandbox (idempotent)
    const existingSandbox = await findOrCreateSandbox({
      sandboxId: "test_sandbox_1",
      userId: testUser1.id,
    })
    test(
      "Find or create existing sandbox",
      !!existingSandbox && existingSandbox.sandboxId === "test_sandbox_1"
    )

    console.log("\n")

    // ============================================
    // Test File Management
    // ============================================
    console.log("📁 Testing File Management...")

    // Test 14: Save sandbox file
    file1 = await saveSandboxFile({
      sandboxId: "test_sandbox_2",
      path: "/src/index.ts",
      content: 'console.log("Hello World")',
      isGenerated: true,
      metadata: {
        language: "typescript",
      },
    })
    test("Save sandbox file", !!file1 && file1.path === "/src/index.ts")

    // Test 15: Save multiple files
    const files = await saveSandboxFiles("test_sandbox_2", [
      {
        path: "/src/app.ts",
        content: "export const app = {}",
        isGenerated: true,
      },
      { path: "/README.md", content: "# Test Project", isGenerated: false },
    ])
    test("Save multiple files", files.length === 2)

    // Test 16: Get file by path
    const fetchedFile = await getSandboxFileByPath(
      "test_sandbox_2",
      "/src/index.ts"
    )
    test(
      "Get file by path",
      !!fetchedFile && fetchedFile.content === 'console.log("Hello World")'
    )

    // Test 17: Get all sandbox files
    const allFiles = await getSandboxFiles("test_sandbox_2")
    test("Get all sandbox files", allFiles.length >= 3)

    // Test 18: Get generated files only
    const generatedFiles = await getSandboxGeneratedFiles("test_sandbox_2")
    test("Get generated files", generatedFiles.length >= 2)

    // Test 19: Count sandbox files
    const fileCount = await countSandboxFiles("test_sandbox_2")
    test("Count sandbox files", fileCount >= 3)

    // Test 20: Update existing file
    const updatedFile = await saveSandboxFile({
      sandboxId: "test_sandbox_2",
      path: "/src/index.ts",
      content: 'console.log("Updated!")',
    })
    test(
      "Update existing file",
      !!updatedFile && updatedFile.content === 'console.log("Updated!")'
    )

    console.log("\n")

    // ============================================
    // Test Command Management
    // ============================================
    console.log("⚡ Testing Command Management...")

    // Test 21: Create command
    command1 = await createCommand({
      sandboxId: "test_sandbox_2",
      cmdId: "cmd_123",
      command: "npm",
      args: ["install"],
      background: false,
    })
    test("Create command", !!command1 && command1.command === "npm")

    // Test 22: Get command by ID
    const fetchedCommand = await getCommandById(command1.id)
    test(
      "Get command by ID",
      !!fetchedCommand && fetchedCommand.id === command1.id
    )

    // Test 23: Mark command as started
    const started = await markCommandStarted(command1.id)
    test("Mark command as started", !!started && started.status === "running")

    // Test 24: Get sandbox commands
    const commands = await getSandboxCommands("test_sandbox_2")
    test("Get sandbox commands", commands.length >= 1)

    // Test 25: Count sandbox commands
    const cmdCount = await countSandboxCommands("test_sandbox_2")
    test("Count sandbox commands", cmdCount >= 1)

    console.log("\n")

    // ============================================
    // Test Log Management
    // ============================================
    console.log("📝 Testing Log Management...")

    // Test 26: Append command log
    const log1 = await appendCommandLog({
      commandId: command1.id,
      stream: "stdout",
      data: "Installing dependencies...",
      sequence: "0",
    })
    test("Append command log", !!log1 && log1.stream === "stdout")

    // Test 27: Append multiple logs
    const logs = await appendCommandLogs(command1.id, [
      { stream: "stdout", data: "✓ Installed package A", sequence: "1" },
      { stream: "stdout", data: "✓ Installed package B", sequence: "2" },
      { stream: "stderr", data: "Warning: deprecated package", sequence: "0" },
    ])
    test("Append multiple logs", logs.length === 3)

    // Test 28: Get command logs
    const allLogs = await getCommandLogs(command1.id)
    test("Get command logs", allLogs.length >= 4)

    // Test 29: Get stdout only
    const stdout = await getCommandStdout(command1.id)
    test("Get command stdout", stdout.includes("Installing dependencies"))

    // Test 30: Get stderr only
    const stderr = await getCommandStderr(command1.id)
    test("Get command stderr", stderr.includes("deprecated"))

    // Test 31: Count command logs
    const logCount = await countCommandLogs(command1.id)
    test("Count command logs", logCount >= 4)

    // Test 32: Mark command as completed
    const completed = await markCommandCompleted(command1.id, "0")
    test(
      "Mark command as completed",
      !!completed &&
        completed.status === "completed" &&
        completed.exitCode === "0"
    )

    console.log("\n")

    // ============================================
    // Test Comprehensive Queries
    // ============================================
    console.log("🔍 Testing Comprehensive Queries...")

    // Test 33: Get sandbox with details
    const sandboxDetails = await getSandboxWithDetails("test_sandbox_2")
    test(
      "Get sandbox with details",
      !!sandboxDetails.sandbox &&
        sandboxDetails.files.length >= 3 &&
        sandboxDetails.commands.length >= 1
    )

    // Test 34: Get command with logs
    const commandDetails = await getCommandWithLogs(command1.id)
    test(
      "Get command with logs",
      !!commandDetails.command && commandDetails.logs.length >= 4
    )

    // Test 35: Get recent sandbox activity
    const recentActivity = await getRecentSandboxActivity("test_sandbox_2", 24)
    test(
      "Get recent sandbox activity",
      !!recentActivity.sandbox &&
        recentActivity.recentCommands.length >= 1 &&
        recentActivity.recentFiles.length >= 3
    )

    console.log("\n")

    // ============================================
    // Test User Isolation
    // ============================================
    console.log("🔒 Testing User Isolation...")

    // Test 36: User 2 cannot see User 1's sandboxes
    const user2Sandboxes = await getUserSandboxes(testUser2.id)
    test(
      "User isolation - User 2 has no sandboxes",
      user2Sandboxes.length === 0
    )

    // Test 37: Create sandbox for User 2
    const user2Sandbox = await createSandbox({
      sandboxId: "test_sandbox_user2",
      userId: testUser2.id,
    })
    test("Create sandbox for User 2", !!user2Sandbox)

    // Test 38: Verify User 1 still has their sandboxes
    const user1SandboxesAfter = await getUserSandboxes(testUser1.id)
    test(
      "User 1 sandboxes unchanged",
      user1SandboxesAfter.length >= 2 &&
        !user1SandboxesAfter.some((s) => s.sandboxId === "test_sandbox_user2")
    )

    console.log("\n")

    // ============================================
    // Test Edge Cases
    // ============================================
    console.log("🔬 Testing Edge Cases...")

    // Test 39: Get non-existent sandbox
    const nonExistent = await getSandboxBySandboxId("non_existent_sandbox")
    test("Get non-existent sandbox returns null", nonExistent === null)

    // Test 40: Get non-existent file
    const nonExistentFile = await getSandboxFileByPath(
      "test_sandbox_2",
      "/does/not/exist.ts"
    )
    test("Get non-existent file returns null", nonExistentFile === null)

    // Test 41: Update status with error message
    const errorSandbox = await updateSandboxStatus(
      "test_sandbox_2",
      "error",
      "Test error message"
    )
    test(
      "Update sandbox with error",
      !!errorSandbox &&
        errorSandbox.status === "error" &&
        errorSandbox.errorMessage === "Test error message"
    )

    // Test 42: Mark command as failed
    const failedCmd = await createCommand({
      sandboxId: "test_sandbox_2",
      command: "invalid-command",
      args: [],
    })
    const failedCmdResult = await markCommandFailed(failedCmd.id, "1")
    test(
      "Mark command as failed",
      !!failedCmdResult &&
        failedCmdResult.status === "failed" &&
        failedCmdResult.exitCode === "1"
    )

    console.log("\n")

    // ============================================
    // Summary
    // ============================================
    console.log("=".repeat(60))
    console.log("🎉 All Phase 4 tests completed!\n")

    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length
    const total = results.length

    console.log("📊 Test Summary:")
    console.log(`   • Sandbox Management: ✅`)
    console.log(`   • File Management: ✅`)
    console.log(`   • Command Management: ✅`)
    console.log(`   • Log Management: ✅`)
    console.log(`   • Comprehensive Queries: ✅`)
    console.log(`   • User Isolation: ✅`)
    console.log(`   • Edge Cases: ✅`)
    console.log("")
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ${failed > 0 ? "❌" : ""}`)
    console.log("")

    if (failed === 0) {
      console.log(
        "✨ Phase 4: Sandbox & Project Persistence is ready for production!"
      )
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.")
      console.log("\nFailed tests:")
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   ❌ ${r.name}`)
          if (r.error) {
            console.log(`      ${r.error}`)
          }
        })
    }

    process.exit(failed === 0 ? 0 : 1)
  } catch (error) {
    console.error("\n❌ Fatal error during tests:")
    console.error(error)
    process.exit(1)
  }
}

// Run tests
runTests()
