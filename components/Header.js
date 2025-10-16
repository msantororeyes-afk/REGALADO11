import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Header({ session }){
  async function signOut(){
    await supabase.auth.signOut()
    location.reload()
  }

  return (
    <header className="header">
      <div className="container">
        <Link href="/"><a className="logo">REGALADO</a></Link>
        <nav>
          <Link href="/?sort=new"><a>New</a></Link>
          <Link href="/?sort=top"><a>Top</a></Link>
          <Link href="/submit"><a>Submit</a></Link>
        </nav>
        <div className="auth">
          {session?.user ? (
            <>
              <Link href="/profile"><a>Profile</a></Link>
              <button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link href="/api/auth"><a>Sign in</a></Link>
          )}
        </div>
      </div>
    </header>
  )
}
