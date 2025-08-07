/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#eb7641",
        grey: "#CACED8",
        light_purple: "#ECE1FF",
        greenown: "#17E098",
        orange: "#FC5924",
        green: "#06C698",
        red: "#FE0000",
        primary_dark:"#d36635",
        primary_extra_light:"#eb764133",
        'red-50': '#fef2f2',
        'red-100': '#fee2e2',
        'red-200': '#fecaca',
        'red-300': '#fca5a5',
        'red-400': '#f87171',
        'red-500': '#ef4444',
        'red-600': '#dc2626',
        'red-700': '#b91c1c',
        'red-800': '#991b1b',
        'red-900': '#7f1d1d',
        'red-950': '#450a0a'
      },
      backgroundImage: {
        foodbanner: "url('src/assets/images/foodbanner.png')",
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
