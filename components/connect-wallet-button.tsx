"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutIcon, WalletIcon } from "@/components/ui/icons"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useWallet } from "@/hooks/use-wallet"
import { formatAddress } from "@/lib/utils"
import { useLogin, useLogout } from "@privy-io/react-auth"
import { CheckIcon, CopyIcon } from "lucide-react"
import { BalanceButton } from "./balance-button"

function WalletAddressWithCopy({
  address,
  label,
}: {
  address: string
  label: string
}) {
  const [copyToClipboard, isCopied] = useCopyToClipboard()

  return (
    <div className="px-2 py-1.5 text-xs text-primary border-b">
      <div className="font-medium text-primary">{label}</div>
      <div className="flex items-center gap-2">
        <div className="font-mono text-xs flex-1">{formatAddress(address)}</div>
        <div
          className="cursor-pointer hover:bg-gray-100 p-1 rounded"
          onClick={() => copyToClipboard(address)}
          title="Copy address"
        >
          {isCopied ? (
            <CheckIcon className="h-3 w-3 text-green-600" />
          ) : (
            <CopyIcon className="h-3 w-3 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}

export function ConnectWalletButton() {
  const { ready, authenticated, user, wallet } = useWallet()
  const { login } = useLogin()
  const { logout } = useLogout()

  const disableLogin = !ready || (ready && authenticated)

  return (
    <div className="flex items-center gap-2">
      {authenticated ? (
        <>
          {wallet && <BalanceButton walletAddress={wallet.address} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Avatar
                  walletAddress={wallet?.address || user?.wallet?.address || ""}
                  size="xs"
                >
                  <AvatarImage
                    walletAddress={
                      wallet?.address || user?.wallet?.address || ""
                    }
                  />
                  <AvatarFallback
                    walletAddress={
                      wallet?.address || user?.wallet?.address || ""
                    }
                  />
                </Avatar>
                {wallet
                  ? formatAddress(wallet.address)
                  : user?.wallet?.address
                    ? formatAddress(user?.wallet?.address)
                    : "--"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={12}
              className="w-64"
              align="end"
              side="bottom"
            >
              {/* Connected Wallet Info */}
              {user?.wallet?.address && (
                <WalletAddressWithCopy
                  address={user.wallet.address}
                  label="Connected Wallet"
                />
              )}

              {/* Embedded Wallet Info */}
              {wallet && (
                <WalletAddressWithCopy
                  address={wallet.address}
                  label="Embedded Wallet"
                />
              )}

              {/* Actions */}
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex justify-between"
              >
                <span>Disconnect</span>
                <LogoutIcon />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Button disabled={disableLogin} onClick={() => login()}>
          <WalletIcon />
          Connect Wallet
        </Button>
      )}
    </div>
  )
}
