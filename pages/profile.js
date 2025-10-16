import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

export default function Profile({session}){
  const [user, setUser] = useState(null)
  const [myDeals, setMyDeals] = useState([])

  useEffect(()=>{
    async function load(){
      const u = (await supabase.auth.getUser()).data.user
      setUser(u)
      if(u){
        const { data } = await supabase.from('deals').select('*').eq('posted_by', u.id)
        setMyDeals(data)
      }
    }
    load()
  },[])

  return (
    <div>
      <Header session={session} />
      <main className="container">
        <h1>Profile</h1>
        {user ? (
          <div>
            <p>{user.email}</p>
            <h3>My Deals</h3>
            {myDeals.map(d=> <div key={d.id}>{d.title}</div>)}
          </div>
        ) : <p>Please sign in</p>}
      </main>
    </div>
  )
}
