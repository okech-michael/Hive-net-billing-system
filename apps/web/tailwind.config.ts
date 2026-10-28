import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        honey: { 50: '#fff7e3', 100: '#fbe9bf', 500: '#d99a16', 700: '#94620a', 900: '#513700' },
        ink: '#29251e',
      },
      boxShadow: { card: '0 12px 35px rgba(67, 48, 12, 0.08)' },
    },
  },
  plugins: [],
};

export default config;
