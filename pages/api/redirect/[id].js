// Server-side redirect handler: increments click count then redirects to target link stored in 'link' or 'affiliate_link'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    const { id } = req.query

    // find deal
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, link, affiliate_link')
      .eq('id', id)
      .maybeSingle()

    if (dealError) {
      console.error('Error fetching deal:', dealError)
      return res.status(500).json({ message: 'Error fetching deal', details: dealError.message })
    }

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' })
    }

    const target = deal.affiliate_link || deal.link
    if (!target) {
      return res.status(400).json({ message: 'No valid target URL found' })
    }

    // try to record redirect (ignore if fails)
    const { error: insertError } = await supabaseAdmin
      .from('redirects')
      .insert([{ deal_id: id, target }])

    if (insertError) {
      console.warn('Redirect insert warning:', insertError.message)
      // don’t throw; still redirect even if logging fails
    }

    // safe redirect
    res.writeHead(302, { Location: target })
    res.end()
  } catch (err) {
    console.error('Unexpected error:', err)
    res.status(500).json({ message: 'Internal Server Error', details: err.message })
  }
}
