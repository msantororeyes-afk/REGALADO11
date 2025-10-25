// Server-side redirect handler: increments click count then redirects to target link stored in 'url' or 'product_url'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { id } = req.query

  // find deal
  const { data: deal, error } = await supabaseAdmin
    .from('deals')
    .select('id, url, product_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !deal) {
    console.error('Redirect error:', error)
    return res.status(404).send('Deal not found')
  }

  const target = deal.product_url || deal.url
  if (!target) return res.status(400).send('No valid URL found')

  // increment counter in redirects or clicks table
  await supabaseAdmin
    .from('deals')
    .update({ clicks: supabaseAdmin.rpc('increment', { x: 1 }) })
    .eq('id', id)
    .select()

  // fallback insert to log redirect (optional)
  await supabaseAdmin.from('redirects').insert([{ deal_id: id, target }])

  // redirect
  res.redirect(target)
}
