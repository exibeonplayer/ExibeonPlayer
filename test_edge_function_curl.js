// ========================================================================
// TESTAR EDGE FUNCTION ASSOCIATE-PLAYER
// ========================================================================

// Substitua pela URL da sua Edge Function
const EDGE_FUNCTION_URL = 'https://fzgkqdhlxolcxqctillo.supabase.co/functions/v1/associate-player';

// Dados do teste
const testData = {
    player_id: 2002,  // Use um ID diferente para não conflitar
    player_name: 'Player Edge Function Test',
    player_code: 'EXB2FVWZ7',  // Código real do frontend
    device_info: {
        model: 'Raspberry Pi 4',
        os: 'Raspberry Pi OS',
        version: '1.0.0'
    },
    ip_address: '192.168.1.201'
};

// Função para testar
async function testEdgeFunction() {
    try {
        console.log('🚀 Testando Edge Function...');
        console.log('📤 Dados enviados:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'  // Substitua pela sua chave
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('📥 Resposta recebida:');
        console.log('Status:', response.status);
        console.log('Resultado:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Sucesso! Player associado com sucesso!');
        } else {
            console.log('❌ Erro:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

// Executar teste
testEdgeFunction();

// ========================================================================
// INSTRUÇÕES DE USO:
// ========================================================================
/*
1. Substitua 'YOUR_SUPABASE_ANON_KEY' pela sua chave anônima do Supabase
2. Execute este arquivo no console do navegador ou Node.js
3. Verifique se a associação foi criada no banco de dados
*/

