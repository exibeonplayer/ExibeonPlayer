import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';
import { LicenseStatusInfo } from '@/hooks/useLicenseStatus';
import PaymentRequiredModal from './PaymentRequiredModal';

interface LicenseRestrictedProps {
  children: React.ReactNode;
  licenseStatus: LicenseStatusInfo;
  fallbackMessage?: string;
  showContactButton?: boolean;
}

const LicenseRestricted: React.FC<LicenseRestrictedProps> = ({
  children,
  licenseStatus,
  fallbackMessage = "Esta funcionalidade está restrita devido ao status da sua licença.",
  showContactButton = false, // Padrão para false, mas pode ser ativado quando necessário
}) => {
  const [showModal, setShowModal] = useState(false);

  // Se a licença está ativa, mostrar o conteúdo normalmente
  if (licenseStatus.isActive) {
    return <>{children}</>;
  }

  // Se não está ativa, mostrar restrição sutil
  return (
    <div className="relative">
      {/* Overlay sutil de bloqueio */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg">
        <div className="flex items-center justify-center h-full">
          <div className="p-2 bg-muted/70 rounded-full">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Conteúdo original (desabilitado) */}
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>
      
      {/* Modal de pagamento (mantido para casos específicos) */}
      <PaymentRequiredModal
        open={showModal}
        onOpenChange={setShowModal}
        licenseStatus={licenseStatus}
      />
    </div>
  );
};

export default LicenseRestricted;
