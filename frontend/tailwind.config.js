/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                akatsuki: {
                    black: '#090909',      // Deepest black for background
                    darkgrey: '#1a1a1a',   // Card background
                    red: '#C41E3A',        // The vivid Akatsuki cloud red
                    cloudgrey: '#b0b0b0'   // Outline color
                }
            },
            fontFamily: {
                'ninja': ['Verdana', 'sans-serif'] // Sharp, clean font suitable for technical monitoring
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}