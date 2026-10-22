import {useContext} from 'react';
import {PlatformRoleContext} from '@/contexts/PlatformRoleContext';
export type {PlatformRole} from '@/contexts/PlatformRoleContext';
export function usePlatformRole() {
  const state=useContext(PlatformRoleContext);
  if(!state)throw new Error('usePlatformRole deve ser usado dentro de PlatformRoleProvider');
  return state;
}
