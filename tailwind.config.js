/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        bg: "#08090B",
        surface: "#101216",
        surface2: "#171A21",

        border: "#262A33",

        text: "#F5F7FA",
        muted: "#9EA6B4",
        muted2: "#6D7482",

        accent: "#5B8CFF",
        accent2: "#7AA5FF",

        success: "#46D48D",
      },

      fontFamily: {
        sans: [
          "Inter",
          "sans-serif",
        ],

        display: [
          "General Sans",
          "Inter",
          "sans-serif",
        ],
      },

      borderRadius: {
        xl2: "20px",
        xl3: "28px",
      },

      boxShadow: {
        glow: "0 0 80px rgba(91,140,255,.18)",

        card: "0 12px 40px rgba(0,0,0,.28)",

        soft: "0 25px 80px rgba(0,0,0,.35)",
      },

      backdropBlur: {
        xs: "2px",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(.22,1,.36,1)",
      },

      keyframes: {
        float: {
          "0%,100%": {
            transform: "translateY(0px)",
          },

          "50%": {
            transform: "translateY(-10px)",
          },
        },

        pulseGlow: {
          "0%,100%": {
            boxShadow: "0 0 0 rgba(91,140,255,.15)",
          },

          "50%": {
            boxShadow: "0 0 60px rgba(91,140,255,.35)",
          },
        },

        fadeUp: {
          from: {
            opacity: "0",
            transform: "translateY(30px)",
          },

          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        gridMove: {
          from: {
            backgroundPosition: "0 0",
          },

          to: {
            backgroundPosition: "40px 40px",
          },
        },
      },

      animation: {
        float: "float 8s ease-in-out infinite",

        glow: "pulseGlow 3s ease-in-out infinite",

        fade: "fadeUp .8s ease forwards",

        grid: "gridMove 18s linear infinite",
      },
    },
  },

  plugins: [],
}