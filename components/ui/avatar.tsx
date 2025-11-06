"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar"
import * as React from "react"

import { cn } from "@/lib/utils"

const sizeClasses: Record<string, string> = {
  xs: "size-6",
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
}

function Avatar({
  className,
  walletAddress,
  size = "md",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  walletAddress?: string
  size?: "xs" | "sm" | "md" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size] || "size-8",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  walletAddress,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & {
  walletAddress?: string
}) {
  const src = walletAddress
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
    : props.src

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={src}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  walletAddress,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  walletAddress?: string
}) {
  const fallbackText = walletAddress
    ? walletAddress.slice(0, 2).toUpperCase()
    : children

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {fallbackText || children}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarFallback, AvatarImage }
