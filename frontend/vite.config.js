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
                    black: '#090909',
                    darkgrey: '#1a1a1a',
                    red: '#C41E3A', // Vivid Akatsuki red
                    cloudgrey: '#b0b0b0'
                }
            },
            fontFamily: {
                'ninja': ['Verdana', 'sans-serif'] // A slightly sharp font
            }
        },
    },
    plugins: [],
}