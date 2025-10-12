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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { player_id, command, payload } = await req.json()

    console.log(`📡 Enviando comando ${command} para player ${player_id}`)

    // Buscar informações do player
    const { data: player, error: playerError } = await supabaseClient
      .from('players')
      .select('*')
      .eq('id', player_id)
      .single()

    if (playerError) {
      console.error('Erro ao buscar player:', playerError)
      return new Response(
        JSON.stringify({ error: 'Player não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enviar comando baseado no tipo
    if (command === 'block') {
      // Enviar comando para exibir vídeo de serviços pausados
      const blockCommand = {
        type: 'display_blocked_video',
        reason: payload?.reason || 'license_blocked',
        timestamp: new Date().toISOString()
      }

      console.log(`🔒 Bloqueando player ${player.name} - Motivo: ${payload?.reason}`)

      // Aqui você pode implementar a lógica para:
      // 1. Parar reprodução atual
      // 2. Exibir vídeo de serviços pausados
      // 3. Desabilitar funcionalidades do player

      // Registrar comando na tabela player_commands
      const { error: commandError } = await supabaseClient
        .from('player_commands')
        .insert([{
          player_id: player_id,
          command: 'block',
          payload: blockCommand,
          status: 'sent'
        }])

      if (commandError) {
        console.error('Erro ao registrar comando:', commandError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Comando de bloqueio enviado para ${player.name}`,
          command: blockCommand
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (command === 'unblock') {
      // Enviar comando para reativar reprodução normal
      const unblockCommand = {
        type: 'resume_normal_playback',
        reason: payload?.reason || 'license_unblocked',
        timestamp: new Date().toISOString()
      }

      console.log(`🔓 Desbloqueando player ${player.name} - Motivo: ${payload?.reason}`)

      // Registrar comando na tabela player_commands
      const { error: commandError } = await supabaseClient
        .from('player_commands')
        .insert([{
          player_id: player_id,
          command: 'unblock',
          payload: unblockCommand,
          status: 'sent'
        }])

      if (commandError) {
        console.error('Erro ao registrar comando:', commandError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Comando de desbloqueio enviado para ${player.name}`,
          command: unblockCommand
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Comando não reconhecido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
