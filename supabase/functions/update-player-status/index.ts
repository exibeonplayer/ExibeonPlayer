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
      session_id,
      video_id,
      video_title,
      playback_time = 0,
      total_time = 0,
      is_playing = false,
      is_paused = false,
      is_online = true,
      volume = 80,
      network_status = 'unknown',
      cpu_usage = 0,
      memory_usage = 0
    } = body

    // Validate required fields
    if (!player_id || !session_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'player_id and session_id are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update player status using the database function
    const { data, error } = await supabase.rpc('update_player_status', {
      p_player_id: player_id,
      p_session_id: session_id,
      p_video_id: video_id,
      p_video_title: video_title,
      p_playback_time: playback_time,
      p_total_time: total_time,
      p_is_playing: is_playing,
      p_is_paused: is_paused,
      p_is_online: is_online,
      p_volume: volume,
      p_network_status: network_status,
      p_cpu_usage: cpu_usage,
      p_memory_usage: memory_usage
    })

    if (error) {
      console.error('Error updating player status:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
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
    console.error('Error in update-player-status:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
