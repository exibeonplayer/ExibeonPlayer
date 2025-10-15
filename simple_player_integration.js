// ========================================================================
// INTEGRAÇÃO SIMPLES DO PLAYER - SISTEMA MODERNO
// ========================================================================
// Use este arquivo para integrar seu player com o sistema moderno

// CONFIGURAÇÃO - SUBSTITUA PELOS SEUS VALORES
// ========================================================================
const CONFIG = {
    // URL do Supabase (já configurada)
    supabase_url: 'https://fzgkqdhlxolcxqctillo.supabase.co',
    
    // Chave anônima do Supabase (já configurada)
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Z2txZGhseG9sY3hxY3RpbGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MTU4MjIsImV4cCI6MjA1MjA5MTgyMn0.HrqJ7X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X',
    
    // SUBSTITUA PELO CÓDIGO GERADO NO FRONTEND:
    integration_code: 'SEU_CODIGO_AQUI', // Ex: 'EXB123ABC'
    
    // ID único do seu dispositivo:
    player_id: 'teste-player-device-001',
    
    // Nome do player:
    player_name: 'teste Player',
    
    // IP do seu dispositivo:
    ip_address: '192.168.1.100'
};

// ESTADO DO PLAYER
// ========================================================================
let isAssociated = false;
let statsInterval = null;

// FUNÇÕES PRINCIPAIS
// ========================================================================

// 1. ASSOCIAR PLAYER AO SISTEMA
async function associatePlayer() {
    console.log('🔗 Associando player ao sistema...');
    
    try {
        const response = await fetch(`${CONFIG.supabase_url}/functions/v1/associate-player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.supabase_anon_key}`
            },
            body: JSON.stringify({
                integration_code: CONFIG.integration_code,  // ← Mantém compatibilidade
                player_code: CONFIG.integration_code,       // ← Adiciona campo esperado
                player_id: CONFIG.player_id,
                player_name: CONFIG.player_name,
                device_info: {
                    model: "Raspberry Pi 4",
                    os: "Raspberry Pi OS",
                    version: "1.0.0"
                },
                ip_address: CONFIG.ip_address
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na associação: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Player associado com sucesso:', result);
        isAssociated = true;
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao associar player:', error);
        return false;
    }
}

// 2. ENVIAR STATS DO PLAYER
async function sendPlayerStats() {
    if (!isAssociated) {
        console.log('⚠️ Player não está associado. Tentando associar...');
        const associated = await associatePlayer();
        if (!associated) return;
    }

    // Simular dados do player (substitua pelas suas funções reais)
    const stats = {
        player_id: CONFIG.player_id,
        integration_code: CONFIG.integration_code,
        stats: {
            is_online: true,
            video_title: getCurrentVideoTitle(),
            playback_time: getCurrentPlaybackTime(),
            total_time: getTotalVideoTime(),
            volume: getCurrentVolume(),
            cpu_usage: getCpuUsage(),
            memory_usage: getMemoryUsage()
        }
    };

    try {
        const response = await fetch(`${CONFIG.supabase_url}/functions/v1/update-player-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.supabase_anon_key}`
            },
            body: JSON.stringify(stats)
        });

        if (!response.ok) {
            throw new Error(`Erro ao enviar stats: ${response.status}`);
        }

        console.log('📊 Stats enviados com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao enviar stats:', error);
        isAssociated = false; // Marcar para re-associação
    }
}

// 3. INICIAR SISTEMA
async function startPlayer() {
    console.log('🚀 Iniciando player...');
    
    // Associar player
    const associated = await associatePlayer();
    if (!associated) {
        console.error('❌ Falha na associação. Verifique o código de integração.');
        return;
    }
    
    // Iniciar envio de stats
    console.log('📊 Iniciando envio de stats a cada 10 segundos...');
    sendPlayerStats(); // Enviar imediatamente
    
    // Configurar intervalo
    statsInterval = setInterval(sendPlayerStats, 10000);
    
    console.log('✅ Player iniciado com sucesso!');
    console.log('📱 Verifique no frontend /players se o player aparece');
}

