import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CommentList({dealId, initialComments}){
  const [comments, setComments] = useState(initialComments || [])
  const [text, setText] = useState('')

  async function post(){
    const user = (await supabase.auth.getUser()).data.user
    if(!user) return alert('Please login')
    const { data, error } = await supabase.from('comments').insert([{deal_id: dealId, user_id: user.id, body: text}]).select().single()
    if(error) return alert(error.message)
    setComments([data, ...comments])
    setText('')
  }

  return (
    <div>
      <h4>Comments</h4>
      <div className="new-comment">
        <textarea value={text} onChange={e=>setText(e.target.value)} />
        <button onClick={post}>Post</button>
      </div>
      <ul>
        {comments.map(c=> (
          <li key={c.id}><strong>{c.user_id}</strong>: {c.body}</li>
        ))}
      </ul>
    </div>
  )
}
