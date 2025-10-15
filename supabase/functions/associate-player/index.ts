import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { 
      player_id, 
      player_name, 
      player_code, 
      integration_code,  // ← Adicionar suporte para integration_code
      device_info = {}, 
      ip_address 
    } = body

    // Use integration_code se player_code não estiver presente
    const codeToUse = player_code || integration_code;

    // Validate required fields
    if (!player_id || !player_name || !codeToUse) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'player_id, player_name, and player_code (or integration_code) are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Associate player using the database function
    const { data, error } = await supabase.rpc('associate_player', {
      p_player_id: player_id,
      p_player_name: player_name,
      p_player_code: codeToUse,  // ← Usar o código correto
      p_device_info: device_info,
      p_ip_address: ip_address
    })

    if (error) {
      console.error('Error associating player:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in associate-player:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
