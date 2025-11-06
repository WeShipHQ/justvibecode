import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatAddress = (addr: string, length: number = 4) =>
  `${addr.slice(0, length)}...${addr.slice(-length)}`

export function formatNumber(
  num: number | string,
  options: {
    locale?: string
    minDecimals?: number
    maxDecimals?: number
    useSuffixes?: boolean
  } = {}
): string {
  const {
    locale = "en-US",
    minDecimals = 0,
    maxDecimals = 2,
    useSuffixes = false,
  } = options

  num = Number(num)

  if (!isFinite(num) || isNaN(num)) return "N/A"

  if (useSuffixes) {
    if (num >= 1e9) {
      const value = num / 1e9
      return (
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals,
        }).format(value) + "B"
      )
    }
    if (num >= 1e6) {
      const value = num / 1e6
      return (
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals,
        }).format(value) + "M"
      )
    }
    if (num >= 1e3) {
      const value = num / 1e3
      return (
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals,
        }).format(value) + "K"
      )
    }
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num)
}
