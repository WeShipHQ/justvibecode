// "use client"

// import { useEffect } from "react"
// import { defaultPresets } from "./theme-presets"

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("selected-theme") || "neobrutalism"
//     const theme = defaultPresets[savedTheme]

//     if (theme) {
//       const root = document.documentElement
//       const isDark = root.classList.contains("dark")
//       const styles = isDark ? theme.styles.dark : theme.styles.light

//       Object.entries(styles).forEach(([key, value]) => {
//         root.style.setProperty(`--${key}`, value)
//       })
//     }
//   }, [])

//   return <>{children}</>
// }
