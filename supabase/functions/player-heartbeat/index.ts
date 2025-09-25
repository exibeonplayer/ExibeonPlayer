import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { player_id, status, last_played, cache_info, api_key } = await req.json();

    console.log('Heartbeat received from player:', player_id);

    // Verify API key
    const { data: player, error: playerError } = await supabaseClient
      .from('players')
      .select('*')
      .eq('player_id', player_id)
      .eq('api_key', api_key)
      .single();

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Invalid player_id or api_key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update player status
    const { error: updateError } = await supabaseClient
      .from('players')
      .update({
        status: status || 'online',
        last_activity: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .eq('player_id', player_id);

    if (updateError) {
      throw updateError;
    }

    // Log heartbeat
    await supabaseClient
      .from('player_logs')
      .insert({
        player_id,
        type: 'heartbeat',
        message: 'Heartbeat received',
        details: JSON.stringify({ status, last_played, cache_info }),
        severity: 'info'
      });

    // Check for pending commands
    const { data: commands, error: commandsError } = await supabaseClient
      .from('player_commands')
      .select('*')
      .eq('player_id', player_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (commandsError) {
      throw commandsError;
    }

    // Mark commands as sent
    if (commands && commands.length > 0) {
      const commandIds = commands.map(cmd => cmd.id);
      await supabaseClient
        .from('player_commands')
        .update({ status: 'sent', executed_at: new Date().toISOString() })
        .in('id', commandIds);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        commands: commands || [],
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});