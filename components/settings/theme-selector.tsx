// "use client"

// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { defaultPresets } from "@/lib/theme/theme-presets"
// import { PaletteIcon } from "lucide-react"
// import { useEffect, useState } from "react"

// export function ThemeSelector() {
//   const [selectedTheme, setSelectedTheme] = useState<string>("neobrutalism")

//   useEffect(() => {
//     // Load theme from localStorage on mount
//     const savedTheme = localStorage.getItem("selected-theme")
//     if (savedTheme && defaultPresets[savedTheme]) {
//       setSelectedTheme(savedTheme)
//       applyTheme(savedTheme)
//     }
//   }, [])

//   const applyTheme = (themeKey: string) => {
//     const theme = defaultPresets[themeKey]
//     if (!theme) return

//     const root = document.documentElement
//     const isDark = root.classList.contains("dark")
//     const styles = isDark ? theme.styles.dark : theme.styles.light

//     // Apply all CSS variables
//     Object.entries(styles).forEach(([key, value]) => {
//       root.style.setProperty(`--${key}`, value)
//     })

//     // Save to localStorage
//     localStorage.setItem("selected-theme", themeKey)
//   }

//   const handleThemeChange = (themeKey: string) => {
//     setSelectedTheme(themeKey)
//     applyTheme(themeKey)
//   }

//   // Listen to dark mode changes to reapply theme
//   useEffect(() => {
//     const observer = new MutationObserver((mutations) => {
//       mutations.forEach((mutation) => {
//         if (
//           mutation.type === "attributes" &&
//           mutation.attributeName === "class"
//         ) {
//           applyTheme(selectedTheme)
//         }
//       })
//     })

//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class"],
//     })

//     return () => observer.disconnect()
//   }, [selectedTheme])

//   const ThemePreview = ({ themeKey }: { themeKey: string }) => {
//     const theme = defaultPresets[themeKey]
//     const isDark =
//       typeof window !== "undefined" &&
//       document.documentElement.classList.contains("dark")
//     const styles = isDark ? theme.styles.dark : theme.styles.light

//     return (
//       <div className="flex gap-1 items-center">
//         <div className="flex gap-0.5">
//           <div
//             className="w-3 h-3 rounded-sm border border-border/20"
//             style={{ backgroundColor: styles.primary }}
//           />
//           <div
//             className="w-3 h-3 rounded-sm border border-border/20"
//             style={{ backgroundColor: styles.secondary }}
//           />
//           <div
//             className="w-3 h-3 rounded-sm border border-border/20"
//             style={{ backgroundColor: styles.accent }}
//           />
//         </div>
//         <span>{theme.label}</span>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="theme-select" className="flex items-center gap-2">
//         <PaletteIcon className="w-4 h-4" />
//         Theme
//       </Label>
//       <Select value={selectedTheme} onValueChange={handleThemeChange}>
//         <SelectTrigger id="theme-select">
//           <SelectValue placeholder="Select a theme" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectGroup>
//             <SelectLabel>Available Themes</SelectLabel>
//             {Object.entries(defaultPresets).map(([key, preset]) => (
//               <SelectItem key={key} value={key}>
//                 <ThemePreview themeKey={key} />
//               </SelectItem>
//             ))}
//           </SelectGroup>
//         </SelectContent>
//       </Select>
//       <p className="text-xs text-muted-foreground">
//         Choose a color theme for the interface. Changes apply instantly.
//       </p>
//     </div>
//   )
// }
