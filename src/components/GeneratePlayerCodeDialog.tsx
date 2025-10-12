import { useState, useMemo, useCallback, useEffect, useId } from 'react';
import { Copy, Plus } from 'lucide-react';
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
import { usePlayerCodesStatic } from '@/hooks/usePlayerCodesStatic';
import { useUserProfileStatic } from '@/hooks/useUserProfileStatic';
import { useToast } from '@/hooks/use-toast';

interface GeneratePlayerCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneratePlayerCodeDialog = ({ open, onOpenChange }: GeneratePlayerCodeDialogProps) => {
  const [playerName, setPlayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // IDs únicos para os campos do formulário
  const playerNameId = useId();
  const notesId = useId();
  const generatedCodeId = useId();
  
  // Hooks estáticos - sem polling automático
  const { generateCode } = usePlayerCodesStatic();
  const { userLicense, loading: profileLoading, refetch: refetchUserProfile } = useUserProfileStatic();
  const { toast } = useToast();

  // Calcular validade baseada na licença do usuário (memoizado)
  const validityDays = useMemo(() => {
    if (!userLicense?.end_date) return 30; // Fallback padrão
    
    const now = new Date();
    const endDate = new Date(userLicense.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Retorna a diferença em dias, mas no mínimo 1 dia
    return Math.max(diffDays, 1);
  }, [userLicense?.end_date]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return; // Evitar múltiplas execuções
    
    try {
      setIsGenerating(true);
      const codeData = await generateCode(notes || undefined, validityDays);
      setGeneratedCode(codeData.code);
      
      toast({
        title: "Código Gerado com Sucesso!",
        description: "Código de integração criado e copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Erro ao Gerar Código",
        description: "Não foi possível gerar o código de integração.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generateCode, notes, validityDays, toast, isGenerating]);

  const handleCopyCode = useCallback(async () => {
    if (!generatedCode) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedCode);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = generatedCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      toast({
        title: "Código Copiado",
        description: `Código ${generatedCode} copiado para a área de transferência`,
      });
    } catch (error) {
      console.error('Error copying code:', error);
      toast({
        title: "Erro ao Copiar",
        description: "Não foi possível copiar o código. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [generatedCode, toast]);

  const handleClose = useCallback(() => {
    setPlayerName('');
    setNotes('');
    setGeneratedCode(null);
    setIsGenerating(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Efeito para recarregar o perfil do usuário quando o modal abre,
  // garantindo que as informações da licença estejam atualizadas.
  useEffect(() => {
    if (open) {
      refetchUserProfile();
    }
  }, [open, refetchUserProfile]);

  // Se o modal não estiver aberto, não renderizar nada
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Gerar Código de Integração
          </DialogTitle>
          <DialogDescription>
            Crie um código único para associar um player à sua conta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {profileLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Informações da Licença */}
              {userLicense && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      Licença Ativa
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>• <strong>Válida até:</strong> {userLicense.end_date ? new Date(userLicense.end_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p>• <strong>Players máximos:</strong> {userLicense.max_players || 0}</p>
                    <p>• <strong>Status:</strong> {userLicense.status === 'active' ? 'Ativa' : userLicense.status}</p>
                  </div>
                </div>
              )}

              {!generatedCode ? (
                <>
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

                  <Button onClick={handleGenerate} className="w-full" disabled={isGenerating}>
                    {isGenerating ? 'Gerando...' : 'Gerar Código'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={generatedCodeId}>Código de Integração:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={generatedCodeId}
                        name="generatedCode"
                        value={generatedCode}
                        readOnly
                        className="font-mono text-lg font-bold"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>• Válido até: {userLicense?.end_date ? new Date(userLicense.end_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p>• Use este código no player para associar à sua conta</p>
                    <p>• Copie e cole no campo de integração do player</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePlayerCodeDialog;