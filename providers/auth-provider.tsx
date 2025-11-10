"use client"

import type { User } from "@/lib/db/schema"
import { usePrivy, useWallets, WalletWithMetadata } from "@privy-io/react-auth"
import React, { createContext, useContext, useEffect, useState } from "react"

/**
 * Auth Context - Manages user authentication state with database persistence
 */

interface AuthContextType {
  // User data from database
  user: User | null
  // Session token
  sessionToken: string | null
  // Loading states
  isLoading: boolean
  isAuthenticating: boolean
  // Auth methods
  login: () => Promise<void>
  logout: () => Promise<void>
  // Refresh user data
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    ready,
    authenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
  } = usePrivy()
  const { wallets } = useWallets()

  const [user, setUser] = useState<User | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Get active wallet
  // const activeWallet =
  //   wallets.find((w) => w.walletClientType !== "privy") || wallets[0]

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem("session_token")
      if (storedToken) {
        try {
          // Validate session with backend
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: storedToken }),
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setSessionToken(storedToken)
          } else {
            // Session invalid, clear it
            localStorage.removeItem("session_token")
          }
        } catch (error) {
          console.error("Failed to validate session:", error)
          localStorage.removeItem("session_token")
        }
      }
      setIsLoading(false)
    }

    if (ready) {
      loadSession()
    }
  }, [ready])

  // Authenticate with database when Privy user is authenticated
  useEffect(() => {
    const authenticateWithDatabase = async () => {
      const account = privyUser?.linkedAccounts.at(0)
      console.log(
        "Authenticating with database...",
        privyUser,
        authenticated,
        account
      )
      if (!authenticated || !privyUser || !account) return
      if (user && sessionToken) return // Already authenticated

      setIsAuthenticating(true)
      try {
        const walletAddress = (account as WalletWithMetadata).address
        const walletType = getWalletType(
          (account as WalletWithMetadata).walletClientType!
        )

        // Call login API
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            walletType,
            privyUserId: privyUser.id,
            email: privyUser.email?.address,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to authenticate with database")
        }

        const data = await response.json()
        setUser(data.user)
        setSessionToken(data.sessionToken)

        // Store session token in localStorage
        localStorage.setItem("session_token", data.sessionToken)
      } catch (error) {
        console.error("Database authentication error:", error)
      } finally {
        setIsAuthenticating(false)
      }
    }

    authenticateWithDatabase()
  }, [authenticated, privyUser, user, sessionToken])

  // Login function
  const login = async () => {
    setIsAuthenticating(true)
    try {
      await privyLogin()
    } catch (error) {
      console.error("Login error:", error)
      setIsAuthenticating(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Logout from database
      if (sessionToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        })
      }

      // Clear local state
      setUser(null)
      setSessionToken(null)
      localStorage.removeItem("session_token")

      // Logout from Privy
      await privyLogout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    if (!sessionToken) return

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  const value: AuthContextType = {
    user,
    sessionToken,
    isLoading: !ready || isLoading,
    isAuthenticating,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Helper to map wallet client type to our enum
function getWalletType(
  clientType: string
): "embedded" | "phantom" | "solflare" | "backpack" | "other" {
  switch (clientType) {
    case "privy":
      return "embedded"
    case "phantom":
      return "phantom"
    case "solflare":
      return "solflare"
    case "backpack":
      return "backpack"
    default:
      return "other"
  }
}
