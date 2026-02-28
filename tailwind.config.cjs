/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      aspectRatio: {
        "324/48": "324 / 48",
        "400/48": "400 / 48",
      },
      maxWidth: {
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
        "3xl": "48rem",
        "4xl": "56rem",
        "5xl": "64rem",
        "6xl": "72rem",
        "7xl": "80rem",
        prose: "65ch",
      },
      lineHeight: {
        none: "1",
        8.25: "2.0625rem",
      },
    },
  },
  plugins: [],
};
