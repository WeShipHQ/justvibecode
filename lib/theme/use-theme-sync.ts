// "use client"

// import { defaultPresets } from "@/lib/theme/theme-presets"
// import { useEffect } from "react"

// export function useThemeSync() {
//   useEffect(() => {
//     // Apply saved theme on initial load
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
// }
