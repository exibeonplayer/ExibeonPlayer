import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatLicenseEndDate, getLicenseStatusColor } from '@/utils/licenseUtils';
import NotificationDropdown from '@/components/NotificationDropdown';
import WifiSignal from '@/components/WifiSignal';
import { usePlatformRole } from '@/hooks/usePlatformRole';
import ThemeToggle from '@/components/ThemeToggle';

const Header = () => {
  const location=useLocation();
  const {user,logout}=useAuth();
  const {profile,userLicense}=useUserProfile();
  const {role}=usePlatformRole();
  const navigationItems=[
    {name:'Painel',path:'/'},{name:'Conteúdos',path:'/conteudos'},
    {name:'Playlists',path:'/playlists'},{name:'Players',path:'/players'},
    {name:'Relatórios',path:'/relatorios'},
    ...(role==='admin'?[{name:'Supervisão',path:'/supervisao'}]:[]),
    ...(role==='admin'?[{name:'Licenças',path:'/licencas'}]:[])
  ];
  const isActive=(path:string)=>path==='/'?location.pathname==='/':location.pathname.startsWith(path);
  return <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
    <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <Link to="/" aria-label="Exibeon Player — início" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <img src="/favicon.ico" alt="" className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10"/>
        <div className="min-w-0"><span className="block truncate text-base font-semibold tracking-tight sm:text-lg">Exibeon Player</span><span className="block text-[11px] text-muted-foreground sm:text-xs">Gestão de conteúdo</span></div>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {userLicense?.end_date&&<div title="Vencimento da licença" className={`mr-1 hidden items-center gap-2 text-xs xl:flex ${getLicenseStatusColor(userLicense.status,userLicense.end_date)}`}><Calendar className="h-3.5 w-3.5"/><span>{formatLicenseEndDate(userLicense.end_date)}</span></div>}
        <NotificationDropdown/><WifiSignal/><ThemeToggle/>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menu da conta"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><User className="h-4 w-4"/></span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
            <div className="px-3 py-2"><p className="break-words text-sm font-medium">{profile?.full_name||user?.email}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{role==='admin'&&<Shield className="h-3 w-3"/>}{role==='admin'?'Master':role==='supervisor'?'Supervisor':'Usuário'}</p>{userLicense?.end_date&&<p className={`mt-2 text-xs ${getLicenseStatusColor(userLicense.status,userLicense.end_date)}`}>Licença até {formatLicenseEndDate(userLicense.end_date)}</p>}</div>
            <DropdownMenuSeparator/><DropdownMenuItem asChild><Link to="/perfil"><Settings className="mr-2 h-4 w-4"/>Perfil</Link></DropdownMenuItem>
            {role==='admin'&&<DropdownMenuItem asChild><Link to="/licencas"><Shield className="mr-2 h-4 w-4"/>Gerenciar licenças</Link></DropdownMenuItem>}
            <DropdownMenuSeparator/><DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4"/>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div className="border-t border-border/60"><nav aria-label="Navegação principal" className="management-nav mx-auto flex max-w-screen-2xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
      {navigationItems.map(item=><Button key={item.path} asChild variant={isActive(item.path)?'secondary':'ghost'} size="sm" className={`shrink-0 rounded-md px-3 text-xs sm:px-4 sm:text-sm ${isActive(item.path)?'font-semibold text-foreground':'text-muted-foreground'}`}><Link to={item.path} aria-current={isActive(item.path)?'page':undefined}>{item.name}</Link></Button>)}
    </nav></div>
  </header>;
};
export default Header;
