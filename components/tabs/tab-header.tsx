"use client"

import { Button } from "@/components/ui/button"
import {
  ChevronDownIcon,
  MonitorIcon,
  SmartphoneIcon,
  UploadIcon,
} from "lucide-react"
import { useState } from "react"

interface TabHeaderProps {
  title: string
  version?: string
  onPublish?: () => void
}

export function TabHeader({
  title,
  version = "v1",
  onPublish,
}: TabHeaderProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  return (
    <div className="flex h-12 shrink-0 flex-row items-center gap-1 p-2 border-b">
      <h2 className="pl-2 text-sm font-semibold">
        <span>{title}</span>
      </h2>
      <div className="bg-border mx-1 h-4 w-px" />
      <div className="flex gap-0.5">
        <Button
          variant={viewMode === "desktop" ? "secondary" : "ghost"}
          size="icon"
          className="size-7 border border-border"
          onClick={() => setViewMode("desktop")}
          aria-label="Desktop view"
        >
          <MonitorIcon className="size-4" />
        </Button>
        <Button
          variant={viewMode === "mobile" ? "secondary" : "ghost"}
          size="icon"
          className="size-7 border-transparent"
          onClick={() => setViewMode("mobile")}
          aria-label="Mobile view"
        >
          <SmartphoneIcon className="size-4" />
        </Button>
      </div>
      <div className="ml-auto flex flex-row items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 gap-1.5 font-mono rounded-md shadow-xs"
        >
          <span>{version}</span>
          <ChevronDownIcon className="size-4" />
        </Button>
        <Button
          size="sm"
          className="h-7 px-2.5 gap-1.5 rounded-md shadow-xs"
          onClick={onPublish}
        >
          <UploadIcon className="size-4" />
          <span className="text-sm">Publish</span>
        </Button>
      </div>
    </div>
  )
}
