import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from './useUserProfile';

export type LicenseStatus = 'active' | 'expired' | 'blocked' | 'none';

export interface LicenseStatusInfo {
  status: LicenseStatus;
  isExpired: boolean;
  isBlocked: boolean;
  isActive: boolean;
  daysUntilExpiry?: number;
  daysSinceExpiry?: number;
  endDate?: string;
}

export const useLicenseStatus = () => {
  const { user } = useAuth();
  const { userLicense } = useUserProfile();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusInfo>({
    status: 'none',
    isExpired: false,
    isBlocked: false,
    isActive: false,
  });

  useEffect(() => {
    if (!user || !userLicense) {
      setLicenseStatus({
        status: 'none',
        isExpired: false,
        isBlocked: false,
        isActive: false,
      });
      return;
    }

    const now = new Date();
    let status: LicenseStatus = 'active';
    let isExpired = false;
    let isBlocked = false;
    let isActive = true;
    let daysUntilExpiry: number | undefined;
    let daysSinceExpiry: number | undefined;

    // Verificar se está expirado (3 dias após vencimento)
    if (userLicense.end_date) {
      const endDate = new Date(userLicense.end_date);
      const gracePeriod = new Date(endDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 dias
      
      if (now > gracePeriod) {
        isExpired = true;
        isActive = false;
        daysSinceExpiry = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Se foi bloqueada automaticamente por expiração, mostrar como expirada
        if (userLicense.status === 'suspended') {
          status = 'expired';
        } else {
          status = 'expired';
        }
      } else {
        daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Se status é explicitamente 'suspended' (bloqueio manual), considerar como bloqueado
    if (userLicense.status === 'suspended' && !isExpired) {
      status = 'blocked';
      isBlocked = true;
      isActive = false;
    }

    setLicenseStatus({
      status,
      isExpired,
      isBlocked,
      isActive,
      daysUntilExpiry,
      daysSinceExpiry,
      endDate: userLicense.end_date,
    });

    console.log(`🔍 Status da licença para ${user.email}:`, {
      status,
      isExpired,
      isBlocked,
      isActive,
      daysUntilExpiry,
      daysSinceExpiry,
      endDate: userLicense.end_date,
      originalStatus: userLicense.status,
    });

  }, [user, userLicense]);

  return licenseStatus;
};
