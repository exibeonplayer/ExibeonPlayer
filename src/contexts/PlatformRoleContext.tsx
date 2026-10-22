import {createContext,useEffect,useState,ReactNode} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/integrations/supabase/client';

export type PlatformRole='customer'|'supervisor'|'admin';
export interface PlatformRoleState {userId?:string;role:PlatformRole;loading:boolean;error?:string;}
export const PlatformRoleContext=createContext<PlatformRoleState|undefined>(undefined);

export function PlatformRoleProvider({children}:{children:ReactNode}) {
  const {user,session}=useAuth();
  const [state,setState]=useState<PlatformRoleState>({role:'customer',loading:true});
  useEffect(()=>{
    let active=true,inFlight=false;
    const userId=user?.id;
    if(!userId){setState({role:'customer',loading:false});return;}
    // Navigation never resets a role already verified for this signed-in user.
    setState(previous=>previous.userId===userId?previous:{userId,role:'customer',loading:true});
    async function revalidate(){
      if(!active||inFlight)return;
      inFlight=true;
      try{
        const {data,error}=await supabase.functions.invoke('manage-devices',{body:{action:'role'}});
        if(error||!data?.success||!['customer','supervisor','admin'].includes(data.role))throw new Error('Role lookup failed');
        if(active)setState({userId,role:data.role,loading:false});
      }catch{
        if(active){
          setState({userId,role:'customer',loading:false,error:'Não foi possível confirmar as permissões da conta.'});
          console.warn('Não foi possível confirmar as permissões da conta.');
        }
      }finally{inFlight=false;}
    }
    void revalidate();
    window.addEventListener('focus',revalidate);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void revalidate();},60000);
    return ()=>{active=false;clearInterval(timer);window.removeEventListener('focus',revalidate);};
  },[user?.id,session?.access_token]);

  // Never expose the preceding account's role while a different account loads.
  const value:PlatformRoleState=!user?{role:'customer',loading:false}:
    state.userId===user.id?state:{userId:user.id,role:'customer',loading:true};
  return <PlatformRoleContext.Provider value={value}>{children}</PlatformRoleContext.Provider>;
}
