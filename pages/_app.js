import '../styles/globals.css'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(r => setSession(r.data?.session || null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  return (
    <>
      <Head>
        <title>REGALADO</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} session={session} />
    </>
  )
}

export default MyApp
