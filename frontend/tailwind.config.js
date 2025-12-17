/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'imac-primary': '#D99B61',
                'imac-secondary': '#F3C78A',
                'imac-tertiary': '#B36B3C',
                'imac-background': '#FAFAF9',
                'imac-text': '#2B2B2B',
                'imac-success': '#2ECC71',
                'imac-error': '#E74C3C',
                'imac-highlight': '#FFD700',
            },
        },
    },
    plugins: [],
}