// 4. PARAR SISTEMA
function stopPlayer() {
    console.log('⏹️ Parando player...');
    
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
    
    isAssociated = false;
    console.log('✅ Player parado');
}

// FUNÇÕES PARA OBTER DADOS DO SISTEMA (IMPLEMENTE CONFORME SEU PLAYER)
// ========================================================================

function getCurrentVideoTitle() {
    // IMPLEMENTE: Retornar título do vídeo atual
    // Exemplo: return videoPlayer.currentVideo?.title || 'Nenhum vídeo';
    return 'Vídeo de Teste.mp4';
}

function getCurrentPlaybackTime() {
    // IMPLEMENTE: Retornar tempo atual de reprodução em milissegundos
    // Exemplo: return videoPlayer.currentTime * 1000;
    return Math.floor(Math.random() * 300000); // 0-5 minutos
}

function getTotalVideoTime() {
    // IMPLEMENTE: Retornar duração total do vídeo em milissegundos
    // Exemplo: return videoPlayer.duration * 1000;
    return 300000; // 5 minutos
}

function getCurrentVolume() {
    // IMPLEMENTE: Retornar volume atual (0-100)
    // Exemplo: return audioPlayer.volume * 100;
    return 75; // 75%
}

function getCpuUsage() {
    // IMPLEMENTE: Retornar uso de CPU (0-100)
    // Para Raspberry Pi: cat /proc/loadavg
    return Math.random() * 50 + 20; // 20-70%
}

function getMemoryUsage() {
    // IMPLEMENTE: Retornar uso de memória (0-100)
    // Para Raspberry Pi: free -m
    return Math.random() * 40 + 30; // 30-70%
}

// EXECUÇÃO AUTOMÁTICA
// ========================================================================

// Verificar se todas as configurações estão definidas
function validateConfig() {
    if (CONFIG.integration_code === 'SEU_CODIGO_AQUI') {
        console.error('❌ ERRO: Substitua CONFIG.integration_code pelo código gerado no frontend!');
        console.log('📝 Passos:');
        console.log('1. Vá para /players no frontend');
        console.log('2. Clique em "Gerar Código"');
        console.log('3. Anote o código gerado');
        console.log('4. Substitua "SEU_CODIGO_AQUI" pelo código real');
        return false;
    }
    return true;
}

// Inicializar quando o script for executado
if (validateConfig()) {
    console.log('🔧 Configuração válida. Iniciando player...');
    startPlayer();
    
    // Parar após 2 minutos para teste
    setTimeout(() => {
        console.log('⏹️ Parando após 2 minutos para teste...');
        stopPlayer();
        process.exit(0);
    }, 120000);
} else {
    console.error('❌ Configuração inválida. Corrija antes de executar novamente.');
    process.exit(1);
}

// Tratamento de sinais para cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, parando player...');
    stopPlayer();
    process.exit(0);
});

// ========================================================================
// INSTRUÇÕES DE USO:
// ========================================================================
// 
// 1. SUBSTITUA CONFIG.integration_code pelo código gerado no frontend:
//    - Vá para /players
//    - Clique "Gerar Código"
//    - Anote o código (ex: EXB123ABC)
//    - Substitua 'SEU_CODIGO_AQUI' pelo código real
// 
// 2. IMPLEMENTE as funções de dados do seu player:
//    - getCurrentVideoTitle()
//    - getCurrentPlaybackTime()
//    - getTotalVideoTime()
//    - getCurrentVolume()
//    - getCpuUsage()
//    - getMemoryUsage()
// 
// 3. EXECUTE o script:
//    node simple_player_integration.js
// 
// 4. VERIFIQUE no frontend /players se o player aparece
// 
// 5. OBSERVE os logs para ver se os dados estão sendo enviados
// 
// ========================================================================
