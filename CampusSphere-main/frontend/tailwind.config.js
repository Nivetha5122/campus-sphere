export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#05010b",
        primary: "#0b0620",
        surface: "#1a0530",
        accent: "#C084FC",
        soft: "#9F7AEA",
        highlight: "#E9D5FF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 24px rgba(192,132,252,0.20)",
        card: "0 8px 32px rgba(6,2,23,0.6)",
      },
    },
  },
  plugins: [],
};
