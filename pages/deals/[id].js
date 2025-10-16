import { supabase } from '../../lib/supabase'
import Header from '../../components/Header'
import CommentList from '../../components/CommentList'

export async function getServerSideProps({ params }){
  const { data: deal } = await supabase.from('deals').select('*').eq('id', params.id).single()
  const { data: comments } = await supabase.from('comments').select('*').eq('deal_id', params.id).order('created_at',{ascending:false})
  return { props: { deal, comments } }
}

export default function DealPage({deal, comments, session}){
  if(!deal) return <div>Not found</div>
  return (
    <div>
      <Header session={session} />
      <main className="container">
        <article>
          <h1>{deal.title}</h1>
          <img src={deal.image_url || '/placeholder.png'} alt="" />
          <p>{deal.description}</p>
          <a className="go" href={`/api/redirect/${deal.id}`}>Go to offer</a>
        </article>
        <aside>
          <CommentList dealId={deal.id} initialComments={comments} />
        </aside>
      </main>
    </div>
  )
}
