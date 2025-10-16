// Server-side redirect handler: increments click count then redirects to target link stored in 'link' or 'affiliate_link'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res){
  const { id } = req.query
  // find deal
  const { data: deal } = await supabaseAdmin.from('deals').select('id, link, affiliate_link').eq('id', id).maybeSingle()
  if(!deal) return res.status(404).send('Not found')
  const target = deal.affiliate_link || deal.link
  // increment counter in redirects table (or create)
  await supabaseAdmin.from('redirects').insert([{deal_id: id, target}])
  res.redirect(target)
}
