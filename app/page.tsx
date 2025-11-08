import { hideBanner } from "@/app/actions"
import { Horizontal } from "@/components/layout/panels"
import { getHorizontal } from "@/components/layout/sizing"
import { Welcome } from "@/components/modals/welcome"
import { TabContent, TabItem } from "@/components/tabs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cookies } from "next/headers"
import { Chat } from "./chat"
import { FileExplorer } from "./file-explorer"
import { Header } from "./header"
import { Logs } from "./logs"
import { Preview } from "./preview"

export default async function Page() {
  const store = await cookies()
  const banner = store.get("banner-hidden")?.value !== "true"
  const horizontalSizes = getHorizontal(store)

  return (
    <>
      <Welcome defaultOpen={banner} onDismissAction={hideBanner} />
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        <Header className="flex items-center w-full px-4 py-2 border-b" />

        {/* Mobile layout - simple tabs */}
        <ul className="flex space-x-5 font-mono text-sm tracking-tight px-4 py-2 md:hidden border-b">
          <TabItem tabId="chat">Chat</TabItem>
          <TabItem tabId="preview">Preview</TabItem>
          <TabItem tabId="code">Code</TabItem>
          <TabItem tabId="output">Output</TabItem>
        </ul>

        <div className="flex flex-1 w-full overflow-hidden md:hidden">
          <TabContent tabId="chat" className="flex-1">
            <Chat className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="preview" className="flex-1">
            <Preview className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="code" className="flex-1">
            <FileExplorer className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="output" className="flex-1">
            <Logs className="flex-1 overflow-hidden" />
          </TabContent>
        </div>

        {/* Desktop layout - v0.dev style: Chat left | Tabs right */}
        <div className="hidden flex-1 w-full min-h-0 overflow-hidden md:flex">
          <Horizontal
            defaultLayout={horizontalSizes ?? [45, 55]}
            left={<Chat className="flex-1 overflow-hidden" />}
            right={
              <div className="flex flex-col h-full w-full overflow-hidden border-l">
                <Tabs
                  defaultValue="preview"
                  className="flex flex-col h-full w-full"
                >
                  <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-11 px-2 gap-1">
                    <TabsTrigger
                      value="code"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-mono text-xs rounded-md px-3 py-1.5 transition-all"
                    >
                      Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-mono text-xs rounded-md px-3 py-1.5 transition-all"
                    >
                      Preview
                    </TabsTrigger>
                    <TabsTrigger
                      value="output"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-mono text-xs rounded-md px-3 py-1.5 transition-all"
                    >
                      Output
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="code"
                    className="flex-1 m-0 overflow-hidden"
                  >
                    <FileExplorer className="h-full overflow-hidden" />
                  </TabsContent>

                  <TabsContent
                    value="preview"
                    className="flex-1 m-0 overflow-hidden"
                  >
                    <Preview className="h-full overflow-hidden" />
                  </TabsContent>

                  <TabsContent
                    value="output"
                    className="flex-1 m-0 overflow-hidden"
                  >
                    <Logs className="h-full overflow-hidden" />
                  </TabsContent>
                </Tabs>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}
