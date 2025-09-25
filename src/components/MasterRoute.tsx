import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MasterRouteProps {
  children: React.ReactNode;
}

const MasterRoute = ({ children }: MasterRouteProps) => {
  const { user, loading } = useAuth();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [checkingMaster, setCheckingMaster] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkMasterStatus = async () => {
      if (!user) {
        setCheckingMaster(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_master')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking master status:', error);
          setIsMaster(false);
        } else {
          setIsMaster(!!data?.is_master);
        }
      } catch (error) {
        console.error('Error checking master status:', error);
        setIsMaster(false);
      } finally {
        setCheckingMaster(false);
      }
    };

    if (user) {
      checkMasterStatus();
    } else {
      setCheckingMaster(false);
    }
  }, [user]);

  if (loading || checkingMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isMaster === false) {
    toast({
      title: "Acesso negado",
      description: "Apenas usuários Master podem acessar esta funcionalidade.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default MasterRoute;