import { useState, useCallback, useId, useRef, memo } from 'react';
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AssociatePlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssociatePlayerModal = memo(({ open, onOpenChange }: AssociatePlayerModalProps) => {
  // Estados locais
  const [playerCode, setPlayerCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const [associationStatus, setAssociationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [userLicense, setUserLicense] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Refs para evitar re-renders
  const hasLoadedLicense = useRef(false);
  const isInitialized = useRef(false);

  // IDs únicos estáticos
  const playerCodeId = useId();
  const playerNameId = useId();
  const notesId = useId();

  const { user } = useAuth();
  const { toast } = useToast();

  // Função estável para buscar licença
  const loadUserLicense = useCallback(async () => {
    if (!user || hasLoadedLicense.current) return;

    try {
      hasLoadedLicense.current = true;
      setLoading(true);

      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id);

      if (licenseError) {
        console.error('Error fetching license:', licenseError);
      } else if (licenseData && licenseData.length > 0) {
        setUserLicense(licenseData[0]);
      }
    } catch (error) {
      console.error('Error fetching license:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Função estável para associar player
  const handleAssociatePlayer = useCallback(async () => {
    if (!user || !playerCode.trim() || isAssociating) return;

    try {
      setIsAssociating(true);
      setAssociationStatus('idle');
      setErrorMessage('');

      // Validar formato do código (EXB + 6 caracteres)
      const codePattern = /^EXB[A-Z0-9]{6}$/;
      if (!codePattern.test(playerCode.trim().toUpperCase())) {
        throw new Error('Código inválido. Use o formato: EXB + 6 caracteres (ex: EXB123ABC)');
      }

      // Verificar se o código existe e está válido
      const { data: codeData, error: codeError } = await supabase
        .from('player_codes')
        .select('*')
        .eq('code', playerCode.trim().toUpperCase())
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        throw new Error('Código não encontrado ou já utilizado');
      }

      // Verificar se o código não expirou
      const now = new Date();
      const expiresAt = new Date(codeData.expires_at);
      if (now > expiresAt) {
        throw new Error('Código expirado. Gere um novo código no player.');
      }

      // Verificar se o código pertence ao usuário atual
      if (codeData.user_id !== user.id) {
        throw new Error('Este código não pertence à sua conta');
      }

      // Associar o player
      const { data, error } = await supabase
        .from('players')
        .insert([{
          user_id: user.id,
          name: playerName.trim() || `Player ${playerCode}`,
          status: 'never_accessed',
          notes: notes.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      // Marcar o código como usado
      await supabase
        .from('player_codes')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          player_id: data.id
        })
        .eq('code', playerCode.trim().toUpperCase());

      setAssociationStatus('success');

      toast({
        title: "Player Associado com Sucesso!",
        description: `Player "${data.name}" foi associado à sua conta`,
      });
    } catch (error) {
      console.error('Error associating player:', error);
      setAssociationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');

      toast({
        title: "Erro ao Associar Player",
        description: error instanceof Error ? error.message : "Não foi possível associar o player.",
        variant: "destructive",
      });
    } finally {
      setIsAssociating(false);
    }
  }, [user?.id, playerCode, playerName, notes, isAssociating, toast]);

  const handleClose = useCallback(() => {
    // Reset todos os estados
    setPlayerCode('');
    setPlayerName('');
    setNotes('');
    setIsAssociating(false);
    setAssociationStatus('idle');
    setErrorMessage('');
    setUserLicense(null);
    setLoading(false);
    hasLoadedLicense.current = false;
    isInitialized.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  // Inicializar apenas quando o modal abre pela primeira vez
  if (open && !isInitialized.current) {
    isInitialized.current = true;
    loadUserLicense();
  }

  // Se o modal não estiver aberto, não renderizar nada
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Associar Player
          </DialogTitle>
          <DialogDescription>
            Digite o código gerado pelo player para associá-lo à sua conta
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Coluna Esquerda - Informações e Instruções */}
              <div className="space-y-4">
                {/* Informações da Licença */}
                {userLicense && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        Licença Ativa
                      </Badge>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• <strong>Válida até:</strong> {userLicense.end_date ? new Date(userLicense.end_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      <p>• <strong>Players máximos:</strong> {userLicense.max_players || 0}</p>
                      <p>• <strong>Status:</strong> {userLicense.status === 'active' ? 'Ativa' : userLicense.status}</p>
                    </div>
                  </div>
                )}

                {/* Instruções */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Instruções:</span>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>1. No player, acesse as configurações</p>
                    <p>2. Gere um código de integração</p>
                    <p>3. Digite o código abaixo</p>
                    <p>4. Clique em "Associar Player"</p>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Formulário */}
              <div className="space-y-4">
                {associationStatus !== 'success' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={playerCodeId}>Código do Player *</Label>
                      <Input
                        id={playerCodeId}
                        name="playerCode"
                        value={playerCode}
                        onChange={(e) => setPlayerCode(e.target.value.toUpperCase())}
                        placeholder="EXB123ABC"
                        className="font-mono text-lg font-bold"
                        maxLength={9}
                      />
                      <div className="text-xs text-muted-foreground">
                        Formato: EXB + 6 caracteres (ex: EXB123ABC)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={playerNameId}>Nome do Player (Opcional)</Label>
                      <Input
                        id={playerNameId}
                        name="playerName"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Ex: Player Sala 01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={notesId}>Observações (Opcional)</Label>
                      <Textarea
                        id={notesId}
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Player da sala principal"
                        rows={3}
                      />
                    </div>

                    {associationStatus === 'error' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Erro:</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleAssociatePlayer}
                      className="w-full"
                      disabled={isAssociating || !playerCode.trim()}
                    >
                      {isAssociating ? 'Associando...' : 'Associar Player'}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold text-green-800">Player Associado!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          O player foi associado à sua conta com sucesso
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• O player agora pode reproduzir suas playlists</p>
                      <p>• Você pode gerenciar o player na seção "Players"</p>
                      <p>• O código foi marcado como usado</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            {associationStatus === 'success' ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AssociatePlayerModal.displayName = 'AssociatePlayerModal';

export default AssociatePlayerModal;
