import { useTheme } from "next-themes"
import type { CSSProperties } from "react"
import { Prism as SyntaxHighlighterComponent } from "react-syntax-highlighter"

// Light theme - soft pastel colors
const lightTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: "hsl(var(--foreground))",
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.5",
    direction: "ltr" as const,
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 4,
    hyphens: "none" as const,
  },
  'pre[class*="language-"]': {
    color: "hsl(var(--foreground))",
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.5",
    direction: "ltr" as const,
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 4,
    hyphens: "none" as const,
    padding: "1rem",
    margin: "0",
    overflow: "auto",
    background: "hsl(var(--card))",
  },
  comment: {
    color: "hsl(var(--muted-foreground))",
    fontStyle: "italic",
  },
  prolog: {
    color: "hsl(var(--muted-foreground))",
  },
  doctype: {
    color: "hsl(var(--muted-foreground))",
  },
  cdata: {
    color: "hsl(var(--muted-foreground))",
  },
  punctuation: {
    color: "hsl(var(--foreground) / 0.6)",
  },
  property: {
    color: "#7dd3fc", // Light sky blue
  },
  tag: {
    color: "#fb7185", // Soft pink
  },
  boolean: {
    color: "#a78bfa", // Soft purple
  },
  number: {
    color: "#fb923c", // Soft orange
  },
  constant: {
    color: "#7dd3fc", // Light blue
  },
  symbol: {
    color: "#7dd3fc", // Light blue
  },
  deleted: {
    color: "#fca5a5", // Soft red
  },
  selector: {
    color: "#a3e635", // Soft lime
  },
  "attr-name": {
    color: "#fbbf24", // Soft amber
  },
  string: {
    color: "#86efac", // Soft green
  },
  char: {
    color: "#86efac", // Soft green
  },
  builtin: {
    color: "#67e8f9", // Soft cyan
  },
  inserted: {
    color: "#86efac", // Soft green
  },
  operator: {
    color: "#67e8f9", // Soft cyan
  },
  entity: {
    color: "#fdba74", // Soft orange
    cursor: "help",
  },
  url: {
    color: "#67e8f9", // Soft cyan
  },
  ".language-css .token.string": {
    color: "#86efac", // Soft green
  },
  ".style .token.string": {
    color: "#86efac", // Soft green
  },
  variable: {
    color: "#7dd3fc", // Light blue
  },
  atrule: {
    color: "#c4b5fd", // Soft purple
  },
  "attr-value": {
    color: "#86efac", // Soft green
  },
  function: {
    color: "#93c5fd", // Soft blue
  },
  "class-name": {
    color: "#fcd34d", // Soft yellow
  },
  keyword: {
    color: "#f472b6", // Soft pink
  },
  regex: {
    color: "#fca5a5", // Soft red
  },
  important: {
    color: "#fb7185", // Soft pink
    fontWeight: "bold",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
}

// Dark theme - vibrant colors like v0.dev
const darkTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: "#e5e7eb",
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.5",
    direction: "ltr" as const,
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 4,
    hyphens: "none" as const,
  },
  'pre[class*="language-"]': {
    color: "#e5e7eb",
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.5",
    direction: "ltr" as const,
    textAlign: "left" as const,
    whiteSpace: "pre" as const,
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 4,
    hyphens: "none" as const,
    padding: "1rem",
    margin: "0",
    overflow: "auto",
    background: "#0a0a0a",
  },
  comment: {
    color: "#6b7280",
    fontStyle: "italic",
  },
  prolog: {
    color: "#6b7280",
  },
  doctype: {
    color: "#6b7280",
  },
  cdata: {
    color: "#6b7280",
  },
  punctuation: {
    color: "#9ca3af",
  },
  property: {
    color: "#38bdf8", // Sky blue
  },
  tag: {
    color: "#f472b6", // Pink
  },
  boolean: {
    color: "#a78bfa", // Purple
  },
  number: {
    color: "#fb923c", // Orange
  },
  constant: {
    color: "#38bdf8", // Sky blue
  },
  symbol: {
    color: "#38bdf8", // Sky blue
  },
  deleted: {
    color: "#ef4444", // Red
  },
  selector: {
    color: "#84cc16", // Lime
  },
  "attr-name": {
    color: "#fbbf24", // Amber
  },
  string: {
    color: "#4ade80", // Green
  },
  char: {
    color: "#4ade80", // Green
  },
  builtin: {
    color: "#06b6d4", // Cyan
  },
  inserted: {
    color: "#4ade80", // Green
  },
  operator: {
    color: "#22d3ee", // Cyan
  },
  entity: {
    color: "#fb923c", // Orange
    cursor: "help",
  },
  url: {
    color: "#22d3ee", // Cyan
  },
  ".language-css .token.string": {
    color: "#4ade80", // Green
  },
  ".style .token.string": {
    color: "#4ade80", // Green
  },
  variable: {
    color: "#38bdf8", // Sky blue
  },
  atrule: {
    color: "#a78bfa", // Purple
  },
  "attr-value": {
    color: "#4ade80", // Green
  },
  function: {
    color: "#60a5fa", // Blue
  },
  "class-name": {
    color: "#fbbf24", // Amber
  },
  keyword: {
    color: "#ec4899", // Pink
  },
  regex: {
    color: "#f87171", // Red
  },
  important: {
    color: "#f472b6", // Pink
    fontWeight: "bold",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
}

export function SyntaxHighlighter(props: { path: string; code: string }) {
  const { theme } = useTheme()
  const currentTheme = theme === "dark" ? darkTheme : lightTheme
  const lang = detectLanguageFromFilename(props.path)
  return (
    <SyntaxHighlighterComponent
      language={lang ?? "javascript"}
      style={currentTheme}
      showLineNumbers
      showInlineLineNumbers
      customStyle={{
        fontSize: "0.8125rem",
        margin: 0,
        background: theme === "dark" ? "#0a0a0a" : "hsl(var(--card))",
        padding: "1rem",
        lineHeight: "1.5",
      }}
      codeTagProps={{
        style: {
          fontFamily: "var(--font-mono)",
          whiteSpace: "pre",
          overflowX: "auto",
        },
      }}
      lineNumberStyle={{
        minWidth: "3em",
        paddingRight: "1em",
        color: theme === "dark" ? "#6b7280" : "hsl(var(--muted-foreground))",
        textAlign: "right",
        userSelect: "none",
      }}
    >
      {props.code}
    </SyntaxHighlighterComponent>
  )
}

function detectLanguageFromFilename(path: string): string {
  const pathParts = path.split("/")
  const extension = pathParts[pathParts.length - 1]
    ?.split(".")
    .pop()
    ?.toLowerCase()

  const extensionMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "jsx",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",

    // Python
    py: "python",
    pyw: "python",
    pyi: "python",

    // Web technologies
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",

    // Other popular languages
    java: "java",
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",

    // Data formats
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    ini: "ini",

    // Markup
    md: "markdown",
    markdown: "markdown",
    tex: "latex",

    // Database
    sql: "sql",

    // Config files
    dockerfile: "dockerfile",
    gitignore: "bash",
    env: "bash",
  }

  return extensionMap[extension || ""] || "text"
}
