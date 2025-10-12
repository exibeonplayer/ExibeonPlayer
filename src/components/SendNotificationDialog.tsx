import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: {
    title: string;
    message: string;
    type: 'system' | 'promotion' | 'maintenance' | 'warning' | 'update';
    target_user_id?: string;
    expires_at?: string;
  }) => Promise<boolean>;
  users: Array<{id: string, email: string, full_name?: string}>;
  sending: boolean;
}

export default function SendNotificationDialog({
  open,
  onOpenChange,
  onSend,
  users,
  sending
}: SendNotificationDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'system' | 'promotion' | 'maintenance' | 'warning' | 'update'>('system');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [hasExpiration, setHasExpiration] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;

    const notificationData = {
      title: title.trim(),
      message: message.trim(),
      type,
      target_user_id: targetType === 'specific' ? selectedUserId : undefined,
      expires_at: hasExpiration && expiresAt ? expiresAt.toISOString() : undefined
    };

    const success = await onSend(notificationData);
    
    if (success) {
      // Reset form
      setTitle('');
      setMessage('');
      setType('system');
      setTargetType('all');
      setSelectedUserId('');
      setExpiresAt(undefined);
      setHasExpiration(false);
      onOpenChange(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion': return '🎉';
      case 'maintenance': return '🔧';
      case 'warning': return '⚠️';
      case 'update': return '🔄';
      default: return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'promotion': return 'Promoção';
      case 'maintenance': return 'Manutenção';
      case 'warning': return 'Aviso';
      case 'update': return 'Atualização';
      default: return 'Sistema';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Notificação
          </DialogTitle>
          <DialogDescription>
            Envie notificações para todos os usuários ou para um usuário específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Notificação */}
          <div className="space-y-2">
            <Label>Tipo de Notificação</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo">
                  <span className="flex items-center gap-2">
                    {getTypeIcon(type)} {getTypeLabel(type)}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <span className="flex items-center gap-2">
                    📢 Sistema
                  </span>
                </SelectItem>
                <SelectItem value="promotion">
                  <span className="flex items-center gap-2">
                    🎉 Promoção
                  </span>
                </SelectItem>
                <SelectItem value="maintenance">
                  <span className="flex items-center gap-2">
                    🔧 Manutenção
                  </span>
                </SelectItem>
                <SelectItem value="warning">
                  <span className="flex items-center gap-2">
                    ⚠️ Aviso
                  </span>
                </SelectItem>
                <SelectItem value="update">
                  <span className="flex items-center gap-2">
                    🔄 Atualização
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da notificação"
              maxLength={100}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem da notificação"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 caracteres
            </p>
          </div>

          {/* Destinatário */}
          <div className="space-y-2">
            <Label>Destinatário</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all-users"
                  name="target"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                  className="w-4 h-4"
                />
                <Label htmlFor="all-users" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Todos os usuários
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="specific-user"
                  name="target"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                  className="w-4 h-4"
                />
                <Label htmlFor="specific-user" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Usuário específico
                </Label>
              </div>
            </div>

            {targetType === 'specific' && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Expiração */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has-expiration"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="has-expiration" className="cursor-pointer">
                Definir data de expiração
              </Label>
            </div>

            {hasExpiration && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiresAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sending || !title.trim() || !message.trim() || (targetType === 'specific' && !selectedUserId)}
            >
              {sending ? 'Enviando...' : 'Enviar Notificação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
