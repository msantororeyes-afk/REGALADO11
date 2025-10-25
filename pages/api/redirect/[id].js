// Server-side redirect handler: increments click count then redirects to target link stored in 'product_url' or 'affiliate_link'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    const { id } = req.query

    // 🟢 Fetch the deal using the actual column names
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, product_url, affiliate_link')
      .eq('id', id)
      .maybeSingle()

    if (dealError || !deal) {
      console.error('Deal fetch error:', dealError)
      return res.status(404).json({ message: 'Error fetching deal', details: dealError?.message })
    }

    const target = deal.affiliate_link || deal.product_url

    if (!target) {
      return res.status(400).json({ message: 'Deal has no valid URL' })
    }

    // 🟢 Optionally record the redirect event
    const { error: insertError } = await supabaseAdmin
      .from('redirects')
      .insert([{ deal_id: id, target }])

    if (insertError) console.warn('Redirect log failed:', insertError)

    // 🟢 Redirect to target
    res.redirect(target)
  } catch (err) {
    console.error('Redirect handler error:', err)
    res.status(500).json({ message: 'Unexpected error', details: err.message })
  }
}
