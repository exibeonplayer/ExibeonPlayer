import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const lastTriggerRef = useRef<number>(0);

  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    // Evitar triggers muito frequentes (mínimo 500ms entre triggers)
    if (now - lastTriggerRef.current < 500) {
      console.log('🔄 RefreshContext: Ignorando trigger muito frequente');
      return;
    }
    
    lastTriggerRef.current = now;
    console.log('🔄 RefreshContext: Triggering global refresh');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};
