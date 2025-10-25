// Server-side redirect handler: increments click count then redirects to target link stored in 'url' or 'product_url'
import { createClient } from '@supabase/supabase-js'

// initialize supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    const { id } = req.query

    // find the deal and get correct columns
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, url, product_url')
      .eq('id', id)
      .maybeSingle()

    if (dealError) {
      console.error('Error fetching deal:', dealError)
      return res.status(500).send('Internal server error')
    }

    if (!deal) {
      console.warn('Deal not found:', id)
      return res.status(404).send('Deal not found')
    }

    const target = deal.product_url || deal.url

    if (!target) {
      console.warn('No valid target URL found for deal:', id)
      return res.status(400).send('No valid URL found for this deal')
    }

    // log redirect for analytics
    const { error: insertError } = await supabaseAdmin
      .from('redirects')
      .insert([{ deal_id: id, target }])

    if (insertError) console.error('Redirect logging failed:', insertError)

    // safely redirect to target
    res.writeHead(302, { Location: target })
    res.end()
  } catch (err) {
    console.error('Unexpected redirect error:', err)
    res.status(500).send('Internal Server Error')
  }
}
