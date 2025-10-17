import "../styles/style.css";   // ✅ use your real stylesheet name

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
