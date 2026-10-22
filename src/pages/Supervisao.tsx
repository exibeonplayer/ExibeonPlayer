import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ManagedPlayers from '@/components/ManagedPlayers';
import { usePlatformRole } from '@/hooks/usePlatformRole';
export default function Supervisao(){
  const {role,loading}=usePlatformRole();
  if(loading)return <p role="status">Verificando acesso…</p>;
  if(role!=='admin')return <Navigate to="/players" replace/>;
  return <Layout><ManagedPlayers supervision/></Layout>;
}
