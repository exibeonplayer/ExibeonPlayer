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

    // Get JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const playerId = url.pathname.split('/').pop();

    if (req.method === 'POST') {
      const { command, payload } = await req.json();

      console.log(`Sending command ${command} to player ${playerId}`);

      // Validate command
      const validCommands = [
        'play_suspended', 'sync_now', 'request_logs', 'clear_cache', 
        'play_test_video', 'block_license', 'unblock_license'
      ];

      if (!validCommands.includes(command)) {
        return new Response(
          JSON.stringify({ error: 'Invalid command' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user owns this player (unless it's a license command)
      if (!['block_license', 'unblock_license'].includes(command)) {
        const { data: player, error: playerError } = await supabaseClient
          .from('players')
          .select('user_id')
          .eq('player_id', playerId)
          .single();

        if (playerError || player.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Player not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // For license commands, check if user is master
      if (['block_license', 'unblock_license'].includes(command)) {
        const { data: profile } = await supabaseClient
          .from('perfis')
          .select('papel')
          .eq('ID do usuário', user.id)
          .single();

        if (!profile || profile.papel !== 'master') {
          return new Response(
            JSON.stringify({ error: 'Master role required for license commands' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Insert command into database
      const { data, error } = await supabaseClient
        .from('player_commands')
        .insert({
          player_id: playerId,
          command,
          data: payload || {},
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the command
      await supabaseClient
        .from('player_logs')
        .insert({
          player_id: playerId,
          type: 'command',
          message: `Command ${command} sent`,
          details: JSON.stringify({ command, payload }),
          severity: 'info'
        });

      return new Response(
        JSON.stringify({ success: true, command_id: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - List commands for a player
    const { data: commands, error } = await supabaseClient
      .from('player_commands')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ commands }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing command:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});