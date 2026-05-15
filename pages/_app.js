import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CalVirage" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
