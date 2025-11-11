"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SlidersVerticalIcon } from "lucide-react"
import { AutoFixErrors } from "./auto-fix-errors"
import { ReasoningEffort } from "./reasoning-effort"
// import { ThemeSelector } from "./theme-selector"

export function Settings() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="cursor-pointer" variant="outline" size="sm">
          <SlidersVerticalIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96">
        <div className="p-4 space-y-6">
          <div className="pb-3 border-b">
            <h3 className="font-semibold text-sm mb-1">Settings</h3>
            <p className="text-xs text-muted-foreground">
              Customize your coding experience
            </p>
          </div>
          {/* <ThemeSelector /> */}
          <AutoFixErrors />
          <ReasoningEffort />
        </div>
      </PopoverContent>
    </Popover>
  )
}
