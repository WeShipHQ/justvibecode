"use client"

import { useAuth } from "@/providers/auth-provider"
import {
  usePrivy,
  type PrivyInterface,
  type WalletWithMetadata,
} from "@privy-io/react-auth"
import { useConnectedStandardWallets } from "@privy-io/react-auth/solana"
import { address, TransactionSigner } from "@solana/kit"
import { useMemo } from "react"

export function useWallet() {
  const { user: privyUser, ...rest } = usePrivy()
  const { wallets } = useConnectedStandardWallets()
  const { user: dbUser, sessionToken } = useAuth()

  const embeddedWallet = useMemo(() => {
    const linkedAccount = privyUser?.linkedAccounts?.find(
      (account: any) =>
        (account as WalletWithMetadata).chainType === "solana" &&
        (account as WalletWithMetadata).connectorType === "embedded"
    ) as WalletWithMetadata | undefined

    return linkedAccount
  }, [privyUser, wallets])

  // Priority: Use embedded wallet first, then external wallet
  const activeWallet = embeddedWallet || wallets?.[0]

  return {
    wallet: activeWallet,
    signer: activeWallet
      ? ({ address: address(activeWallet.address) } as TransactionSigner)
      : undefined,
    user: privyUser,
    // Database user data (includes persistent user info)
    dbUser,
    // Session token for authenticated requests
    sessionToken,
    ...rest,
  } as PrivyInterface & {
    wallet: WalletWithMetadata | undefined
    signer?: TransactionSigner
    dbUser: typeof dbUser
    sessionToken: typeof sessionToken
  }
}
