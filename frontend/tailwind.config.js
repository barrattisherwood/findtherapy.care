/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary: Sage Green (#78866b)
        primary: {
          50: '#f4f5f3',
          100: '#e8ebe5',
          200: '#d1d7cb',
          300: '#b3bda8',
          400: '#95a385',
          500: '#78866b',
          600: '#5f6b54',
          700: '#4b5443',
          800: '#3d4437',
          900: '#33392f',
        },
        // Secondary: Dusty Blue (#6b7886)
        secondary: {
          50: '#f3f4f5',
          100: '#e5e8eb',
          200: '#cbd1d7',
          300: '#a8b3bd',
          400: '#8595a3',
          500: '#6b7886',
          600: '#545f6b',
          700: '#434b54',
          800: '#373d44',
          900: '#2f3339',
        },
        // Accent: Mauve (#866b78)
        accent: {
          50: '#f5f3f4',
          100: '#ebe5e8',
          200: '#d7cbd1',
          300: '#bda8b3',
          400: '#a38595',
          500: '#866b78',
          600: '#6b545f',
          700: '#54434b',
          800: '#44373d',
          900: '#392f33',
        },
        // Feedback colors
        success: {
          50: '#f0fff4',
          100: '#c6f6d5',
          500: '#48bb78',
          600: '#38a169',
          700: '#2f855a',
        },
        error: {
          50: '#fff5f5',
          100: '#fed7d7',
          500: '#f56565',
          600: '#e53e3e',
          700: '#c53030',
        },
        warning: {
          50: '#fffaf0',
          100: '#feebc8',
          500: '#ed8936',
          600: '#dd6b20',
          700: '#c05621',
        },
        info: {
          50: '#ebf8ff',
          100: '#bee3f8',
          500: '#4299e1',
          600: '#3182ce',
          700: '#2b6cb0',
        },
      },
    },
  },
  plugins: [],
}
