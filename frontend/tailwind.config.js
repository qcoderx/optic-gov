/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        "primary-dark": "#059669",
        "primary-green": "#13ec5b",
        "primary-green-hover": "#0fc24a",
        "background-light": "#f6f7f8",
        "background-dark": "#0b0c10",
        "register-bg": "#102216",
        "card-dark": "#15181e",
        "register-card": "#1c271f",
        "border-dark": "#252a33",
        "input-border": "#3b5443",
        "text-secondary": "#9ca3af",
        "register-text": "#9db9a6",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'primary': '0 0 15px rgba(16, 185, 129, 0.3)',
        'primary-lg': '0 0 25px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}