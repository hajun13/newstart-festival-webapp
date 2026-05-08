import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151713",
        moss: "#31523b",
        citrus: "#f4c84a",
        coral: "#e85f43",
        pool: "#3da6a0",
        paper: "#fffaf0"
      },
      boxShadow: {
        field: "0 18px 50px rgba(21, 23, 19, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
