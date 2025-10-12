import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageCircle, Calendar } from 'lucide-react';
import { LicenseStatusInfo } from '@/hooks/useLicenseStatus';

interface PaymentRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseStatus: LicenseStatusInfo;
}

const PaymentRequiredModal: React.FC<PaymentRequiredModalProps> = ({
  open,
  onOpenChange,
  licenseStatus,
}) => {
  const handleWhatsAppContact = () => {
    // TODO: Adicionar o link do WhatsApp aqui quando estiver disponível
    const whatsappMessage = encodeURIComponent(
      `Olá! Preciso renovar minha licença do Exibeon Player. ` +
      `Minha licença ${licenseStatus.endDate ? `expirou em ${new Date(licenseStatus.endDate).toLocaleDateString('pt-BR')}` : 'está expirada'}. ` +
      `Podem me ajudar com a renovação?`
    );
    
    // Link placeholder - substitua pela URL real do WhatsApp
    const whatsappUrl = `https://wa.me/5511999999999?text=${whatsappMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getModalContent = () => {
    if (licenseStatus.isExpired) {
      return {
        title: "Licença Expirada",
        message: `Sua licença expirou ${licenseStatus.daysSinceExpiry ? `há ${licenseStatus.daysSinceExpiry} dias` : ''} e precisa ser renovada para continuar usando o sistema.`,
        icon: <Calendar className="w-8 h-8 text-orange-500" />,
        iconBg: "bg-orange-100",
      };
    } else if (licenseStatus.isBlocked) {
      return {
        title: "Conta Bloqueada",
        message: "Sua conta foi temporariamente bloqueada. Entre em contato para regularizar sua situação.",
        icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
        iconBg: "bg-red-100",
      };
    }
    
    return {
      title: "Pagamento Necessário",
      message: "É necessário regularizar o pagamento para continuar usando o sistema.",
      icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
      iconBg: "bg-yellow-100",
    };
  };

  const content = getModalContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">{content.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Ícone */}
          <div className={`${content.iconBg} rounded-full p-6`}>
            {content.icon}
          </div>
          
          {/* Mensagem */}
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-base text-muted-foreground leading-relaxed">
              {content.message}
            </p>
            
            {licenseStatus.endDate && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">
                  Data de vencimento
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(licenseStatus.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
          
          {/* Botões de ação */}
          <div className="flex flex-col w-full space-y-3">
            <Button 
              onClick={handleWhatsAppContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Entrar em Contato via WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full"
              size="lg"
            >
              Entendi
            </Button>
          </div>
          
          {/* Informação adicional */}
          <div className="text-center bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-medium">
              💬 Nossa equipe de suporte entrará em contato para ajudar com a renovação.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRequiredModal;
