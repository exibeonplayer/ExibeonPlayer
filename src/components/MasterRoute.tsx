import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformRole } from '@/hooks/usePlatformRole';
export default function MasterRoute({children}:{children:React.ReactNode}){
 const {user,loading}=useAuth();const role=usePlatformRole();
 if(loading||role.loading)return <p role="status">Verificando acesso…</p>;
 if(!user)return <Navigate to="/login" replace/>;
 if(role.role!=='admin')return <Navigate to="/players" replace/>;
 return <>{children}</>;
}
