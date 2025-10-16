import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

export default function Submit({session}){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [category, setCategory] = useState('Tech & Electronics')

  async function submit(){
    const u = (await supabase.auth.getUser()).data.user
    if(!u) return alert('Please sign in')
    const { data, error } = await supabase.from('deals').insert([{title, description, link, category, posted_by: u.id}]).select().single()
    if(error) return alert(error.message)
    alert('Submitted!')
    location.href='/'
  }

  return (
    <div>
      <Header session={session} />
      <main className="container">
        <h1>Submit a deal</h1>
        <label>Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} />
        <label>Link</label>
        <input value={link} onChange={e=>setLink(e.target.value)} />
        <label>Category</label>
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option>Tech & Electronics</option>
          <option>Fashion</option>
          <option>Housing</option>
          <option>Groceries</option>
          <option>Travel</option>
        </select>
        <button onClick={submit}>Submit</button>
      </main>
    </div>
  )
}
