// File: pages/_app.tsx
import { AppProps } from 'next/app';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the Font Awesome styles
import '../styles/globals.css'; // Your global styles

// Prevent Font Awesome from adding its CSS automatically since we are importing it manually
config.autoAddCss = false;

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
