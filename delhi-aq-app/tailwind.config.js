/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: "#F8F7F4",
        ink: "#111111",
        stone: {
          muted: "#6E6D68",
          light: "#E5E4DE",
          faint: "#EFEFEA",
        },
        vermilion: "#E13C2A",
        forest: "#15803D",
        // PM2.5 reference bands (for clean data reference)
        pm: {
          good: "#15803D",
          satisfactory: "#4D7C0F",
          moderate: "#B45309",
          poor: "#C2410C",
          verypoor: "#E13C2A",
          severe: "#7F1D1D",
        }
      },
      borderWidth: {
        hairline: '1px',
      }
    },
  },
  plugins: [],
}
