import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  rental_id: string
  amount: number
  phone: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Set the user context for RLS
    await supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    })

    const { rental_id, amount, phone }: PaymentRequest = await req.json()

    console.log('Processing payment request:', { rental_id, amount, phone })

    // In a real implementation, you would integrate with Opay API here
    // For now, we'll simulate a successful payment
    const payment_reference = `opay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        rental_id,
        amount,
        payment_method: 'opay',
        payment_reference,
        status: 'completed' // In real implementation, this would be 'pending' initially
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      throw transactionError
    }

    // Update rental with total amount
    const { error: rentalError } = await supabaseClient
      .from('rentals')
      .update({ total_amount: amount })
      .eq('id', rental_id)

    if (rentalError) {
      console.error('Rental update error:', rentalError)
      throw rentalError
    }

    console.log('Payment processed successfully:', transaction)

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        payment_reference,
        message: 'Payment processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})