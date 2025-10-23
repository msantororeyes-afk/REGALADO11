import "../styles/globals.css";  // ✅ use your real stylesheet name
import Navbar from "../components/Navbar";  // ✅ added this line

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />  {/* ✅ persistent dropdown navigation */}
      <Component {...pageProps} />
    </>
  );
}
