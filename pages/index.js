import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DealCard from '../components/DealCard'
import Header from '../components/Header'

export default function Home({session}){
  const [deals, setDeals] = useState([])
  const [sort, setSort] = useState('top')

  useEffect(()=>{
    async function load(){
      const order = sort === 'new' ? {column: 'created_at', ascending: false} : {column: 'votes', ascending: false}
      const { data, error } = await supabase.from('deals').select('*').order(order.column,{ascending: order.ascending}).limit(50)
      if(error) return console.error(error)
      setDeals(data)
    }
    load()
  },[sort])

  return (
    <div>
      <Header session={session} />
      <main className="container">
        <aside className="sidebar">
          <h3>Categories</h3>
          <ul>
            <li><a href="/?category=Tech & Electronics">Tech & Electronics</a></li>
            <li><a href="/?category=Fashion">Fashion</a></li>
            <li><a href="/?category=Housing">Housing</a></li>
            <li><a href="/?category=Groceries">Groceries</a></li>
            <li><a href="/?category=Travel">Travel</a></li>
          </ul>
        </aside>
        <section className="deals-list">
          <div className="controls">
            <button onClick={()=>setSort('top')}>Top</button>
            <button onClick={()=>setSort('new')}>New</button>
          </div>
          {deals.map(d=> <DealCard key={d.id} deal={d} />)}
        </section>
      </main>
    </div>
  )
}
