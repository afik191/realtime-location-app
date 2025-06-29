/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
         primary: "#0D9488",       // טורקיז כהה
        primaryLight: "#14B8A6",  // טורקיז בהיר
        background: "#F0FAF9",    // רקע בהיר ירקרק
        surface: "#FFFFFF",       // לבן לנראות טפסים וכו'
        textPrimary: "#134E4A",   // טקסט כהה
      },
    },
  },
  plugins: [],
};
