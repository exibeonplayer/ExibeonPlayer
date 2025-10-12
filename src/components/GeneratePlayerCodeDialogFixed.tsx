import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { usePlayerCodes } from '@/hooks/usePlayerCodes';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

interface GeneratePlayerCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneratePlayerCodeDialogFixed = ({ open, onOpenChange }: GeneratePlayerCodeDialogProps) => {
  const [playerName, setPlayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Hooks condicionais - só executam quando o modal está aberto
  const { generateCode } = usePlayerCodes();
  const { userLicense, loading: profileLoading } = useUserProfile();
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
        title: "Erro",
        description: "Erro ao gerar código de integração",
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
        title: "Erro",
        description: "Erro ao copiar código",
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

  // Reset do estado quando o modal fecha
  useEffect(() => {
    if (!open) {
      setPlayerName('');
      setNotes('');
      setGeneratedCode(null);
      setIsGenerating(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
          {!generatedCode ? (
            <>
              {/* Informações da Licença */}
              {profileLoading ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : userLicense ? (
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
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Sem Licença
                    </Badge>
                  </div>
                  <div className="text-sm text-yellow-700">
                    <p>• Código será válido por 30 dias (padrão)</p>
                    <p>• Entre em contato para ativar sua licença</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="player-name">Nome do Player (Opcional)</Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ex: Player Sala 01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Player da sala principal"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Gerando...' : 'Gerar Código'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">
                    Código Gerado
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Código de Integração:</Label>
                  <div className="flex items-center gap-2">
                    <Input
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
                  <p>• Válido até: {userLicense?.end_date ? new Date(userLicense.end_date).toLocaleDateString('pt-BR') : '30 dias'}</p>
                  <p>• Use este código no player para associar à sua conta</p>
                  <p>• Copie e cole no campo de integração do player</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={handleCopyCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePlayerCodeDialogFixed;
