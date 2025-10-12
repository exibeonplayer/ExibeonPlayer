// ========================================================================
// EXEMPLO DE INTEGRAÇÃO DO PLAYER COM O SISTEMA MODERNO
// ========================================================================
// Este arquivo mostra como configurar seu player para enviar dados
// para o sistema Exibeon Player usando a nova estrutura.

// CONFIGURAÇÃO
// ========================================================================
const CONFIG = {
    // URLs do Supabase (substitua pelas suas)
    supabase_url: 'https://fzgkqdhlxolcxqctillo.supabase.co',
    supabase_anon_key: 'sua_chave_anonima_aqui',
    
    // Dados do seu player
    integration_code: 'CODIGO_GERADO_NO_FRONTEND', // Gere no frontend
    player_id: 'raspberry-pi-001', // ID único do seu dispositivo
    device_name: 'Player Principal',
    
    // Intervalos (em milissegundos)
    heartbeat_interval: 10000, // 10 segundos
    stats_interval: 10000,     // 10 segundos
    
    // Dados do dispositivo
    device_info: {
        model: 'Raspberry Pi 4',
        os: 'Raspberry Pi OS',
        version: '1.0.0',
        location: 'Sala Principal'
    }
};

// CLASSE PRINCIPAL DO PLAYER
// ========================================================================
class ExibeonPlayer {
    constructor(config) {
        this.config = config;
        this.isAssociated = false;
        this.currentVideo = null;
        this.statsInterval = null;
        this.heartbeatInterval = null;
        
        console.log('🚀 Inicializando Exibeon Player...');
    }

