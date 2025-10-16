import Link from 'next/link'

export default function DealCard({deal}){
  return (
    <div className="deal-card">
      <img src={deal.image_url || '/placeholder.png'} alt="" />
      <div className="deal-body">
        <h3><Link href={`/deals/${deal.id}`}><a>{deal.title}</a></Link></h3>
        <p className="desc">{deal.description?.slice(0,140)}</p>
        <div className="meta">
          <span className="votes">🔥 {deal.votes}</span>
          <a className="go" href={`/api/redirect/${deal.id}`} rel="noreferrer">Go to offer</a>
        </div>
      </div>
    </div>
  )
}
