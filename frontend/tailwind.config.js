/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b8dbff",
          300: "#7abfff",
          400: "#369dff",
          500: "#0b7deb",
          600: "#0062ca",
          700: "#004da3",
          800: "#004287",
          900: "#003770",
        },
      },
    },
  },
  plugins: [],
};
