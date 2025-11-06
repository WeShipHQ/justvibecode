import { LogOut, Wallet } from "lucide-react"

export function WalletIcon({ className }: { className?: string }) {
  return <Wallet className={className} />
}

export function LogoutIcon({ className }: { className?: string }) {
  return <LogOut className={className} />
}
