import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151713",
        moss: "#28533f",
        citrus: "#f2c94c",
        coral: "#d95d39",
        pool: "#197d78",
        paper: "#f7f1e3",
        night: "#18201f",
        clay: "#b96b3c",
        linen: "#fffaf0",
        field: "#6c8b58"
      },
      boxShadow: {
        field: "0 18px 50px rgba(21, 23, 19, 0.12)",
        cut: "8px 8px 0 rgba(21, 23, 19, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
