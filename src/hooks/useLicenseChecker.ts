import { useEffect } from 'react';
import { checkExpiredLicenses } from '@/utils/licenseUtils';

export const useLicenseChecker = () => {
  useEffect(() => {
    // Verificar licenças expiradas ao inicializar
    checkExpiredLicenses();

    // Configurar verificação periódica (a cada hora)
    const interval = setInterval(() => {
      checkExpiredLicenses();
    }, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, []);
};