import { hideBanner } from "@/app/actions"
import { Horizontal } from "@/components/layout/panels"
import { getHorizontal } from "@/components/layout/sizing"
import { Welcome } from "@/components/modals/welcome"
import { TabContent, TabItem } from "@/components/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  MenuIcon,
  MonitorIcon,
  PanelLeftIcon,
  PencilIcon,
  PlusIcon,
  RefreshCcwIcon,
  SmartphoneIcon,
  TerminalIcon,
  UploadIcon,
} from "lucide-react"
import { cookies } from "next/headers"
import { Chat } from "./chat"
import { Preview } from "./preview"

export default async function Page() {
  const store = await cookies()
  const banner = store.get("banner-hidden")?.value !== "true"
  const horizontalSizes = getHorizontal(store)

  return (
    <>
      <Welcome defaultOpen={banner} onDismissAction={hideBanner} />
      <main className="relative flex w-full flex-1 flex-col bg-sidebar h-screen">
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col">
            <div className="flex h-svh flex-col">
              {/* Top Navigation Bar */}
              <nav className="border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex h-11 flex-row items-center justify-between pr-2.5 pl-1 md:pl-2.5">
                  <div className="flex flex-row items-center gap-2 pl-1.5">
                    {/* Sidebar Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hidden md:block"
                    >
                      <PanelLeftIcon className="size-4" />
                      <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                    {/* Mobile Menu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 flex md:hidden"
                    >
                      <MenuIcon className="size-4 text-muted-foreground" />
                    </Button>
                    {/* Project Title */}
                    <div className="group flex max-w-52 cursor-pointer flex-row items-center gap-1.5 truncate whitespace-nowrap sm:max-w-sm text-sm font-medium">
                      <span>Single Letter Update</span>
                      <PencilIcon className="size-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    {/* Credits Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-3 min-w-18 rounded-full shadow-xs"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-3"
                      >
                        <path
                          d="m7.99 0-7.01 9.38 6.02-.42-4.96 7.04 12.96-10-7.01.47 7.01-6.47z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>19.4</span>
                    </Button>
                    {/* Buy Credits Button */}
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 rounded-full text-white border-none"
                      style={{
                        background:
                          "linear-gradient(110deg, rgb(142, 142, 242) -30%, rgb(44, 44, 238) 80%, rgb(13, 2, 87) 140%)",
                      }}
                    >
                      <PlusIcon className="size-4" />
                      <span>Buy Credits</span>
                    </Button>
                    {/* User Avatar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full p-0"
                    >
                      <div className="size-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-600" />
                    </Button>
                  </div>
                </div>
              </nav>

              {/* Desktop Main Content Area */}
              <div className="hidden min-h-0 flex-1 px-2.5 pb-2.5 md:block">
                <Horizontal
                  defaultLayout={horizontalSizes ?? [33, 67]}
                  left={<Chat className="flex-1 overflow-hidden" />}
                  right={
                    <div className="bg-background flex h-full flex-col divide-y overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                      {/* Preview Header */}
                      <div className="flex h-12 shrink-0 flex-row items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="pl-2 text-sm font-semibold">
                          <span>Preview</span>
                        </h2>
                        <div className="bg-border mx-1 h-4 w-px" />
                        <div className="flex gap-0.5">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 border border-border shadow-xs"
                          >
                            <MonitorIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 border-transparent"
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
                            <span>v1</span>
                            <ChevronDownIcon className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 gap-1.5 rounded-md shadow-xs"
                          >
                            <UploadIcon className="size-4" />
                            <span className="text-sm">Publish</span>
                          </Button>
                        </div>
                      </div>

                      {/* Preview Content */}
                      <div className="bg-background relative flex h-full min-h-0 w-full flex-1 flex-col">
                        {/* Preview Controls */}
                        <div className="bg-background flex shrink-0 flex-row items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-2 py-1.5">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hidden size-7 sm:block"
                              disabled
                            >
                              <ChevronLeftIcon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hidden size-7 sm:block"
                              disabled
                            >
                              <ChevronRightIcon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            >
                              <RefreshCcwIcon className="size-4" />
                            </Button>
                          </div>
                          <Input
                            className="h-8 w-full shadow-none"
                            placeholder="/"
                            defaultValue="/"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2.5 gap-1.5 rounded-md"
                          >
                            <span className="text-muted-foreground text-xs font-medium">
                              <span className="inline md:hidden">Dev</span>
                              <span className="hidden md:inline">
                                Dev Machine
                              </span>
                            </span>
                            <div className="size-2 rounded-full bg-green-500" />
                          </Button>
                        </div>

                        {/* Preview Iframe */}
                        <div className="flex-1">
                          <Preview className="h-full overflow-hidden" />
                        </div>

                        {/* Bottom Console Bar */}
                        <div className="bg-background flex h-8 items-center justify-between gap-1 border-t border-zinc-200 dark:border-zinc-800 px-2 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="relative flex h-6 items-center gap-2 px-2 text-xs font-medium"
                          >
                            <div className="relative">
                              <TerminalIcon className="size-3" />
                              <div className="absolute top-0 right-0 h-1 w-1 rounded-full bg-blue-500" />
                            </div>
                            <span>Console</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex h-6 items-center gap-2 px-2 text-xs font-medium"
                          >
                            <ChevronUpIcon className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Mobile View */}
              <div className="flex flex-1 flex-col md:hidden">
                <ul className="flex space-x-5 font-mono text-sm tracking-tight px-4 py-2 border-b">
                  <TabItem tabId="chat">Chat</TabItem>
                  <TabItem tabId="preview">Preview</TabItem>
                </ul>
                <div className="flex flex-1 w-full overflow-hidden">
                  <TabContent tabId="chat" className="flex-1">
                    <Chat className="flex-1 overflow-hidden" />
                  </TabContent>
                  <TabContent tabId="preview" className="flex-1">
                    <Preview className="h-full overflow-hidden" />
                  </TabContent>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
