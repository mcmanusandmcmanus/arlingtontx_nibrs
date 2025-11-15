/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e0f2ff",
          100: "#b9e1ff",
          200: "#8bcfff",
          300: "#5ebdff",
          400: "#33a9ff",
          500: "#148fe6",
          600: "#0e6fb3",
          700: "#094f80",
          800: "#04304e",
          900: "#011726",
        },
        slate: {
          950: "#06090f",
        },
        accent: {
          DEFAULT: "#f59f00",
          dark: "#d97706",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px rgba(2,18,32,0.12)",
      },
    },
  },
  plugins: [],
};