    // INICIALIZAÇÃO
    // ========================================================================
    async initialize() {
        try {
            console.log('📡 Conectando ao sistema...');
            
            // 1. Associar player ao sistema
            await this.associatePlayer();
            
            // 2. Iniciar envio de stats
            this.startStatsReporting();
            
            console.log('✅ Player inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    // ASSOCIAR PLAYER AO SISTEMA
    // ========================================================================
    async associatePlayer() {
        try {
            const response = await fetch(`${this.config.supabase_url}/functions/v1/associate-player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.supabase_anon_key}`
                },
                body: JSON.stringify({
                    integration_code: this.config.integration_code,
                    player_id: this.config.player_id,
                    device_info: this.config.device_info
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na associação: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Player associado:', result);
            this.isAssociated = true;
            
        } catch (error) {
            console.error('❌ Erro ao associar player:', error);
            throw error;
        }
    }

    // ENVIAR STATS DO PLAYER
    // ========================================================================
    async sendPlayerStats() {
        if (!this.isAssociated) {
            console.warn('⚠️ Player não está associado. Tentando associar...');
            try {
                await this.associatePlayer();
            } catch (error) {
                console.error('❌ Falha na re-associação:', error);
                return;
            }
        }

        try {
            const stats = {
                player_id: this.config.player_id,
                integration_code: this.config.integration_code,
                stats: {
                    is_online: true,
                    video_title: this.getCurrentVideoTitle(),
                    playback_time: this.getCurrentPlaybackTime(),
                    total_time: this.getTotalVideoTime(),
                    volume: this.getCurrentVolume(),
                    cpu_usage: await this.getCpuUsage(),
                    memory_usage: await this.getMemoryUsage()
                }
            };

            const response = await fetch(`${this.config.supabase_url}/functions/v1/update-player-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.supabase_anon_key}`
                },
                body: JSON.stringify(stats)
            });

            if (!response.ok) {
                throw new Error(`Erro ao enviar stats: ${response.status}`);
            }

            console.log('📊 Stats enviados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao enviar stats:', error);
            this.isAssociated = false; // Marcar para re-associação
        }
    }

    // INICIAR RELATÓRIO DE STATS
    // ========================================================================
    startStatsReporting() {
        console.log(`🔄 Iniciando relatório de stats a cada ${this.config.stats_interval/1000}s`);
        
        // Enviar stats imediatamente
        this.sendPlayerStats();
        
        // Configurar intervalo
        this.statsInterval = setInterval(() => {
            this.sendPlayerStats();
        }, this.config.stats_interval);
    }

    // PARAR RELATÓRIO DE STATS
    // ========================================================================
    stopStatsReporting() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
            console.log('⏹️ Relatório de stats parado');
        }
    }

    // MÉTODOS PARA OBTER DADOS DO SISTEMA (IMPLEMENTE CONFORME SEU PLAYER)
    // ========================================================================
    
    getCurrentVideoTitle() {
        // Implemente para retornar o título do vídeo atual
        // Exemplo: return this.currentVideo ? this.currentVideo.title : 'Nenhum vídeo';
        return this.currentVideo || 'Vídeo de Teste.mp4';
    }

    getCurrentPlaybackTime() {
        // Implemente para retornar tempo atual de reprodução em milissegundos
        // Exemplo: return this.videoPlayer.currentTime * 1000;
        return Math.floor(Math.random() * 300000); // Exemplo: 0-5 minutos
    }

    getTotalVideoTime() {
        // Implemente para retornar duração total do vídeo em milissegundos
        // Exemplo: return this.videoPlayer.duration * 1000;
        return 300000; // Exemplo: 5 minutos
    }

    getCurrentVolume() {
        // Implemente para retornar volume atual (0-100)
        // Exemplo: return this.audioPlayer.volume * 100;
        return 75; // Exemplo: 75%
    }

    async getCpuUsage() {
        // Implemente para retornar uso de CPU (0-100)
        // No Raspberry Pi, você pode usar: cat /proc/loadavg
        try {
            // Exemplo usando comando do sistema
            const { exec } = require('child_process');
            return new Promise((resolve) => {
                exec("cat /proc/loadavg", (error, stdout) => {
                    if (error) {
                        resolve(Math.random() * 50 + 20); // Fallback: 20-70%
                    } else {
                        const load = parseFloat(stdout.split(' ')[0]);
                        resolve(Math.min(load * 100, 100)); // Converter para porcentagem
                    }
                });
            });
        } catch (error) {
            return Math.random() * 50 + 20; // Fallback: 20-70%
        }
    }

    async getMemoryUsage() {
        // Implemente para retornar uso de memória (0-100)
        // No Raspberry Pi, você pode usar: free -m
        try {
            const { exec } = require('child_process');
            return new Promise((resolve) => {
                exec("free -m", (error, stdout) => {
                    if (error) {
                        resolve(Math.random() * 40 + 30); // Fallback: 30-70%
                    } else {
                        const lines = stdout.split('\n');
                        const memLine = lines[1].split(/\s+/);
                        const total = parseInt(memLine[1]);
                        const used = parseInt(memLine[2]);
                        resolve((used / total) * 100);
                    }
                });
            });
        } catch (error) {
            return Math.random() * 40 + 30; // Fallback: 30-70%
        }
    }

    // MÉTODOS PARA CONTROLAR REPRODUÇÃO
    // ========================================================================
    
    setCurrentVideo(videoTitle) {
        this.currentVideo = videoTitle;
        console.log(`🎬 Vídeo alterado para: ${videoTitle}`);
    }

    // DESTRUIÇÃO/CLEANUP
    // ========================================================================
    destroy() {
        console.log('🛑 Destruindo player...');
        this.stopStatsReporting();
        this.isAssociated = false;
    }
}

// EXEMPLO DE USO
// ========================================================================
async function main() {
    // Criar instância do player
    const player = new ExibeonPlayer(CONFIG);
    
    // Inicializar
    try {
        await player.initialize();
        
        // Simular mudança de vídeo após 30 segundos
        setTimeout(() => {
            player.setCurrentVideo('Vídeo Promocional.mp4');
        }, 30000);
        
        // Simular parada após 2 minutos (para teste)
        setTimeout(() => {
            console.log('⏹️ Parando player para teste...');
            player.destroy();
            process.exit(0);
        }, 120000);
        
    } catch (error) {
        console.error('❌ Falha na inicialização:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, parando player...');
    if (global.player) {
        global.player.destroy();
    }
    process.exit(0);
});

// Executar se for o arquivo principal
if (require.main === module) {
    global.player = null;
    main().then(() => {
        global.player = new ExibeonPlayer(CONFIG);
        return global.player.initialize();
    }).catch(console.error);
}

// Exportar para uso em outros módulos
module.exports = ExibeonPlayer;

// ========================================================================
// INSTRUÇÕES DE USO:
// ========================================================================
// 
// 1. Configure as variáveis em CONFIG:
//    - supabase_url: URL do seu projeto Supabase
//    - supabase_anon_key: Chave anônima do Supabase
//    - integration_code: Código gerado no frontend
//    - player_id: ID único do seu dispositivo
// 
// 2. Implemente os métodos de obtenção de dados:
//    - getCurrentVideoTitle(): Título do vídeo atual
//    - getCurrentPlaybackTime(): Tempo de reprodução atual
//    - getTotalVideoTime(): Duração total do vídeo
//    - getCurrentVolume(): Volume atual
//    - getCpuUsage(): Uso de CPU
//    - getMemoryUsage(): Uso de memória
// 
// 3. Execute o script:
//    node player_integration_example.js
// 
// 4. Verifique no frontend (/players) se o player aparece
// 
// 5. Observe os logs para ver se os dados estão sendo enviados
// 
// ========================================================================
