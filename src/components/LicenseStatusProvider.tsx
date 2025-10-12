import React, { useEffect, useState } from 'react';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import PaymentRequiredModal from './PaymentRequiredModal';

interface LicenseStatusProviderProps {
  children: React.ReactNode;
}

const LicenseStatusProvider: React.FC<LicenseStatusProviderProps> = ({ children }) => {
  const licenseStatus = useLicenseStatus();
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // Mostrar modal se a licença está expirada ou bloqueada
    if ((licenseStatus.isExpired || licenseStatus.isBlocked) && !hasShownModal) {
      console.log('🚨 Licença expirada/bloqueada detectada, mostrando modal');
      setShowModal(true);
      setHasShownModal(true);
    }

    // Resetar flag se a licença voltar a ficar ativa
    if (licenseStatus.isActive && hasShownModal) {
      console.log('✅ Licença ativada, resetando flag do modal');
      setHasShownModal(false);
    }
  }, [licenseStatus.isExpired, licenseStatus.isBlocked, licenseStatus.isActive, hasShownModal]);

  return (
    <>
      {children}
      
      {/* Modal de pagamento */}
      <PaymentRequiredModal
        open={showModal}
        onOpenChange={setShowModal}
        licenseStatus={licenseStatus}
      />
    </>
  );
};

export default LicenseStatusProvider;
